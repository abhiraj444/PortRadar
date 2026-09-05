import React, { useState } from 'react';
import { Brain, ChevronDown, ChevronUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface ThinkingBoxProps {
  thinking: string;
  isThinking: boolean;
}

export const ThinkingBox: React.FC<ThinkingBoxProps> = ({ thinking, isThinking }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!thinking && !isThinking) return null;

  return (
    <div className="bg-gradient-to-r from-purple-950/30 via-slate-900 to-indigo-950/30 border border-purple-500/30 rounded-2xl overflow-hidden mb-5 shadow-lg shadow-purple-950/20 transition-all">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-purple-950/40 border-b border-purple-500/20 flex items-center justify-between cursor-pointer select-none hover:bg-purple-900/30 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30">
            <Brain className={`w-4 h-4 ${isThinking ? 'animate-pulse text-purple-300' : 'text-purple-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
                Chain-of-Thought Reasoning
              </span>
              {isThinking ? (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-ping"></span>
                  Deliberating...
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Reasoning Complete
                </span>
              )}
            </div>
          </div>
        </div>

        <button className="text-purple-300 p-1 hover:text-white transition-colors">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="p-4 text-xs font-mono text-purple-200/85 leading-relaxed max-h-60 overflow-y-auto whitespace-pre-wrap bg-slate-950/40 border-t border-purple-900/40 selection:bg-purple-500/30">
          {thinking}
          {isThinking && (
            <span className="inline-block w-2 h-3.5 ml-1 bg-purple-400 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  );
};
