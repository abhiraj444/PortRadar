import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, Key, Cpu, Globe, Check, AlertTriangle, Eye, EyeOff, 
  ExternalLink, ShieldCheck, Loader2 
} from 'lucide-react';
import { AiConfig, AiProvider, DEFAULT_AI_CONFIG, PROVIDER_PRESETS } from '../types/ai';

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
  const [form, setForm] = useState<AiConfig>(config);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    setForm(config);
    setTestResult(null);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const currentPreset = PROVIDER_PRESETS[form.provider];
  const isKeyRequired = form.provider !== 'ollama';

  const handleProviderChange = (p: AiProvider) => {
    setForm(prev => ({
      ...prev,
      provider: p,
      model: PROVIDER_PRESETS[p].defaultModel,
      baseUrl: PROVIDER_PRESETS[p].placeholderUrl || ''
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: form })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Connection failed');
      }
      setTestResult({
        success: true,
        message: data.message || 'Connected successfully!'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900/90 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                AI Intelligence & Provider Settings
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure your preferred LLM provider for network security audits
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

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Provider Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              LLM Provider
            </label>
            <select
              value={form.provider}
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

          {/* Model Name */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Model Name
            </label>
            <div className="relative">
              <Cpu className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder={currentPreset.defaultModel}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* API Key */}
          {isKeyRequired && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                API Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.apiKey}
                  onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                  placeholder={`Enter your ${currentPreset.label} API key...`}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Base URL (for Ollama or Custom) */}
          {(form.provider === 'ollama' || form.provider === 'custom') && (
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Base URL / Endpoint
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={form.baseUrl || ''}
                  onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
                  placeholder={currentPreset.placeholderUrl || 'http://localhost:11434'}
                  className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

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
              <span className="truncate">{testResult.message}</span>
            </div>
          )}

          {/* Reasoning Mode / Chain-of-Thought Toggle */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">
                Chain-of-Thought Reasoning Mode
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Enable step-by-step analytical deliberation inside a dedicated thinking box before producing the final report.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setForm(prev => ({ ...prev, reasoningMode: !prev.reasoningMode }))}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer flex-shrink-0 ${
                form.reasoningMode ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                form.reasoningMode ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Privacy Note */}
          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              Your API key is stored locally in your browser's private storage. PortRadar never logs or transmits your keys to third parties.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900/95 px-6 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || (isKeyRequired && !form.apiKey.trim())}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
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
