import React, { useState } from 'react';
import { Terminal, Copy, Check, Cpu, Globe, ArrowRight, Activity, FileText } from 'lucide-react';

export interface AiInputMetadata {
  provider?: string;
  model?: string;
  endpoint?: string;
  reasoningMode?: boolean;
  systemPrompt?: string;
  userPrompt?: string;
  rawMarkdown?: string;
  timestamp?: string;
  category?: string;
}

interface LiveAiInspectorProps {
  metadata: AiInputMetadata | null;
  rawOutput: string;
  isStreaming: boolean;
}

export const LiveAiInspector: React.FC<LiveAiInspectorProps> = ({
  metadata,
  rawOutput,
  isStreaming
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'input' | 'output'>('input');
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('input')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'input'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Raw Input Sent to AI</span>
          </button>

          <button
            onClick={() => setActiveSubTab('output')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeSubTab === 'output'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. Raw Output Stream</span>
            {isStreaming && (
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping ml-1" />
            )}
          </button>
        </div>

        {/* Live stream stats */}
        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <Activity className={`w-3.5 h-3.5 ${isStreaming ? 'text-cyan-400 animate-spin' : 'text-slate-500'}`} />
          <span>Output: <strong className="text-slate-200">{rawOutput.length} chars</strong></span>
        </div>
      </div>

      {/* 1. INPUT TAB */}
      {activeSubTab === 'input' && (
        <div className="space-y-4 text-xs font-mono">
          {metadata ? (
            <>
              {/* Endpoint & Model Metadata Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Target Endpoint</span>
                  <span className="text-cyan-400 truncate block text-[11px]" title={metadata.endpoint}>
                    {metadata.endpoint || 'Standard API'}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Model & Provider</span>
                  <span className="text-slate-200 font-bold block text-[11px]">
                    {metadata.provider?.toUpperCase()} &bull; {metadata.model}
                  </span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-500 text-[10px] uppercase block mb-0.5">Reasoning Mode</span>
                  <span className={`font-bold block text-[11px] ${
                    metadata.reasoningMode ? 'text-purple-400' : 'text-slate-400'
                  }`}>
                    {metadata.reasoningMode ? '🧠 ENABLED (Chain-of-Thought)' : '⚡ Direct Output'}
                  </span>
                </div>
              </div>

              {/* System Prompt Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-[11px] text-slate-300">System Instruction Prompt:</span>
                  <button
                    onClick={() => handleCopy(metadata.systemPrompt || '', 'sys')}
                    className="p-1 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copied === 'sys' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'sys' ? 'Copied' : 'Copy System'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap text-[11px]">
                  {metadata.systemPrompt}
                </div>
              </div>

              {/* User Prompt Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="font-semibold text-[11px] text-slate-300">User Context & Snapshot Prompt:</span>
                  <button
                    onClick={() => handleCopy(metadata.userPrompt || '', 'user')}
                    className="p-1 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copied === 'user' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'user' ? 'Copied' : 'Copy User'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-slate-300 leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap text-[11px]">
                  {metadata.userPrompt}
                </div>
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 font-sans">
              Run an AI audit or ask for an explanation to inspect the live input payload sent to the LLM.
            </div>
          )}
        </div>
      )}

      {/* 2. OUTPUT TAB */}
      {activeSubTab === 'output' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono">
            <span>Raw Output Stream Buffer:</span>
            <button
              onClick={() => handleCopy(rawOutput, 'out')}
              className="p-1 hover:text-white flex items-center gap-1 text-[10px]"
            >
              {copied === 'out' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied === 'out' ? 'Copied' : 'Copy Raw Output'}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap selection:bg-cyan-500/30">
            {rawOutput ? (
              <>
                {rawOutput}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-cyan-400 animate-pulse align-middle" />
                )}
              </>
            ) : (
              <span className="text-slate-600 font-sans italic">
                {isStreaming ? 'Awaiting initial stream tokens...' : 'No stream generated yet. Run an audit to see live tokens.'}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
