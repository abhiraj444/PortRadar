import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Sparkles, Shield, AlertTriangle, Check, Copy, Download, 
  Settings, Loader2, FileText, ArrowRight, Brain, Terminal, Activity 
} from 'lucide-react';
import { AiConfig } from '../types/ai';
import { MarkdownReport } from './MarkdownReport';
import { ThinkingBox } from './ThinkingBox';
import { LiveAiInspector, AiInputMetadata } from './LiveAiInspector';

interface AiAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AiConfig;
  onOpenSettings: () => void;
  onUpdateConfig?: (updated: AiConfig) => void;
}

export const AiAuditModal: React.FC<AiAuditModalProps> = ({
  isOpen,
  onClose,
  config,
  onOpenSettings,
  onUpdateConfig
}) => {
  const [activeTab, setActiveTab] = useState<'report' | 'inspector' | 'raw'>('report');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [reasoningMode, setReasoningMode] = useState<boolean>(config.reasoningMode ?? false);
  
  // Stream buffers
  const [streamedReport, setStreamedReport] = useState<string>('');
  const [streamedReasoning, setStreamedReasoning] = useState<string>('');
  const [rawOutputStream, setRawOutputStream] = useState<string>('');
  const [inputMetadata, setInputMetadata] = useState<AiInputMetadata | null>(null);
  const [rawMarkdownSnapshot, setRawMarkdownSnapshot] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync reasoning mode when config changes
  useEffect(() => {
    setReasoningMode(config.reasoningMode ?? false);
  }, [config.reasoningMode]);

  if (!isOpen) return null;

  const hasKey = Boolean(config.apiKey.trim() || config.provider === 'ollama');

  const handleToggleReasoning = () => {
    const nextVal = !reasoningMode;
    setReasoningMode(nextVal);
    if (onUpdateConfig) {
      onUpdateConfig({ ...config, reasoningMode: nextVal });
    }
  };

  const handleRunAudit = async () => {
    if (!hasKey) {
      onOpenSettings();
      return;
    }

    // Reset stream buffers
    setStreamedReport('');
    setStreamedReasoning('');
    setRawOutputStream('');
    setError(null);
    setIsStreaming(true);
    setIsThinking(reasoningMode);
    setActiveTab('report');

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          config: { 
            ...config, 
            reasoningMode 
          } 
        }),
        signal: abortControllerRef.current.signal
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported by browser');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          if (!block.trim()) continue;

          let event = 'delta';
          let data = '';

          const blockLines = block.split('\n');
          for (const line of blockLines) {
            if (line.startsWith('event:')) {
              event = line.replace(/^event:\s*/, '').trim();
            } else if (line.startsWith('data:')) {
              data = line.replace(/^data:\s*/, '').trim();
            }
          }

          if (event === 'metadata') {
            try {
              const meta: AiInputMetadata = JSON.parse(data);
              setInputMetadata(meta);
              if (meta.rawMarkdown) {
                setRawMarkdownSnapshot(meta.rawMarkdown);
              }
            } catch {
              // ignore json parse error
            }
          } else if (event === 'reasoning') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setIsThinking(true);
                setStreamedReasoning(prev => prev + parsed.text);
                setRawOutputStream(prev => prev + parsed.text);
              }
            } catch {
              // ignore
            }
          } else if (event === 'delta') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setIsThinking(false);
                setStreamedReport(prev => prev + parsed.text);
                setRawOutputStream(prev => prev + parsed.text);
              }
            } catch {
              // ignore
            }
          } else if (event === 'done') {
            setIsStreaming(false);
            setIsThinking(false);
          } else if (event === 'error') {
            try {
              const parsed = JSON.parse(data);
              setError(parsed.error || 'Streaming error');
            } catch {
              setError('Stream encountered an error');
            }
            setIsStreaming(false);
            setIsThinking(false);
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Audit failed');
      }
    } finally {
      setIsStreaming(false);
      setIsThinking(false);
    }
  };

  const handleStopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
      setIsThinking(false);
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
        className="relative w-full max-w-5xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
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
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-cyan-300">
                  {config.provider.toUpperCase()} &bull; {config.model}
                </span>
                {reasoningMode && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    <Brain className="w-3 h-3" /> CoT Reasoning
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Real-time streaming vulnerability analysis and educational threat assessment
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
        <div className="bg-slate-950/60 px-5 sm:px-6 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('report')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'report'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Security Report</span>
              {isStreaming && (
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'inspector'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live AI Inspector</span>
            </button>

            <button
              onClick={() => setActiveTab('raw')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'raw'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Raw Port Tables</span>
            </button>
          </div>

          {/* Controls & Reasoning Mode Switch */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Reasoning Mode Toggle */}
            <button
              onClick={handleToggleReasoning}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                reasoningMode
                  ? 'bg-purple-600/20 border-purple-500/40 text-purple-200 shadow-sm shadow-purple-600/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Chain-of-Thought deliberation scratchpad"
            >
              <Brain className={`w-3.5 h-3.5 ${reasoningMode ? 'text-purple-400' : 'text-slate-500'}`} />
              <span>Reasoning: <strong>{reasoningMode ? 'ON' : 'OFF'}</strong></span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Configure AI Provider & Model"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Copy / Download buttons */}
            {streamedReport && (
              <>
                <button
                  onClick={() => handleCopy(streamedReport)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Report Markdown"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </button>

                <button
                  onClick={() => handleDownload(streamedReport, 'portradar-ai-security-audit.md')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Download .md file"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download</span>
                </button>
              </>
            )}

            {/* Run / Stop Stream Button */}
            {isStreaming ? (
              <button
                onClick={handleStopStream}
                className="px-4 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="w-2 h-2 rounded-sm bg-rose-400"></span>
                <span>Stop Stream</span>
              </button>
            ) : (
              <button
                onClick={handleRunAudit}
                className="px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{streamedReport ? 'Re-Run Stream' : 'Start Live Audit'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[72vh]">
          {/* Missing Key Warning */}
          {!hasKey && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-2xl p-6 text-center max-w-md mx-auto my-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">AI Provider Configuration Needed</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Choose your preferred model (Gemini, OpenAI, Claude, Groq, or Ollama local) to stream live security audits.
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

          {/* Error Message */}
          {error && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-4 rounded-xl text-xs text-rose-300 flex items-start gap-3 my-4">
              <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold mb-0.5">Stream Error</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* TAB 1: AI SECURITY REPORT */}
          {activeTab === 'report' && (
            <div className="space-y-4">
              {/* Chain of Thought Box */}
              {(streamedReasoning || isThinking) && (
                <ThinkingBox thinking={streamedReasoning} isThinking={isThinking} />
              )}

              {/* Streaming or Rendered Markdown Report */}
              {streamedReport ? (
                <div className="bg-slate-950/70 p-5 sm:p-6 rounded-2xl border border-slate-800/80 shadow-inner">
                  <MarkdownReport content={streamedReport} isStreaming={isStreaming} />
                </div>
              ) : !isStreaming && !error && hasKey ? (
                <div className="py-16 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-cyan-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">Ready for Real-Time Streaming Audit</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "Start Live Audit" to stream a formatted, deconstructed network security report token-by-token.
                    </p>
                  </div>
                  <button
                    onClick={handleRunAudit}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Start Live Audit</span>
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: LIVE AI INSPECTOR (INPUT & OUTPUT STREAM) */}
          {activeTab === 'inspector' && (
            <LiveAiInspector
              metadata={inputMetadata}
              rawOutput={rawOutputStream}
              isStreaming={isStreaming}
            />
          )}

          {/* TAB 3: RAW PORT DUMP */}
          {activeTab === 'raw' && (
            <div className="space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span>Markdown Snapshot of Active Sockets:</span>
                {rawMarkdownSnapshot && (
                  <button
                    onClick={() => handleCopy(rawMarkdownSnapshot)}
                    className="p-1 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre">
                {rawMarkdownSnapshot || 'No snapshot generated yet. Run an audit to view.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
