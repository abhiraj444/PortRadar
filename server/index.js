import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { explainPort, PORT_DATABASE, PROCESS_DATABASE } from './portDatabase.js';
import { generateMarkdownReport, streamLlm, getAuditSystemPrompt, getCategorySystemPrompt } from './ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local disk audit storage directory
const auditsDir = path.join(__dirname, '..', 'audits');
if (!fs.existsSync(auditsDir)) {
  fs.mkdirSync(auditsDir, { recursive: true });
}

function saveAuditToDisk({ type = 'full-audit', title = '', content = '', reasoning = '', metadata = {}, rawMarkdown = '' }) {
  try {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    const safeTitle = (title || type).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30);
    const filename = `${dateStr}_${safeTitle}.md`;
    const filePath = path.join(auditsDir, filename);

    let fileContent = `---
type: ${type}
timestamp: ${now.toISOString()}
provider: ${metadata.provider || 'N/A'}
model: ${metadata.model || 'N/A'}
reasoningMode: ${Boolean(metadata.reasoningMode)}
---

# ${title || 'Network Security Audit'}
- **Date & Time:** ${now.toLocaleString()}
- **AI Model:** ${metadata.provider || ''} (${metadata.model || ''})
- **Reasoning Mode:** ${metadata.reasoningMode ? 'Enabled' : 'Disabled'}

`;

    if (reasoning) {
      fileContent += `## 🧠 Model Deliberation (Chain-of-Thought)\n\`\`\`\n${reasoning.trim()}\n\`\`\`\n\n---\n\n`;
    }

    fileContent += `## 🛡️ Audit Report\n${content}\n\n`;

    if (rawMarkdown) {
      fileContent += `\n---\n\n## 🔌 Snapshot of Audited Ports\n${rawMarkdown}\n`;
    }

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    return { filename, filePath, timestamp: now.toISOString() };
  } catch (err) {
    console.error('Failed to save audit to disk:', err);
    return null;
  }
}

const app = express();
const PORT = process.env.PORT || 8989;

app.use(cors());
app.use(express.json());

// In-memory scan cache (valid for 1.5 seconds)
let cache = {
  timestamp: 0,
  data: null
};

/**
 * Get all available network IPv4 interfaces and QR codes
 */
async function getNetworkInterfaces() {
  const nets = os.networkInterfaces();
  const results = [];
  const hostname = os.hostname();

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Pick IPv4 non-internal or Tailscale/VPN IPs
      if (net.family === 'IPv4') {
        const isLocalhost = net.internal || net.address === '127.0.0.1';
        const url = `http://${net.address}:${PORT}`;
        let qrCode = '';
        try {
          qrCode = await QRCode.toDataURL(url, { width: 220, margin: 1 });
        } catch {
          // ignore qr error
        }

        results.push({
          name,
          address: net.address,
          url,
          isLocalhost,
          isLan: !isLocalhost && !net.address.startsWith('169.254.'),
          qrCode
        });
      }
    }
  }

  // Prioritize primary LAN IP (e.g. 192.168.x.x or 10.x.x.x)
  const primary = results.find(r => r.isLan && (r.address.startsWith('192.168.') || r.address.startsWith('10.'))) ||
                  results.find(r => r.isLan) ||
                  results[0];

  return {
    hostname,
    port: PORT,
    primaryUrl: primary ? primary.url : `http://localhost:${PORT}`,
    primaryIp: primary ? primary.address : '127.0.0.1',
    primaryQr: primary ? primary.qrCode : '',
    interfaces: results
  };
}

/**
 * Fetch process map using Windows tasklist
 */
function getProcessMap() {
  return new Promise((resolve) => {
    exec('cmd.exe /c "tasklist /fo csv /nh"', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      const processMap = new Map();
      if (err || !stdout) {
        return resolve(processMap);
      }

      const lines = stdout.split('\r\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        // Tasklist CSV format: "Image Name","PID","Session Name","Session#","Mem Usage"
        const parts = line.split('","').map(p => p.replace(/^"|"$/g, ''));
        if (parts.length >= 5) {
          const name = parts[0];
          const pid = parseInt(parts[1], 10);
          const session = parts[2];
          const memory = parts[4];
          if (!isNaN(pid)) {
            processMap.set(pid, { name, memory, session });
          }
        }
      }
      resolve(processMap);
    });
  });
}

/**
 * Parse Windows netstat -ano output
 */
function parseNetstat(stdout, processMap) {
  const lines = stdout.split('\r\n');
  const ports = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('Active') || trimmed.startsWith('Proto')) continue;

    // e.g. TCP    0.0.0.0:80             0.0.0.0:0              LISTENING       4
    // e.g. TCP    [::]:80                [::]:0                 LISTENING       4
    // e.g. UDP    0.0.0.0:5353           *:*                                    3428
    const tokens = trimmed.split(/\s+/);
    if (tokens.length < 4) continue;

    const proto = tokens[0].toUpperCase();
    const local = tokens[1];
    let foreign = '';
    let state = 'LISTENING';
    let pidStr = '';

    if (proto === 'TCP') {
      foreign = tokens[2];
      state = tokens[3];
      pidStr = tokens[4];
    } else if (proto === 'UDP') {
      foreign = tokens[2];
      state = 'LISTENING'; // UDP sockets in netstat represent listening endpoints
      pidStr = tokens[3];
    }

    const pid = parseInt(pidStr, 10);
    if (isNaN(pid)) continue;

    // Extract port from local address
    const lastColon = local.lastIndexOf(':');
    if (lastColon === -1) continue;

    const localAddress = local.substring(0, lastColon);
    const localPort = parseInt(local.substring(lastColon + 1), 10);
    if (isNaN(localPort)) continue;

    // Process info
    let proc = processMap.get(pid);
    if (!proc) {
      if (pid === 4) {
        proc = { name: 'System', memory: 'N/A', session: 'Kernel' };
      } else if (pid === 0) {
        proc = { name: 'System Idle Process', memory: '0 K', session: 'System' };
      } else {
        proc = { name: 'Unknown', memory: 'Unknown', session: 'Unknown' };
      }
    }

    const explanation = explainPort(localPort, proc.name, localAddress);

    ports.push({
      id: `${proto}-${localAddress}-${localPort}-${pid}`,
      proto,
      localAddress,
      localPort,
      foreignAddress: foreign,
      state,
      pid,
      processName: proc.name,
      memory: proc.memory,
      session: proc.session,
      ...explanation
    });
  }

  // Deduplicate and prioritize LISTENING states
  const map = new Map();
  for (const item of ports) {
    const key = `${item.proto}:${item.localPort}:${item.localAddress}`;
    if (!map.has(key) || (item.state === 'LISTENING' && map.get(key).state !== 'LISTENING')) {
      map.set(key, item);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.localPort - b.localPort);
}

/**
 * Scan all active ports
 */
async function scanPorts() {
  const now = Date.now();
  if (cache.data && now - cache.timestamp < 1500) {
    return cache.data;
  }

  const processMap = await getProcessMap();

  return new Promise((resolve) => {
    exec('cmd.exe /c "netstat -ano"', { maxBuffer: 10 * 1024 * 1024 }, (err, stdout) => {
      if (err || !stdout) {
        return resolve({ ports: [], stats: {} });
      }

      const ports = parseNetstat(stdout, processMap);

      const listeningPorts = ports.filter(p => p.state === 'LISTENING');
      const lanExposed = listeningPorts.filter(p => p.isLanPublic);
      const localhostOnly = listeningPorts.filter(p => !p.isLanPublic);
      const established = ports.filter(p => p.state === 'ESTABLISHED');
      const uniqueProcesses = new Set(ports.map(p => p.processName)).size;

      const result = {
        ports,
        timestamp: new Date().toISOString(),
        stats: {
          total: ports.length,
          listening: listeningPorts.length,
          lanExposed: lanExposed.length,
          localhostOnly: localhostOnly.length,
          established: established.length,
          processes: uniqueProcesses
        }
      };

      cache = {
        timestamp: now,
        data: result
      };

      resolve(result);
    });
  });
}

// REST Endpoints
app.get('/api/network', async (_req, res) => {
  try {
    const networkInfo = await getNetworkInterfaces();
    res.json(networkInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/ports', async (_req, res) => {
  try {
    const data = await scanPorts();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/explain/:port', (req, res) => {
  const port = parseInt(req.params.port, 10);
  const processName = req.query.process || '';
  const localAddress = req.query.address || '0.0.0.0';
  const explanation = explainPort(port, processName, localAddress);
  res.json(explanation);
});

app.post('/api/kill', (req, res) => {
  const { pid } = req.body;
  const numPid = parseInt(pid, 10);

  if (isNaN(numPid)) {
    return res.status(400).json({ error: 'Invalid PID' });
  }

  // Security safeguards: Prevent killing system kernel or own server process
  if (numPid <= 4 || numPid === process.pid) {
    return res.status(403).json({
      error: `Safety Protection: Cannot kill protected system PID ${numPid} or the PortRadar dashboard itself.`
    });
  }

  exec(`taskkill /F /PID ${numPid}`, (err, stdout, stderr) => {
    if (err) {
      return res.status(500).json({
        error: `Failed to terminate PID ${numPid}: ${stderr || err.message}`
      });
    }

    // Invalidate cache immediately so UI reflects freed port
    cache.data = null;
    res.json({
      success: true,
      message: `Process PID ${numPid} terminated successfully.`,
      output: stdout
    });
  });
});

// Export current ports as clean Markdown file
app.get('/api/export/markdown', async (_req, res) => {
  try {
    const data = await scanPorts();
    const networkInfo = await getNetworkInterfaces();
    const markdown = generateMarkdownReport(data.ports, networkInfo);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="portradar-audit.md"');
    res.send(markdown);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Network Security Audit (Real-Time SSE Streaming)
app.post('/api/ai/audit', async (req, res) => {
  const { config } = req.body || {};
  if (!config) {
    return res.status(400).json({ error: 'AI configuration is required.' });
  }

  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const data = await scanPorts();
    const networkInfo = await getNetworkInterfaces();
    const rawMarkdown = generateMarkdownReport(data.ports, networkInfo);
    const reasoningMode = Boolean(config.reasoningMode);
    const systemPrompt = getAuditSystemPrompt(reasoningMode);

    const userPrompt = `Here is the live Markdown port audit of my host machine:\n\n\`\`\`markdown\n${rawMarkdown}\n\`\`\`\n\nPlease evaluate this network dump according to your instructions.`;

    let fullAuditText = '';
    let fullReasoningText = '';

    await streamLlm({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      systemPrompt,
      prompt: userPrompt,
      reasoningMode,
      onInputPayload: (payload) => {
        res.write(`event: metadata\ndata: ${JSON.stringify({ ...payload, rawMarkdown })}\n\n`);
      },
      onReasoning: (reasoningChunk) => {
        fullReasoningText += reasoningChunk;
        res.write(`event: reasoning\ndata: ${JSON.stringify({ text: reasoningChunk })}\n\n`);
      },
      onChunk: (textChunk) => {
        fullAuditText += textChunk;
        res.write(`event: delta\ndata: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    });

    // Save every audit permanently to local disk in audits/
    const savedInfo = saveAuditToDisk({
      type: 'full-network-audit',
      title: 'Full Network Security Audit',
      content: fullAuditText,
      reasoning: fullReasoningText,
      metadata: {
        provider: config.provider,
        model: config.model,
        reasoningMode
      },
      rawMarkdown
    });

    res.write(`event: done\ndata: ${JSON.stringify({ savedFile: savedInfo?.filename })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// AI Category Drill-down explanation (Real-Time SSE Streaming)
app.post('/api/ai/category', async (req, res) => {
  const { config, category, ports } = req.body || {};
  if (!config || !category || !ports) {
    return res.status(400).json({ error: 'Configuration, category, and ports list are required.' });
  }

  // Set SSE streaming headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const reasoningMode = Boolean(config.reasoningMode);
    const systemPrompt = getCategorySystemPrompt(reasoningMode);

    const portSummary = ports.map(p => 
      `- Port ${p.localPort} (${p.proto}): Process \`${p.processName}\` (PID: ${p.pid}), Local Address: \`${p.localAddress}\`, Status: ${p.isLanPublic ? 'LAN Exposed' : 'Localhost Only'}, Title: "${p.title}", Description: "${p.description}"`
    ).join('\n');

    const prompt = `Category: "${category}"\n\nActive ports running in this category on this laptop:\n${portSummary}\n\nPlease explain what each service does in 2-3 plain-English lines, why it runs, and whether people on the local Wi-Fi can see or use it.`;

    let fullCatText = '';
    let fullCatReasoning = '';

    await streamLlm({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      systemPrompt,
      prompt,
      reasoningMode,
      onInputPayload: (payload) => {
        res.write(`event: metadata\ndata: ${JSON.stringify({ ...payload, category })}\n\n`);
      },
      onReasoning: (reasoningChunk) => {
        fullCatReasoning += reasoningChunk;
        res.write(`event: reasoning\ndata: ${JSON.stringify({ text: reasoningChunk })}\n\n`);
      },
      onChunk: (textChunk) => {
        fullCatText += textChunk;
        res.write(`event: delta\ndata: ${JSON.stringify({ text: textChunk })}\n\n`);
      }
    });

    // Save category explanation to local disk
    const savedCatInfo = saveAuditToDisk({
      type: 'category-explainer',
      title: `Category Explanation - ${category}`,
      content: fullCatText,
      reasoning: fullCatReasoning,
      metadata: {
        provider: config.provider,
        model: config.model,
        reasoningMode
      },
      rawMarkdown: portSummary
    });

    res.write(`event: done\ndata: ${JSON.stringify({ savedFile: savedCatInfo?.filename })}\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// Single-Port Deep Dive AI Advisor (Real-Time SSE Streaming)
app.post('/api/ai/explain-port', async (req, res) => {
  const { config, port } = req.body || {};
  if (!config || !port) {
    return res.status(400).json({ error: 'Configuration and port object are required.' });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  try {
    const reasoningMode = Boolean(config.reasoningMode);
    const systemPrompt = `You are a Senior Network Security Analyst and Systems Administrator.
Analyze a specific active port running on this Windows laptop.
Provide an educational, deeply informative breakdown in clean Markdown covering:
1. **Service Identity & Purpose**: What program runs here, who built it, and why it's active.
2. **Local Network Exposure Risk**: If bound to ${port.localAddress}, what someone on the local Wi-Fi could discover, probe, or exploit.
3. **Known Vulnerabilities / CVE History**: Common security issues associated with this port/protocol (e.g. SMB vulnerabilities, unauthenticated Redis/Mongo, cleartext FTP, RDP brute force).
4. **Step-by-step Protection Commands**: Windows PowerShell or Netsh commands to block or bind it to localhost if needed.`;

    const prompt = `Detailed Port Information:
- Port Number: ${port.localPort} (${port.proto})
- Local Address: ${port.localAddress} (${port.isLanPublic ? 'OPEN TO LOCAL WI-FI' : 'LOCALHOST ONLY'})
- Process Name: ${port.processName} (PID: ${port.pid})
- Title: ${port.title}
- Category: ${port.category}
- Risk Level: ${port.risk}
- Local Description: ${port.description}
- Details: ${port.details || 'None provided'}`;

    let fullPortText = '';
    let fullPortReasoning = '';

    await streamLlm({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      systemPrompt,
      prompt,
      reasoningMode,
      onInputPayload: (payload) => {
        res.write(`event: metadata\ndata: ${JSON.stringify({ ...payload, port: port.localPort })}\n\n`);
      },
      onReasoning: (chunk) => {
        fullPortReasoning += chunk;
        res.write(`event: reasoning\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      },
      onChunk: (chunk) => {
        fullPortText += chunk;
        res.write(`event: delta\ndata: ${JSON.stringify({ text: chunk })}\n\n`);
      }
    });

    // Save to disk
    saveAuditToDisk({
      type: 'single-port-advisor',
      title: `Port ${port.localPort} Security Advisory (${port.processName})`,
      content: fullPortText,
      reasoning: fullPortReasoning,
      metadata: {
        provider: config.provider,
        model: config.model,
        reasoningMode
      }
    });

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// GET /api/ai/history - List all saved audits stored locally on laptop disk
app.get('/api/ai/history', (_req, res) => {
  try {
    if (!fs.existsSync(auditsDir)) {
      return res.json({ history: [] });
    }

    const files = fs.readdirSync(auditsDir).filter(f => f.endsWith('.md'));
    const history = [];

    for (const file of files) {
      const filePath = path.join(auditsDir, file);
      const stat = fs.statSync(filePath);
      const raw = fs.readFileSync(filePath, 'utf-8');

      let title = file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}_/, '').replace(/_/g, ' ');
      let type = 'audit';
      let provider = '';
      let model = '';

      // Parse YAML frontmatter
      const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      if (fmMatch) {
        const lines = fmMatch[1].split('\n');
        for (const line of lines) {
          const [k, ...v] = line.split(':');
          const key = k?.trim();
          const val = v.join(':')?.trim();
          if (key === 'type') type = val;
          if (key === 'provider') provider = val;
          if (key === 'model') model = val;
        }
      }

      // Extract title header if present
      const titleMatch = raw.match(/# (.*)/);
      if (titleMatch) title = titleMatch[1];

      // Extract brief preview text (skip headers)
      const contentWithoutHeader = raw.replace(/^---[\s\S]*?---/, '').replace(/#+ .*/g, '').trim();
      const preview = contentWithoutHeader.slice(0, 180).replace(/\s+/g, ' ') + '...';

      history.push({
        id: file,
        filename: file,
        title,
        type,
        provider,
        model,
        createdAt: stat.mtime.toISOString(),
        sizeKb: (stat.size / 1024).toFixed(1),
        preview
      });
    }

    // Sort newest first
    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ history, auditsDirectory: auditsDir });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/history/:filename - Fetch specific saved audit markdown
app.get('/api/ai/history/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(auditsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audit file not found' });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ filename, content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/ai/history/:filename - Delete a saved audit file
app.delete('/api/ai/history/:filename', (req, res) => {
  try {
    const filename = path.basename(req.params.filename);
    const filePath = path.join(auditsDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    res.json({ success: true, message: `Deleted ${filename}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Configuration Test Endpoint
app.post('/api/ai/test', async (req, res) => {
  try {
    const { config } = req.body || {};
    if (!config) {
      return res.status(400).json({ error: 'Configuration required.' });
    }

    let testOutput = '';
    await streamLlm({
      provider: config.provider,
      apiKey: config.apiKey,
      model: config.model,
      baseUrl: config.baseUrl,
      systemPrompt: 'You are a connection test agent. Answer in 3 words.',
      prompt: 'Verify connection. Say "Connection established successfully!"',
      reasoningMode: false,
      onChunk: (chunk) => {
        testOutput += chunk;
      }
    });

    res.json({
      success: true,
      message: testOutput || 'Connection established successfully!'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve frontend build if available
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Catch-all route for SPA fallback
app.use((_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>PortRadar API Server</title></head>
        <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
          <h1 style="color: #38bdf8;">⚡ PortRadar Backend is Live!</h1>
          <p>The API server is running. Frontend static files are building or ready.</p>
          <p><a href="/api/network" style="color: #38bdf8;">/api/network</a> | <a href="/api/ports" style="color: #38bdf8;">/api/ports</a></p>
        </body>
        </html>
      `);
    }
  });
});

app.listen(PORT, '0.0.0.0', async () => {
  const network = await getNetworkInterfaces();
  console.log('================================================================');
  console.log('⚡ PORTRADAR - LOCAL NETWORK PORT VISUALIZER & EXPLAINER');
  console.log('================================================================');
  console.log(`> Localhost Access:       http://localhost:${PORT}`);
  console.log(`> Local Network (LAN):    ${network.primaryUrl}`);
  console.log(`> All Devices on Wi-Fi can view this page via the LAN URL!`);
  console.log('================================================================\n');
});
