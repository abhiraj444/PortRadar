import React from 'react';
import { Layers, ShieldCheck, ShieldAlert, Globe, Lock } from 'lucide-react';
import { PortInfo } from '../types/network';

interface PortSpectrumProps {
  ports: PortInfo[];
  onSelectPort: (port: PortInfo) => void;
}

export const PortSpectrum: React.FC<PortSpectrumProps> = ({ ports, onSelectPort }) => {
  const listening = ports.filter(p => p.state === 'LISTENING');

  // Groups
  const systemPorts = listening.filter(p => p.localPort < 1024);
  const registeredPorts = listening.filter(p => p.localPort >= 1024 && p.localPort < 49152);
  const dynamicPorts = listening.filter(p => p.localPort >= 49152);

  return (
    <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          Port Spectrum Heatmap (0 - 65,535)
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {listening.length} Active Listening Endpoints
        </span>
      </div>

      {/* Visual Spectrum Band */}
      <div className="relative h-10 bg-slate-900 rounded-xl border border-slate-800 flex overflow-hidden mb-3">
        {/* Well-known 0 - 1023 (1.5% width visually scaled to 25% for clarity) */}
        <div className="w-[25%] bg-blue-950/50 border-r border-slate-800 relative group flex items-center justify-center">
          <span className="text-[10px] font-mono text-blue-300 font-bold uppercase tracking-wider">
            System (0-1023)
          </span>
          <div className="absolute inset-0 flex items-center justify-start px-2 overflow-hidden gap-1 opacity-70">
            {systemPorts.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPort(p)}
                title={`Port ${p.localPort}: ${p.title} (${p.processName})`}
                className={`w-1.5 h-6 rounded-sm transition-all hover:scale-125 cursor-pointer ${
                  p.isLanPublic ? 'bg-amber-400 hover:bg-amber-300' : 'bg-cyan-400 hover:bg-cyan-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Registered 1024 - 49151 (scaled to 50%) */}
        <div className="w-[50%] bg-indigo-950/30 border-r border-slate-800 relative group flex items-center justify-center">
          <span className="text-[10px] font-mono text-indigo-300 font-bold uppercase tracking-wider">
            Apps & Servers (1024 - 49151)
          </span>
          <div className="absolute inset-0 flex items-center justify-start px-2 overflow-hidden gap-1 opacity-70">
            {registeredPorts.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPort(p)}
                title={`Port ${p.localPort}: ${p.title} (${p.processName})`}
                className={`w-1.5 h-6 rounded-sm transition-all hover:scale-125 cursor-pointer ${
                  p.localPort === 8989 
                    ? 'bg-emerald-400 ring-2 ring-emerald-300' 
                    : p.isLanPublic 
                      ? 'bg-amber-400 hover:bg-amber-300' 
                      : 'bg-indigo-400 hover:bg-indigo-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Dynamic / Ephemeral 49152 - 65535 (scaled to 25%) */}
        <div className="w-[25%] bg-slate-900/60 relative group flex items-center justify-center">
          <span className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
            Dynamic (49152+)
          </span>
          <div className="absolute inset-0 flex items-center justify-start px-2 overflow-hidden gap-1 opacity-70">
            {dynamicPorts.map(p => (
              <button
                key={p.id}
                onClick={() => onSelectPort(p)}
                title={`Port ${p.localPort}: ${p.title} (${p.processName})`}
                className="w-1.5 h-6 rounded-sm bg-slate-500 hover:bg-slate-300 transition-all hover:scale-125 cursor-pointer"
              />
            ))}
          </div>
        </div>
      </div>

      {/* Breakdown Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
          <span className="text-slate-300 font-medium">Core System Ports</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-cyan-300">{systemPorts.length}</span>
            <span className="text-[10px] text-slate-500">active</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
          <span className="text-slate-300 font-medium">Registered App Ports</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-indigo-300">{registeredPorts.length}</span>
            <span className="text-[10px] text-slate-500">active</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-slate-800/80 p-2.5 rounded-lg flex items-center justify-between">
          <span className="text-slate-300 font-medium">Dynamic High Ports</span>
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-slate-400">{dynamicPorts.length}</span>
            <span className="text-[10px] text-slate-500">active</span>
          </div>
        </div>
      </div>
    </div>
  );
};
