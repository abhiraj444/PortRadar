import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Key, Cpu, Globe, Check, AlertTriangle, Eye, EyeOff, 
  ExternalLink, ShieldCheck, Loader2, Sliders, RotateCcw, ChevronDown, ChevronUp, Code
} from 'lucide-react';
import { 
  AiConfig, AiProvider, ProviderSettings, 
  DEFAULT_AI_CONFIG, DEFAULT_PROVIDER_SETTINGS, PROVIDER_PRESETS 
} from '../types/ai';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiConfig;
  onSaveConfig: (newConfig: AiConfig) => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig
}) => {
  // Active provider selection
  const [activeProvider, setActiveProvider] = useState<AiProvider>(config?.provider || 'gemini');
  
  // Isolated per-provider configuration store
  const [providerStore, setProviderStore] = useState<Record<AiProvider, ProviderSettings>>(() => {
    const store: Record<AiProvider, ProviderSettings> = { ...DEFAULT_PROVIDER_SETTINGS };
    if (config?.providers) {
      for (const [key, val] of Object.entries(config.providers)) {
        if (val && store[key as AiProvider]) {
          store[key as AiProvider] = { ...store[key as AiProvider], ...val };
        }
      }
    }
    // Backward compatibility: initialize current provider with top-level key/model/baseUrl if empty
    if (config?.provider && config?.apiKey && !store[config.provider].apiKey) {
      store[config.provider].apiKey = config.apiKey;
    }
    if (config?.provider && config?.model && !store[config.provider].model) {
      store[config.provider].model = config.model;
    }
    if (config?.provider && config?.baseUrl && !store[config.provider].baseUrl) {
      store[config.provider].baseUrl = config.baseUrl;
    }
    return store;
  });

  const [reasoningMode, setReasoningMode] = useState<boolean>(config?.reasoningMode ?? false);
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state whenever modal opens or config changes
  useEffect(() => {
    if (isOpen) {
      setActiveProvider(config?.provider || 'gemini');
      setReasoningMode(config?.reasoningMode ?? false);
      setTestResult(null);

      const store: Record<AiProvider, ProviderSettings> = { ...DEFAULT_PROVIDER_SETTINGS };
      if (config?.providers) {
        for (const [key, val] of Object.entries(config.providers)) {
          if (val && store[key as AiProvider]) {
            store[key as AiProvider] = { ...store[key as AiProvider], ...val };
          }
        }
      }
      if (config?.provider && config?.apiKey && !store[config.provider].apiKey) {
        store[config.provider].apiKey = config.apiKey;
      }
      if (config?.provider && config?.model && !store[config.provider].model) {
        store[config.provider].model = config.model;
      }
      if (config?.provider && config?.baseUrl && !store[config.provider].baseUrl) {
        store[config.provider].baseUrl = config.baseUrl;
      }
      setProviderStore(store);
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS[activeProvider];
  const currentSettings = providerStore[activeProvider] || DEFAULT_PROVIDER_SETTINGS[activeProvider];
  const isKeyRequired = activeProvider !== 'ollama';

  const updateCurrentSetting = <K extends keyof ProviderSettings>(field: K, value: ProviderSettings[K]) => {
    setProviderStore(prev => ({
      ...prev,
      [activeProvider]: {
        ...prev[activeProvider],
        [field]: value
      }
    }));
    setTestResult(null);
  };

  const handleProviderChange = (newProvider: AiProvider) => {
    setActiveProvider(newProvider);
    setTestResult(null);
  };

  const handleResetEndpoint = () => {
    updateCurrentSetting('baseUrl', currentPreset.defaultEndpoint);
  };

  const handleResetProviderDefaults = () => {
    const defaultSettings = DEFAULT_PROVIDER_SETTINGS[activeProvider];
    setProviderStore(prev => ({
      ...prev,
      [activeProvider]: {
        ...defaultSettings,
        apiKey: prev[activeProvider].apiKey // preserve entered key
      }
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const testConfig: AiConfig = {
        provider: activeProvider,
        apiKey: currentSettings.apiKey,
        model: currentSettings.model || currentPreset.defaultModel,
        baseUrl: currentSettings.baseUrl || currentPreset.defaultEndpoint,
        temperature: currentSettings.temperature ?? 0.2,
        maxTokens: currentSettings.maxTokens ?? 4096,
        topP: currentSettings.topP ?? 0.95,
        customHeaders: currentSettings.customHeaders,
        customBodyParams: currentSettings.customBodyParams,
        reasoningMode
      };

      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: testConfig })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Server error: ${res.status}`);
      }
      setTestResult({
        success: true,
        message: data.message || 'Connected successfully!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed. Please check endpoint, model, or API key.'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    // Validate JSON fields if present
    if (currentSettings.customHeaders && currentSettings.customHeaders.trim()) {
      try {
        JSON.parse(currentSettings.customHeaders);
      } catch (e: any) {
        alert('Invalid JSON in Custom Headers: ' + e.message);
        return;
      }
    }
    if (currentSettings.customBodyParams && currentSettings.customBodyParams.trim()) {
      try {
        JSON.parse(currentSettings.customBodyParams);
      } catch (e: any) {
        alert('Invalid JSON in Custom Request Body: ' + e.message);
        return;
      }
    }

    const newConfig: AiConfig = {
      provider: activeProvider,
      apiKey: currentSettings.apiKey,
      model: currentSettings.model || currentPreset.defaultModel,
      baseUrl: currentSettings.baseUrl || currentPreset.defaultEndpoint,
      temperature: currentSettings.temperature ?? 0.2,
      maxTokens: currentSettings.maxTokens ?? 4096,
      topP: currentSettings.topP ?? 0.95,
      customHeaders: currentSettings.customHeaders || '',
      customBodyParams: currentSettings.customBodyParams || '',
      reasoningMode,
      providers: providerStore
    };

    onSaveConfig(newConfig);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900/95 px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                AI Intelligence & Provider Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Independent API keys, custom endpoints, and parameters per LLM provider
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Provider Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Active LLM Provider
              </label>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-950/50 text-cyan-400 border border-cyan-500/30">
                Isolated Settings
              </span>
            </div>
            <select
              value={activeProvider}
              onChange={(e) => handleProviderChange(e.target.value as AiProvider)}
              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 cursor-pointer focus:outline-none transition-colors"
            >
              {Object.entries(PROVIDER_PRESETS).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              {currentPreset.helpText}
            </span>
          </div>

          {/* API Key (Isolated per provider) */}
          {isKeyRequired ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  {currentPreset.label} API Key
                </label>
                {currentPreset.keyUrl && (
                  <a
                    href={currentPreset.keyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                  >
                    <span>Get Key</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={currentSettings.apiKey}
                  onChange={(e) => updateCurrentSetting('apiKey', e.target.value)}
                  placeholder={`Enter your ${currentPreset.label} API key...`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  title={showKey ? 'Hide key' : 'Show key'}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">
                Saved specifically for {currentPreset.label}. Will not overwrite other providers.
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Ollama runs locally on your computer. No external API key is needed.</span>
            </div>
          )}

          {/* Model Name */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Model Identifier
              </label>
              {currentSettings.model !== currentPreset.defaultModel && (
                <button
                  type="button"
                  onClick={() => updateCurrentSetting('model', currentPreset.defaultModel)}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset ({currentPreset.defaultModel})</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Cpu className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={currentSettings.model}
                onChange={(e) => updateCurrentSetting('model', e.target.value)}
                placeholder={currentPreset.defaultModel}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* API Base URL / Endpoint (Editable for EVERY provider!) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                API Base URL / Custom Endpoint
              </label>
              {currentSettings.baseUrl !== currentPreset.defaultEndpoint && (
                <button
                  type="button"
                  onClick={handleResetEndpoint}
                  className="text-[10px] text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors cursor-pointer"
                  title="Reset to official default endpoint"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Official URL</span>
                </button>
              )}
            </div>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={currentSettings.baseUrl || ''}
                onChange={(e) => updateCurrentSetting('baseUrl', e.target.value)}
                placeholder={currentPreset.defaultEndpoint}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none transition-colors"
              />
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Default: <code className="text-slate-400">{currentPreset.defaultEndpoint}</code>. You can change this to any reverse proxy, local gateway, or corporate endpoint.
            </span>
          </div>

          {/* Advanced Model Parameters & Overrides Toggle */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-3 bg-slate-950/80 hover:bg-slate-900 flex items-center justify-between text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <span>Custom Parameters, Temperature & Headers</span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ({currentPreset.label})
                </span>
              </div>
              {showAdvanced ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {showAdvanced && (
              <div className="p-4 space-y-4 border-t border-slate-800 text-xs animate-in fade-in duration-100">
                {/* Temperature & Max Tokens Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Temperature
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.0"
                      max="2.0"
                      value={currentSettings.temperature ?? 0.2}
                      onChange={(e) => updateCurrentSetting('temperature', parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">0.0 (focused) - 1.0 (creative)</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Max Output Tokens
                    </label>
                    <input
                      type="number"
                      step="512"
                      min="256"
                      max="32768"
                      value={currentSettings.maxTokens ?? 4096}
                      onChange={(e) => updateCurrentSetting('maxTokens', parseInt(e.target.value, 10) || 4096)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 4096</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Top P
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="1.0"
                      value={currentSettings.topP ?? 0.95}
                      onChange={(e) => updateCurrentSetting('topP', parseFloat(e.target.value) || 0.95)}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Default: 0.95</span>
                  </div>
                </div>

                {/* Custom Headers JSON */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>Custom HTTP Headers (JSON)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentSettings.customHeaders || ''}
                    onChange={(e) => updateCurrentSetting('customHeaders', e.target.value)}
                    placeholder='{"HTTP-Referer": "http://localhost:8989", "X-Custom-Header": "Value"}'
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none resize-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Added to every HTTP request sent to this provider. Useful for proxies or OpenRouter app ranking.
                  </span>
                </div>

                {/* Custom Body Parameters JSON */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 flex items-center justify-between mb-1">
                    <span>Custom Request Body Parameters (JSON)</span>
                    <span className="text-[10px] text-slate-500 font-mono">Optional</span>
                  </label>
                  <textarea
                    rows={2}
                    value={currentSettings.customBodyParams || ''}
                    onChange={(e) => updateCurrentSetting('customBodyParams', e.target.value)}
                    placeholder='{"seed": 42, "frequency_penalty": 0}'
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none resize-none"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Merged directly into the request JSON payload sent to the LLM.
                  </span>
                </div>

                {/* Reset Provider Action */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleResetProviderDefaults}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset All {currentPreset.label} Parameters to Defaults</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chain-of-Thought Reasoning Mode Toggle */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Chain-of-Thought Reasoning Mode
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Enable step-by-step analytical deliberation inside a dedicated thinking scratchpad before generating the report.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setReasoningMode(!reasoningMode)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                reasoningMode ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                reasoningMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Test connection alert */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
            }`}>
              {testResult.success ? (
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              )}
              <span className="break-all">{testResult.message}</span>
            </div>
          )}

          {/* Privacy Note */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              All keys and custom endpoints are saved locally on your laptop in private storage. PortRadar never shares or logs your keys.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/95 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (isKeyRequired && !currentSettings.apiKey.trim())}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            title="Test connection with current endpoint and credentials"
          >
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
