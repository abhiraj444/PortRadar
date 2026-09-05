// Multi-provider LLM handler and prompt crafting engine

/**
 * Generates a structured Markdown report from raw port data
 */
export function generateMarkdownReport(ports, networkInfo = {}) {
  const listening = ports.filter(p => p.state === 'LISTENING');
  const established = ports.filter(p => p.state === 'ESTABLISHED');
  const lanExposed = listening.filter(p => p.isLanPublic);
  const localhostOnly = listening.filter(p => !p.isLanPublic);

  let md = `# 🛡️ Host Network & Port Audit Report\n\n`;
  md += `**Host Machine:** ${networkInfo.hostname || 'Windows Laptop'}  \n`;
  md += `**Primary LAN IP:** ${networkInfo.primaryIp || 'Unknown'}  \n`;
  md += `**Audit Timestamp:** ${new Date().toISOString()}  \n\n`;

  md += `## 📊 Quick Summary\n`;
  md += `- **Total Active Sockets:** ${ports.length}\n`;
  md += `- **Listening Servers:** ${listening.length}\n`;
  md += `- **Exposed to Local Wi-Fi / LAN (0.0.0.0):** ${lanExposed.length} ⚠️\n`;
  md += `- **Localhost Only (127.0.0.1):** ${localhostOnly.length} 🔒\n`;
  md += `- **Active Established Connections:** ${established.length}\n\n`;

  md += `## 🔌 Active Listening Ports & Services\n\n`;
  md += `| Port | Proto | Process Name | PID | Binding | LAN Exposure | Category | Known Service |\n`;
  md += `| :--- | :---: | :--- | :---: | :--- | :---: | :--- | :--- |\n`;

  for (const p of listening) {
    const exposure = p.isLanPublic ? '⚠️ PUBLIC LAN' : '🔒 Localhost';
    md += `| **${p.localPort}** | ${p.proto} | \`${p.processName}\` | ${p.pid} | \`${p.localAddress}\` | ${exposure} | ${p.category} | ${p.title} |\n`;
  }

  md += `\n## 📝 Service Breakdown & Local Descriptions\n\n`;
  for (const p of listening) {
    md += `### Port ${p.localPort} (${p.proto}) - ${p.title}\n`;
    md += `- **Process:** \`${p.processName}\` (PID: ${p.pid}, Memory: ${p.memory || 'N/A'})\n`;
    md += `- **Local Binding:** \`${p.localAddress}:${p.localPort}\`\n`;
    md += `- **LAN Exposure Status:** ${p.lanExplanation}\n`;
    md += `- **Category:** ${p.category} (Risk Level: **${p.risk}**)\n`;
    md += `- **Description:** ${p.description}\n`;
    if (p.details) {
      md += `- **Technical Details:** ${p.details}\n`;
    }
    md += `\n`;
  }

  return md;
}

/**
 * Unified LLM Dispatcher
 */
export async function callLlm({ provider = 'gemini', apiKey = '', model = '', baseUrl = '', prompt = '', systemPrompt = '' }) {
  if (!apiKey && provider !== 'ollama') {
    throw new Error(`API key is required for provider "${provider}". Please enter your API key in AI Settings.`);
  }

  const defaultModels = {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    groq: 'llama-3.3-70b-versatile',
    ollama: 'llama3',
    openrouter: 'meta-llama/llama-3.3-70b-instruct'
  };

  const selectedModel = model.trim() || defaultModels[provider] || 'gpt-4o-mini';

  // 1. Google Gemini
  if (provider === 'gemini') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: 0.2
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated from Gemini.';
  }

  // 2. Anthropic Claude
  if (provider === 'anthropic') {
    const url = 'https://api.anthropic.com/v1/messages';
    const body = {
      model: selectedModel,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }]
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const data = await res.json();
    return data.content?.[0]?.text || 'No response generated from Claude.';
  }

  // 3. OpenAI-Compatible Providers (OpenAI, Groq, Ollama, OpenRouter, Custom)
  let endpoint = '';
  const headers = { 'Content-Type': 'application/json' };

  if (provider === 'openai') {
    endpoint = 'https://api.openai.com/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
  } else if (provider === 'openrouter') {
    endpoint = 'https://openrouter.ai/api/v1/chat/completions';
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'http://localhost:8989';
    headers['X-Title'] = 'PortRadar';
  } else if (provider === 'ollama') {
    endpoint = `${(baseUrl || 'http://localhost:11434').replace(/\/+$/, '')}/v1/chat/completions`;
  } else if (provider === 'custom') {
    endpoint = `${(baseUrl || '').replace(/\/+$/, '')}/chat/completions`;
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const body = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response generated.';
}

/**
 * System prompt for comprehensive full-network security audit
 */
export const AUDIT_SYSTEM_PROMPT = `You are a Principal Cyber Security Engineer and Computer Networking Architect.
Your task is to analyze a live markdown audit of open network ports and services running on a personal Windows laptop.

Provide an aesthetic, structured, and easy-to-understand analysis using Markdown.
Format your response with the following clear sections:

### 1. 🛡️ Executive Network Health Summary
- Overall security posture rating (e.g. Excellent / Good / Needs Attention / High Risk).
- Summary count of safe vs potentially dangerous ports.
- General impression of what this laptop is primarily doing (e.g., software development, media streaming, system utilities).

### 2. 🚨 Suspicious, High-Risk, or Exposed Services (Attention Required)
- Highlight any ports bound to \`0.0.0.0\` (LAN Exposed) that pose potential security risks (e.g. unencrypted FTP, SMB 445 file sharing on untrusted Wi-Fi, remote desktop RDP 3389, unauthenticated databases like Redis/Mongo, unknown or anomalous executables).
- For each item, explain in 2-3 sentences:
  - **What the vulnerability or risk is** (in plain English).
  - **Attack Vector:** What someone on the same Wi-Fi could do.
  - **Remediation:** How to fix it (e.g. bind to \`127.0.0.1\`, disable Windows service, or add firewall rule).

### 3. ✅ Legitimate & Safe Core Services
- Reassure the user about normal background processes (e.g. Windows RPC 135, Delivery Optimization 7680, Vite/Node dev servers, DNS).
- Explain why they are harmless and expected.

### 4. 💡 Top 3 Actionable Recommendations
- Provide 3 numbered, concrete commands or actions the user can take right now to secure their machine.

Maintain an encouraging, educational tone that demystifies computer networking for beginners while providing professional security rigor.`;

/**
 * System prompt for category drill-downs
 */
export const CATEGORY_SYSTEM_PROMPT = `You are an expert Computer Networking Teacher.
Your goal is to explain a group of network ports running inside a specific category to a student who wants to understand networking concepts clearly.

For the requested category and each port/service provided:
1. Provide a brief 2-3 line explanation written in plain, intuitive English.
2. Explain:
   - What this service actually does in everyday terms.
   - Why it is using this specific port.
   - Whether other people on the local Wi-Fi can see or interact with it.
3. Keep the styling clean with markdown bullet points and bold keywords.`;
