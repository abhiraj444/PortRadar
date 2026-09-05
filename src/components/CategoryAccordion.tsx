import React, { useState, useMemo } from 'react';
import { 
  Folder, ChevronDown, ChevronUp, Sparkles, Globe, Lock, ShieldAlert, 
  Loader2, Info, ArrowUpRight, Cpu, Terminal, CheckCircle2 
} from 'lucide-react';
import { PortInfo } from '../types/network';
import { AiConfig } from '../types/ai';
import { MarkdownReport } from './MarkdownReport';
import { ThinkingBox } from './ThinkingBox';
import { LiveAiInspector } from './LiveAiInspector';

interface CategoryAccordionProps {
  ports: PortInfo[];
  aiConfig: AiConfig;
  onSelectPort: (port: PortInfo) => void;
  onOpenAiSettings: () => void;
}

export const CategoryAccordion: React.FC<CategoryAccordionProps> = ({
  ports,
  aiConfig,
  onSelectPort,
  onOpenAiSettings
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categoryStreams, setCategoryStreams] = useState<Record<string, string>>({});
  const [categoryThinking, setCategoryThinking] = useState<Record<string, string>>({});
  const [categoryRawOutput, setCategoryRawOutput] = useState<Record<string, string>>({});
  const [categoryInspector, setCategoryInspector] = useState<Record<string, any>>({});
  const [activeInspector, setActiveInspector] = useState<string | null>(null);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Group listening ports by category
  const categorized = useMemo(() => {
    const map: Record<string, PortInfo[]> = {};
    const listening = ports.filter(p => p.state === 'LISTENING');

    for (const p of listening) {
      const cat = p.category || 'General Network';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    }

    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [ports]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleAskAi = async (cat: string, catPorts: PortInfo[]) => {
    const hasKey = Boolean(aiConfig.apiKey.trim() || aiConfig.provider === 'ollama');
    if (!hasKey) {
      onOpenAiSettings();
      return;
    }

    setLoadingCategory(cat);
    setCategoryStreams(prev => ({ ...prev, [cat]: '' }));
    setCategoryThinking(prev => ({ ...prev, [cat]: '' }));
    setCategoryRawOutput(prev => ({ ...prev, [cat]: '' }));

    try {
      const res = await fetch('/api/ai/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: aiConfig,
          category: cat,
          ports: catPorts
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Readable stream not supported');

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
              const meta = JSON.parse(data);
              setCategoryInspector(prev => ({ ...prev, [cat]: meta }));
            } catch {}
          } else if (event === 'reasoning') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setCategoryThinking(prev => ({ ...prev, [cat]: (prev[cat] || '') + parsed.text }));
                setCategoryRawOutput(prev => ({ ...prev, [cat]: (prev[cat] || '') + parsed.text }));
              }
            } catch {}
          } else if (event === 'delta') {
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                setCategoryStreams(prev => ({ ...prev, [cat]: (prev[cat] || '') + parsed.text }));
                setCategoryRawOutput(prev => ({ ...prev, [cat]: (prev[cat] || '') + parsed.text }));
              }
            } catch {}
          } else if (event === 'done') {
            setLoadingCategory(null);
          } else if (event === 'error') {
            try {
              const parsed = JSON.parse(data);
              alert(parsed.error || 'Category explanation error');
            } catch {}
            setLoadingCategory(null);
          }
        }
      }
    } catch (err: any) {
      alert(err.message || 'AI explanation failed');
    } finally {
      setLoadingCategory(null);
    }
  };

  return (
    <div className="space-y-4 mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Folder className="w-5 h-5 text-indigo-400" />
            AI Categorized Port Explorer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Understand every service by functional category with live streaming educational AI explanations.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {categorized.map(([category, catPorts]) => {
          const isExpanded = expandedCategories[category] ?? true;
          const lanCount = catPorts.filter(p => p.isLanPublic).length;
          const hasRisk = catPorts.some(p => p.risk === 'High');
          const aiStream = categoryStreams[category];
          const thinkingText = categoryThinking[category];
          const inspectorData = categoryInspector[category];
          const isLoadingAi = loadingCategory === category;
          const showInspector = activeInspector === category;

          return (
            <div
              key={category}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition-all shadow-md"
            >
              {/* Accordion Header */}
              <div
                onClick={() => toggleCategory(category)}
                className="px-5 py-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-850/60 transition-colors select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <span>{category}</span>
                      <span className="text-xs font-mono font-normal text-cyan-400 bg-slate-800 px-2 py-0.5 rounded-full">
                        {catPorts.length} {catPorts.length === 1 ? 'port' : 'ports'}
                      </span>
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      {lanCount > 0 ? (
                        <span className="text-amber-400 flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {lanCount} exposed to local Wi-Fi
                        </span>
                      ) : (
                        <span className="text-blue-400 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> All localhost restricted
                        </span>
                      )}
                      {hasRisk && (
                        <>
                          <span>&bull;</span>
                          <span className="text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3" /> Potential risk detected
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAi(category, catPorts);
                    }}
                    disabled={isLoadingAi}
                    className="px-3 py-1.5 bg-gradient-to-r from-cyan-600/20 to-indigo-600/20 hover:from-cyan-600/30 hover:to-indigo-600/30 text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Stream educational explanation of all services in this category"
                  >
                    {isLoadingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="hidden sm:inline">{isLoadingAi ? 'Streaming...' : 'Ask AI to Explain'}</span>
                    <span className="sm:hidden">Explain</span>
                  </button>

                  <div className="p-1 text-slate-400 hover:text-slate-200">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Accordion Content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 space-y-3 border-t border-slate-800/60">
                  {/* AI Educational Explanation Box */}
                  {(aiStream || isLoadingAi) && (
                    <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-4 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                          <Sparkles className="w-4 h-4" />
                          <span>AI Educational Insights for {category}:</span>
                          {isLoadingAi && (
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping ml-1" />
                          )}
                        </div>

                        {/* View Switcher: Formatted vs Live Inspector */}
                        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                          <button
                            onClick={() => setActiveInspector(null)}
                            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                              !showInspector ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Formatted Report
                          </button>
                          <button
                            onClick={() => setActiveInspector(category)}
                            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                              showInspector ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <Terminal className="w-3 h-3 text-indigo-400" />
                            <span>Live Inspector</span>
                          </button>
                        </div>
                      </div>

                      {/* Content view */}
                      {!showInspector ? (
                        <div className="space-y-3">
                          {thinkingText && (
                            <ThinkingBox thinking={thinkingText} isThinking={isLoadingAi} />
                          )}
                          <MarkdownReport content={aiStream} isStreaming={isLoadingAi} />
                        </div>
                      ) : (
                        <LiveAiInspector
                          metadata={inspectorData}
                          rawOutput={categoryRawOutput[category] || aiStream}
                          isStreaming={isLoadingAi}
                        />
                      )}
                    </div>
                  )}

                  {/* Port Cards Grid inside this Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {catPorts.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onSelectPort(p)}
                        className="bg-slate-950/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-mono font-black text-cyan-300 text-base">
                              :{p.localPort} <span className="text-[10px] text-slate-500 font-normal">({p.proto})</span>
                            </span>
                            {p.isLanPublic ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 font-semibold">
                                <Globe className="w-2.5 h-2.5" /> LAN
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-semibold">
                                <Lock className="w-2.5 h-2.5" /> Local
                              </span>
                            )}
                          </div>
                          <div className="font-semibold text-xs text-slate-100 line-clamp-1 mb-1">
                            {p.title}
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {p.description}
                          </p>
                        </div>

                        <div className="pt-2.5 mt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <span className="truncate max-w-[80%]">{p.processName} (PID: {p.pid})</span>
                          <span className="text-cyan-400 font-semibold font-sans">Details &rarr;</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
