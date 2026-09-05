import React, { useState } from 'react';
import { 
  X, Globe, Lock, ShieldAlert, ShieldCheck, Cpu, Terminal, 
  ExternalLink, Copy, Check, Trash2, AlertTriangle, Info, Network
} from 'lucide-react';
import { PortInfo } from '../types/network';

interface PortDetailModalProps {
  port: PortInfo | null;
  lanIp: string;
  onClose: () => void;
  onProcessKilled: () => void;
}

export const PortDetailModal: React.FC<PortDetailModalProps> = ({ 
  port, 
  lanIp, 
  onClose,
  onProcessKilled 
}) => {
  const [copied, setCopied] = useState(false);
  const [killing, setKilling] = useState(false);
  const [killError, setKillError] = useState<string | null>(null);

  if (!port) return null;

  const isHttpCandidate = [80, 443, 3000, 5000, 5173, 8000, 8080, 8081, 8888, 8989, 9000, 9090].includes(port.localPort);
  const canKill = port.pid > 4 && port.localPort !== 8989;

  const handleCopyCurl = () => {
    const cmd = `curl http://localhost:${port.localPort}`;
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKill = async () => {
    if (!confirm(`Are you sure you want to terminate process "${port.processName}" (PID: ${port.pid}) on port ${port.localPort}?`)) {
      return;
    }

    setKilling(true);
    setKillError(null);
    try {
      const res = await fetch('/api/kill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pid: port.pid })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to kill process');
      }
      onProcessKilled();
      onClose();
    } catch (err: any) {
      setKillError(err.message || 'Error stopping process');
    } finally {
      setKilling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="font-mono text-2xl sm:text-3xl font-black text-cyan-400">
              :{port.localPort}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {port.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                <span className="font-mono">{port.proto}</span>
                <span>&bull;</span>
                <span>{port.category}</span>
                <span>&bull;</span>
                <span className="text-emerald-400 font-semibold">{port.state}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Exposure Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            port.isLanPublic
              ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
              : 'bg-blue-950/20 border-blue-500/30 text-blue-200'
          }`}>
            {port.isLanPublic ? (
              <Globe className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            ) : (
              <Lock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h4 className="text-sm font-bold flex items-center gap-2">
                {port.isLanPublic ? 'Exposed to Local Network (Wi-Fi)' : 'Restricted to Localhost (This Machine)'}
              </h4>
              <p className="text-xs opacity-90 leading-relaxed">
                {port.lanExplanation}
              </p>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              What this server means
            </h4>
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-200 space-y-2.5 leading-relaxed">
              <p>{port.description}</p>
              {port.details && (
                <p className="text-xs text-slate-400 pt-2 border-t border-slate-800/60">
                  {port.details}
                </p>
              )}
            </div>
          </div>

          {/* Process Diagnostics Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Process & Binding Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Process Name</span>
                <span className="font-mono font-bold text-slate-100">{port.processName}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Process ID (PID)</span>
                <span className="font-mono font-bold text-cyan-300">{port.pid}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Memory Usage</span>
                <span className="font-mono font-bold text-slate-300">{port.memory || 'N/A'}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Local Address</span>
                <span className="font-mono font-bold text-slate-200">{port.localAddress}:{port.localPort}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Foreign Address</span>
                <span className="font-mono font-bold text-slate-400">{port.foreignAddress || '*:*'}</span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-500 block mb-1">Risk Rating</span>
                <span className={`font-bold ${
                  port.risk === 'High' ? 'text-rose-400' : port.risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {port.risk}
                </span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-3.5 rounded-xl text-xs flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200 block mb-0.5">Security Recommendation:</span>
              <span className="text-slate-400">{port.recommendation}</span>
            </div>
          </div>

          {/* Kill error if any */}
          {killError && (
            <div className="bg-rose-950/30 border border-rose-500/40 p-3 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{killError}</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isHttpCandidate && (
              <a
                href={`http://localhost:${port.localPort}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open in Browser</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <button
              onClick={handleCopyCurl}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied curl' : 'Copy curl test'}</span>
            </button>
          </div>

          {/* Process Termination Button */}
          {canKill ? (
            <button
              onClick={handleKill}
              disabled={killing}
              className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{killing ? 'Terminating...' : `Stop Process (PID ${port.pid})`}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-500 italic">
              {port.pid <= 4 ? 'Protected Windows kernel process' : 'Dashboard process (active)'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
