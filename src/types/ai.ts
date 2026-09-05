export type AiProvider = 'gemini' | 'openai' | 'anthropic' | 'groq' | 'ollama' | 'openrouter' | 'custom';

export interface ProviderSettings {
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  customHeaders?: string;     // JSON string e.g. {"HTTP-Referer": "..."}
  customBodyParams?: string;  // JSON string e.g. {"seed": 42}
}

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  customHeaders?: string;
  customBodyParams?: string;
  reasoningMode?: boolean;
  // Per-provider saved configuration map (isolated storage for every provider)
  providers?: Partial<Record<AiProvider, ProviderSettings>>;
}

export interface ProviderPresetInfo {
  label: string;
  defaultModel: string;
  defaultEndpoint: string;
  helpText: string;
  keyUrl?: string;
  keyHelp: string;
}

export const PROVIDER_PRESETS: Record<AiProvider, ProviderPresetInfo> = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.0-flash',
    defaultEndpoint: 'https://generativelanguage.googleapis.com',
    helpText: 'Ultra-fast inference & generous free tier via Google AI Studio.',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    keyHelp: 'Get your Gemini API key from Google AI Studio'
  },
  openai: {
    label: 'OpenAI (ChatGPT)',
    defaultModel: 'gpt-4o-mini',
    defaultEndpoint: 'https://api.openai.com/v1',
    helpText: 'Official OpenAI models: gpt-4o-mini, gpt-4o, o3-mini.',
    keyUrl: 'https://platform.openai.com/api-keys',
    keyHelp: 'Get your OpenAI API key from platform.openai.com'
  },
  anthropic: {
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-latest',
    defaultEndpoint: 'https://api.anthropic.com/v1',
    helpText: 'Claude 3.5 Haiku or Sonnet with superior reasoning.',
    keyUrl: 'https://console.anthropic.com/settings/keys',
    keyHelp: 'Get your Claude API key from console.anthropic.com'
  },
  groq: {
    label: 'Groq (Ultra-Fast Llama 3)',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultEndpoint: 'https://api.groq.com/openai/v1',
    helpText: 'Real-time LPU hardware running open-source models at 300+ tok/sec.',
    keyUrl: 'https://console.groq.com/keys',
    keyHelp: 'Get your Groq API key from console.groq.com'
  },
  openrouter: {
    label: 'OpenRouter',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    defaultEndpoint: 'https://openrouter.ai/api/v1',
    helpText: 'Universal gateway providing access to hundreds of AI models in one API.',
    keyUrl: 'https://openrouter.ai/keys',
    keyHelp: 'Get your OpenRouter API key from openrouter.ai'
  },
  ollama: {
    label: 'Ollama (Local / Offline)',
    defaultModel: 'llama3',
    defaultEndpoint: 'http://localhost:11434',
    helpText: '100% private local LLM running directly on your laptop. Zero API key needed!',
    keyHelp: 'Runs locally on your computer (no internet required)'
  },
  custom: {
    label: 'Custom OpenAI-Compatible API',
    defaultModel: 'gpt-4o-mini',
    defaultEndpoint: 'https://your-custom-endpoint/v1',
    helpText: 'Self-hosted vLLM, LM Studio, LiteLLM proxy, or corporate AI gateway.',
    keyHelp: 'Bearer token or API key for your custom server (if required)'
  }
};

export const DEFAULT_PROVIDER_SETTINGS: Record<AiProvider, ProviderSettings> = {
  gemini: {
    apiKey: '',
    model: 'gemini-2.0-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  openai: {
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  anthropic: {
    apiKey: '',
    model: 'claude-3-5-haiku-latest',
    baseUrl: 'https://api.anthropic.com/v1',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  groq: {
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  openrouter: {
    apiKey: '',
    model: 'meta-llama/llama-3.3-70b-instruct',
    baseUrl: 'https://openrouter.ai/api/v1',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  ollama: {
    apiKey: '',
    model: 'llama3',
    baseUrl: 'http://localhost:11434',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  },
  custom: {
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://your-custom-endpoint/v1',
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.95,
    customHeaders: '',
    customBodyParams: ''
  }
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'gemini',
  apiKey: '',
  model: 'gemini-2.0-flash',
  baseUrl: 'https://generativelanguage.googleapis.com',
  temperature: 0.2,
  maxTokens: 4096,
  topP: 0.95,
  customHeaders: '',
  customBodyParams: '',
  reasoningMode: false,
  providers: { ...DEFAULT_PROVIDER_SETTINGS }
};
