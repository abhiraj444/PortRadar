import React from 'react';
import { Globe, Lock, ExternalLink, ShieldAlert, ShieldCheck, Cpu, Terminal, ArrowUpRight } from 'lucide-react';
import { PortInfo } from '../types/network';

interface PortCardProps {
  port: PortInfo;
  onSelect: (port: PortInfo) => void;
}

export const PortCard: React.FC<PortCardProps> = ({ port, onSelect }) => {
  const isHttpCandidate = [80, 443, 3000, 5000, 5173, 8000, 8080, 8081, 8888, 8989, 9000, 9090].includes(port.localPort);
  const isHighRisk = port.risk === 'High';
  const isDashboard = port.localPort === 8989;

  return (
    <div
      onClick={() => onSelect(port)}
      className={`group relative rounded-2xl border p-4 sm:p-5 transition-all duration-200 cursor-pointer flex flex-col justify-between ${
        isDashboard
          ? 'bg-gradient-to-b from-emerald-950/30 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
          : isHighRisk
            ? 'bg-slate-900/80 border-rose-900/40 hover:border-rose-500/50 hover:bg-slate-900 shadow-md'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90 shadow-md'
      }`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xl sm:text-2xl font-black text-slate-100 group-hover:text-cyan-400 transition-colors">
              :{port.localPort}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
              {port.proto}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {port.isLanPublic ? (
              <span
                title={port.lanExplanation}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1"
              >
                <Globe className="w-3 h-3" /> LAN
              </span>
            ) : (
              <span
                title={port.lanExplanation}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1"
              >
                <Lock className="w-3 h-3" /> Localhost
              </span>
            )}

            {isHighRisk && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Risk
              </span>
            )}
          </div>
        </div>

        {/* Title and Category */}
        <div className="mb-2">
          <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors line-clamp-1">
            {port.title}
          </h4>
          <span className="text-[11px] font-medium text-cyan-400/90">
            {port.category}
          </span>
        </div>

        {/* Plain-English Description */}
        <p className="text-xs text-slate-300/80 line-clamp-2 mb-4 leading-relaxed">
          {port.description}
        </p>
      </div>

      {/* Process & Footer Details */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <Cpu className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
          <span className="text-slate-200 font-medium truncate">{port.processName}</span>
          <span className="text-slate-500 text-[10px]">(PID: {port.pid})</span>
        </div>

        <div className="flex items-center gap-2">
          {isHttpCandidate && port.state === 'LISTENING' && (
            <a
              href={`http://localhost:${port.localPort}`}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Open localhost in new tab"
            >
              <ArrowUpRight className="w-4 h-4" />
            </a>
          )}
          <span className="text-[11px] font-sans font-semibold text-slate-500 group-hover:text-cyan-400 transition-colors flex items-center gap-0.5">
            Details &rarr;
          </span>
        </div>
      </div>
    </div>
  );
};
