import React, { useState } from 'react';
import { 
  X, Sparkles, Shield, AlertTriangle, Check, Copy, Download, 
  Settings, Loader2, FileText, ArrowRight, RefreshCw, Terminal 
} from 'lucide-react';
import { AiConfig } from '../types/ai';

interface AiAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiConfig;
  onOpenSettings: () => void;
}

export const AiAuditModal: React.FC<AiAuditModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenSettings
}) => {
  const [activeTab, setActiveTab] = useState<'audit' | 'raw'>('audit');
  const [loading, setLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [rawMarkdown, setRawMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const hasKey = Boolean(config.apiKey.trim() || config.provider === 'ollama');

  const handleRunAudit = async () => {
    if (!hasKey) {
      onOpenSettings();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to complete AI audit');
      }
      setAuditResult(data.auditMarkdown);
      setRawMarkdown(data.rawMarkdown);
    } catch (err: any) {
      setError(err.message || 'Audit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900/95 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                  AI Network Security Audit
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
                  {config.provider.toUpperCase()} &bull; {config.model}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Single-pass automated security assessment across all open ports and exposed services
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

        {/* Tab & Action Toolbar */}
        <div className="bg-slate-950/60 px-5 sm:px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Security Report</span>
            </button>
            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Raw Network Markdown</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Configure AI Provider & Model"
            >
              <Settings className="w-4 h-4" />
            </button>

            {((activeTab === 'audit' && auditResult) || (activeTab === 'raw' && rawMarkdown)) && (
              <>
                <button
                  onClick={() => handleCopy(activeTab === 'audit' ? auditResult! : rawMarkdown!)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleDownload(
                    activeTab === 'audit' ? auditResult! : rawMarkdown!,
                    activeTab === 'audit' ? 'portradar-ai-security-audit.md' : 'portradar-network-dump.md'
                  )}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .md</span>
                </button>
              </>
            )}

            <button
              onClick={handleRunAudit}
              disabled={loading}
              className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{loading ? 'Analyzing...' : auditResult ? 'Re-Run Audit' : 'Start AI Audit'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[70vh]">
          {/* Missing Key Warning */}
          {!hasKey && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 text-center max-w-md mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">AI Provider Configuration Needed</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  To analyze your network for vulnerabilities, suspicious ports, and misconfigurations, choose your favorite LLM (Gemini, OpenAI, Claude, Groq, or Ollama local).
                </p>
              </div>
              <button
                onClick={onOpenSettings}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Configure AI Provider</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Loading Animation State */}
          {loading && (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping"></div>
                <div className="w-12 h-12 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                <Shield className="w-5 h-5 text-cyan-400 absolute" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">Analyzing Host Network Posture...</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Generating Markdown snapshot of active sockets and sending to {config.provider.toUpperCase()} ({config.model}) for threat analysis.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-4 rounded-xl text-xs text-rose-300 flex items-start gap-3 my-4">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Audit Failed</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* AI Audit Result Tab */}
          {activeTab === 'audit' && !loading && auditResult && (
            <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed space-y-4 bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80">
              <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {auditResult}
              </div>
            </div>
          )}

          {/* Empty state before running audit */}
          {activeTab === 'audit' && !loading && !auditResult && hasKey && (
            <div className="py-16 text-center space-y-4 max-w-md mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Ready to Audit Network Security</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Click "Start AI Audit" to dump all listening ports into a structured Markdown profile and have the AI identify vulnerabilities and suspicious exposure in one go.
                </p>
              </div>
              <button
                onClick={handleRunAudit}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start AI Audit</span>
              </button>
            </div>
          )}

          {/* Raw Markdown Tab */}
          {activeTab === 'raw' && !loading && rawMarkdown && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre leading-relaxed">
              {rawMarkdown}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
