// Multi-provider streaming LLM handler, prompt crafting, and reasoning engine

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
 * System prompt for comprehensive full-network security audit
 */
export function getAuditSystemPrompt(reasoningMode = false) {
  let prompt = `You are a Principal Cyber Security Engineer and Computer Networking Architect.
Your task is to analyze a live markdown audit of open network ports and services running on a personal Windows laptop.

Provide an aesthetic, structured, and easy-to-understand analysis formatted in standard GitHub Flavored Markdown.
Use clear headings, markdown tables, bullet points, and highlight critical security items.

Format your response with the following clear sections:

### 1. 🛡️ Executive Network Health Summary
- Overall security posture rating (e.g. Excellent / Good / Needs Attention / High Risk).
- A clean markdown table summarizing port counts by category and exposure.
- General impression of what this laptop is primarily doing.

### 2. 🚨 Suspicious, High-Risk, or Exposed Services (Attention Required)
- Highlight any ports bound to \`0.0.0.0\` (LAN Exposed) that pose potential security risks (e.g. unencrypted FTP, SMB 445 on untrusted Wi-Fi, remote desktop RDP 3389, unauthenticated databases, anomalous executables).
- For each item, explain in 2-3 sentences:
  - **What the vulnerability or risk is** (in plain English).
  - **Attack Vector:** What someone on the same Wi-Fi could do.
  - **Remediation:** Concrete commands to fix it (e.g. bind to \`127.0.0.1\`, disable Windows service, or add firewall rule).

### 3. ✅ Legitimate & Safe Core Services
- Reassure the user about normal background processes (e.g. Windows RPC 135, Delivery Optimization 7680, Vite/Node dev servers, DNS).
- Explain why they are harmless and expected.

### 4. 💡 Top 3 Actionable Recommendations
- Provide 3 numbered, concrete commands or actions the user can take right now to secure their machine.`;

  if (reasoningMode) {
    prompt += `\n\nIMPORTANT - CHAIN-OF-THOUGHT REASONING MODE IS ENABLED:
Before writing the final audit report, you MUST first conduct a deep, rigorous step-by-step internal deliberation wrapped inside <thinking> and </thinking> tags.
Inside <thinking>...</thinking>:
- Step 1: Scan all sockets and identify any non-standard listening ports.
- Step 2: Differentiate 0.0.0.0 (Wi-Fi accessible) from 127.0.0.1 (local only).
- Step 3: Evaluate each listening daemon for lack of encryption or authentication.
- Step 4: Formulate the executive rating and top recommendations.
After the closing </thinking> tag, immediately output the polished Markdown report.`;
  } else {
    prompt += `\n\nDo not include internal chain-of-thought scratchpad blocks. Output the formatted report directly.`;
  }

  return prompt;
}

/**
 * System prompt for category drill-downs
 */
export function getCategorySystemPrompt(reasoningMode = false) {
  let prompt = `You are an expert Computer Networking Teacher.
Your goal is to explain a group of network ports running inside a specific category to a student who wants to understand networking concepts clearly.

For the requested category and each port/service provided:
1. Provide a brief 2-3 line explanation written in plain, intuitive English.
2. Explain:
   - What this service actually does in everyday terms.
   - Why it is using this specific port.
   - Whether other people on the local Wi-Fi can see or interact with it.
3. Keep the styling clean with markdown bullet points and bold keywords.`;

  if (reasoningMode) {
    prompt += `\n\nWrap your preliminary thought process inside <thinking>...</thinking> tags before providing the final explanation.`;
  }

  return prompt;
}

/**
 * Multi-Provider Real-Time Streaming Dispatcher
 */
export async function streamLlm({
  provider = 'gemini',
  apiKey = '',
  model = '',
  baseUrl = '',
  temperature = 0.2,
  maxTokens = 4096,
  topP = 0.95,
  customHeaders = '',
  customBodyParams = '',
  systemPrompt = '',
  prompt = '',
  reasoningMode = false,
  onChunk = () => {},
  onReasoning = () => {},
  onInputPayload = () => {}
}) {
  if (!apiKey && provider !== 'ollama') {
    throw new Error(`API key is required for provider "${provider}". Please enter your API key in AI Settings.`);
  }

  const defaultModels = {
    gemini: 'gemini-2.0-flash',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-haiku-latest',
    groq: 'llama-3.3-70b-versatile',
    ollama: 'llama3',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    custom: 'gpt-4o-mini'
  };

  const selectedModel = model?.trim() || defaultModels[provider] || 'gpt-4o-mini';
  const cleanBase = (baseUrl || '').trim().replace(/\/+$/, '');

  // Parse custom headers if provided
  const parsedCustomHeaders = {};
  if (customHeaders && typeof customHeaders === 'string' && customHeaders.trim()) {
    try {
      Object.assign(parsedCustomHeaders, JSON.parse(customHeaders));
    } catch (e) {
      console.warn('Failed to parse customHeaders JSON:', e.message);
    }
  }

  // Parse custom body parameters if provided
  const parsedCustomBody = {};
  if (customBodyParams && typeof customBodyParams === 'string' && customBodyParams.trim()) {
    try {
      Object.assign(parsedCustomBody, JSON.parse(customBodyParams));
    } catch (e) {
      console.warn('Failed to parse customBodyParams JSON:', e.message);
    }
  }

  // 1. Google Gemini SSE Streaming
  if (provider === 'gemini') {
    const baseHost = cleanBase || 'https://generativelanguage.googleapis.com';
    const endpoint = `${baseHost}/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const safeEndpoint = `${baseHost}/v1beta/models/${selectedModel}:streamGenerateContent?alt=sse&key=***REDACTED***`;
    
    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      generationConfig: {
        temperature: typeof temperature === 'number' ? temperature : 0.2,
        maxOutputTokens: typeof maxTokens === 'number' ? maxTokens : 4096,
        topP: typeof topP === 'number' ? topP : 0.95
      },
      ...parsedCustomBody
    };

    onInputPayload({
      provider,
      model: selectedModel,
      endpoint: safeEndpoint,
      reasoningMode,
      systemPrompt,
      userPrompt: prompt,
      parameters: { temperature, maxTokens, topP },
      timestamp: new Date().toISOString()
    });

    const headers = {
      'Content-Type': 'application/json',
      ...parsedCustomHeaders
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini API Error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onChunk(text);
        } catch {
          // ignore partial JSON chunk
        }
      }
    }
    return;
  }

  // 2. Anthropic Claude Streaming
  if (provider === 'anthropic') {
    const baseHost = cleanBase || 'https://api.anthropic.com/v1';
    const endpoint = baseHost.endsWith('/messages') ? baseHost : `${baseHost}/messages`;

    const body = {
      model: selectedModel,
      max_tokens: typeof maxTokens === 'number' ? maxTokens : 4096,
      temperature: typeof temperature === 'number' ? temperature : 0.2,
      top_p: typeof topP === 'number' ? topP : 0.95,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      ...parsedCustomBody
    };

    onInputPayload({
      provider,
      model: selectedModel,
      endpoint,
      reasoningMode,
      systemPrompt,
      userPrompt: prompt,
      parameters: { temperature, maxTokens, topP },
      timestamp: new Date().toISOString()
    });

    const headers = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      ...parsedCustomHeaders
    };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API Error (${res.status}): ${errText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data:')) continue;
        const dataStr = trimmed.replace(/^data:\s*/, '');
        if (dataStr === '[DONE]') continue;

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.type === 'content_block_delta') {
            if (parsed.delta?.type === 'thinking_delta' && parsed.delta?.thinking) {
              onReasoning(parsed.delta.thinking);
            } else if (parsed.delta?.text) {
              onChunk(parsed.delta.text);
            }
          }
        } catch {
          // ignore partial JSON
        }
      }
    }
    return;
  }

  // 3. OpenAI-Compatible Streaming (OpenAI, Groq, OpenRouter, Ollama, Custom)
  let baseHost = cleanBase;
  if (!baseHost) {
    if (provider === 'openai') baseHost = 'https://api.openai.com/v1';
    else if (provider === 'groq') baseHost = 'https://api.groq.com/openai/v1';
    else if (provider === 'openrouter') baseHost = 'https://openrouter.ai/api/v1';
    else if (provider === 'ollama') baseHost = 'http://localhost:11434/v1';
    else if (provider === 'custom') baseHost = 'https://your-custom-endpoint/v1';
  }

  const endpoint = baseHost.endsWith('/chat/completions') ? baseHost : `${baseHost}/chat/completions`;
  const headers = { 
    'Content-Type': 'application/json',
    ...parsedCustomHeaders 
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  if (provider === 'openrouter') {
    if (!headers['HTTP-Referer']) headers['HTTP-Referer'] = 'http://localhost:8989';
    if (!headers['X-Title']) headers['X-Title'] = 'PortRadar';
  }

  const body = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    stream: true,
    temperature: typeof temperature === 'number' ? temperature : 0.2,
    max_tokens: typeof maxTokens === 'number' ? maxTokens : 4096,
    top_p: typeof topP === 'number' ? topP : 0.95,
    ...parsedCustomBody
  };

  onInputPayload({
    provider,
    model: selectedModel,
    endpoint,
    reasoningMode,
    systemPrompt,
    userPrompt: prompt,
    parameters: { temperature, maxTokens, topP },
    timestamp: new Date().toISOString()
  });

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${provider.toUpperCase()} API Error (${res.status}): ${errText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;
      const dataStr = trimmed.replace(/^data:\s*/, '');
      if (dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr);
        const delta = parsed.choices?.[0]?.delta;
        if (!delta) continue;

        // Check if delta contains reasoning_content (DeepSeek-R1 / o3 / qwq)
        if (delta.reasoning_content) {
          onReasoning(delta.reasoning_content);
        }
        if (delta.content) {
          onChunk(delta.content);
        }
      } catch {
        // ignore partial JSON
      }
    }
  }
}
