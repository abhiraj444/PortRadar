import React, { useState, useMemo } from 'react';
import { 
  Folder, ChevronDown, ChevronUp, Sparkles, Globe, Lock, ShieldAlert, 
  Loader2, Info, ArrowUpRight, Cpu 
} from 'lucide-react';
import { PortInfo } from '../types/network';
import { AiConfig } from '../types/ai';

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
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
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

    // Sort categories alphabetically, with high-risk or common dev first
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to get AI explanation');
      setAiExplanations(prev => ({ ...prev, [cat]: data.explanation }));
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
            Understand every service by functional category with deep-dive educational AI explanations.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {categorized.map(([category, catPorts]) => {
          const isExpanded = expandedCategories[category] ?? true; // expanded by default
          const lanCount = catPorts.filter(p => p.isLanPublic).length;
          const hasRisk = catPorts.some(p => p.risk === 'High');
          const aiExplanation = aiExplanations[category];
          const isLoadingAi = loadingCategory === category;

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
                    title="Generate 2-3 line educational explanation of all services in this category"
                  >
                    {isLoadingAi ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    )}
                    <span className="hidden sm:inline">Ask AI to Explain</span>
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
                  {aiExplanation && (
                    <div className="bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400">
                        <Sparkles className="w-4 h-4" />
                        AI Educational Insights for {category}:
                      </div>
                      <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-slate-300">
                        {aiExplanation}
                      </div>
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
