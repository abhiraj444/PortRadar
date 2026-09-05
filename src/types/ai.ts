export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'ollama' | 'openrouter' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.0-flash',
  baseUrl: ''
};

export const PROVIDER_PRESETS: Record<AiProvider, { label: string; defaultModel: string; placeholderUrl?: string; helpText: string }> = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    helpText: 'Fastest & free tier available via Google AI Studio (aistudio.google.com)'
  },
  openai: {
    label: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    helpText: 'Supports gpt-4o-mini, gpt-4o, o3-mini from platform.openai.com'
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-latest',
    helpText: 'Claude 3.5 Haiku or Sonnet from console.anthropic.com'
  },
  groq: {
    label: 'Groq (Ultra-Fast Llama 3)',
    defaultModel: 'llama-3.3-70b-versatile',
    helpText: 'Extremely fast inference via console.groq.com'
  },
  ollama: {
    label: 'Ollama (Local / Offline)',
    defaultModel: 'llama3',
    placeholderUrl: 'http://localhost:11434',
    helpText: '100% private local LLM running on your laptop. No API key needed!'
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    helpText: 'Access any model across all providers via openrouter.ai'
  },
  custom: {
    label: 'Custom OpenAI-Compatible API',
    defaultModel: 'gpt-4o-mini',
    placeholderUrl: 'https://your-custom-endpoint/v1',
    helpText: 'Any self-hosted vLLM, LM Studio, or OpenAI-compatible server'
  }
};
