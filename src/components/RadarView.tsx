import React, { useState, useMemo } from 'react';
import { Laptop, Shield, ShieldAlert, Globe, Lock, ExternalLink, Zap } from 'lucide-react';
import { PortInfo } from '../types/network';

interface RadarViewProps {
  ports: PortInfo[];
  onSelectPort: (port: PortInfo) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({ ports, onSelectPort }) => {
  const [hoveredPort, setHoveredPort] = useState<PortInfo | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'lan' | 'dev'>('all');

  // Filter listening ports for clean visualization
  const activeNodes = useMemo(() => {
    let list = ports.filter(p => p.state === 'LISTENING');

    if (filterMode === 'lan') {
      list = list.filter(p => p.isLanPublic);
    } else if (filterMode === 'dev') {
      list = list.filter(p => 
        p.category.toLowerCase().includes('dev') || 
        p.category.toLowerCase().includes('web') ||
        p.processName.toLowerCase().includes('node') ||
        p.processName.toLowerCase().includes('python')
      );
    }

    // Assign polar coordinates based on port ranges and angle
    return list.map((port, idx, arr) => {
      let ringRadius = 140; // Default middle ring
      if (port.localPort < 1024) {
        ringRadius = 80; // Inner ring (System / Well-Known)
      } else if (port.localPort > 20000) {
        ringRadius = 205; // Outer ring (Dynamic / High Ports)
      } else {
        ringRadius = 145; // Middle ring (Apps / Dev)
      }

      // Distribute evenly around the circle
      const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
      const x = 250 + ringRadius * Math.cos(angle);
      const y = 250 + ringRadius * Math.sin(angle);

      return {
        ...port,
        x,
        y,
        angle
      };
    });
  }, [ports, filterMode]);

  return (
    <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden backdrop-blur-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Live Port Topology & Radar Map
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time orbital radar mapping all listening network servers orbiting your laptop core.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterMode === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Listening ({ports.filter(p => p.state === 'LISTENING').length})
          </button>
          <button
            onClick={() => setFilterMode('lan')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterMode === 'lan' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            LAN Public
          </button>
          <button
            onClick={() => setFilterMode('dev')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              filterMode === 'dev' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dev & Web
          </button>
        </div>
      </div>

      {/* Radar SVG Container */}
      <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center">
        <svg viewBox="0 0 500 500" className="w-full h-full select-none">
          <defs>
            {/* Radar scanner gradient */}
            <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.2)" />
              <stop offset="80%" stopColor="rgba(56, 189, 248, 0.04)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Concentric Radar Rings */}
          <circle cx="250" cy="250" r="80" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="250" cy="250" r="145" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="250" cy="250" r="210" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1" />

          {/* Crosshairs */}
          <line x1="250" y1="20" x2="250" y2="480" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />
          <line x1="20" y1="250" x2="480" y2="250" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />

          {/* Orbital Range Labels */}
          <text x="250" y="165" fill="rgba(148, 163, 184, 0.4)" fontSize="9" textAnchor="middle" fontFamily="monospace">
            SYSTEM & CORE (&lt; 1024)
          </text>
          <text x="250" y="100" fill="rgba(148, 163, 184, 0.4)" fontSize="9" textAnchor="middle" fontFamily="monospace">
            REGISTERED APPS (1024 - 20000)
          </text>
          <text x="250" y="36" fill="rgba(148, 163, 184, 0.4)" fontSize="9" textAnchor="middle" fontFamily="monospace">
            DYNAMIC & EPHEMERAL (&gt; 20000)
          </text>

          {/* Connecting Rays from center to hovered node */}
          {hoveredPort && (
            <line
              x1="250"
              y1="250"
              x2={activeNodes.find(n => n.id === hoveredPort.id)?.x || 250}
              y2={activeNodes.find(n => n.id === hoveredPort.id)?.y || 250}
              stroke="rgba(56, 189, 248, 0.6)"
              strokeWidth="2"
              strokeDasharray="2 2"
            />
          )}

          {/* Nodes */}
          {activeNodes.map((node) => {
            const isHovered = hoveredPort?.id === node.id;
            const isLan = node.isLanPublic;
            const isHighRisk = node.risk === 'High';
            const isAppServer = node.localPort === 8989;

            let fillColor = '#38bdf8'; // Cyan default
            let strokeColor = '#0284c7';

            if (isAppServer) {
              fillColor = '#10b981'; // Emerald for this app
              strokeColor = '#059669';
            } else if (isHighRisk) {
              fillColor = '#f43f5e'; // Rose
              strokeColor = '#e11d48';
            } else if (isLan) {
              fillColor = '#f59e0b'; // Amber for LAN exposed
              strokeColor = '#d97706';
            } else {
              fillColor = '#6366f1'; // Indigo for protected
              strokeColor = '#4f46e5';
            }

            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform duration-150"
                onClick={() => onSelectPort(node)}
                onMouseEnter={() => setHoveredPort(node)}
                onMouseLeave={() => setHoveredPort(null)}
              >
                {/* Ping ring for hovered node or dashboard port */}
                {(isHovered || isAppServer) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isHovered ? "18" : "12"}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth="1.5"
                    className="animate-ping opacity-60"
                  />
                )}

                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isHovered ? "8" : "5"}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="1.5"
                  filter={isHovered ? "url(#glow)" : undefined}
                />

                {/* Port text label */}
                <text
                  x={node.x}
                  y={node.y - (isHovered ? 12 : 8)}
                  fill={isHovered ? "#ffffff" : "rgba(226, 232, 240, 0.8)"}
                  fontSize={isHovered ? "11" : "9"}
                  fontWeight={isHovered ? "bold" : "normal"}
                  textAnchor="middle"
                  fontFamily="monospace"
                  className="pointer-events-none drop-shadow"
                >
                  {node.localPort}
                </text>
              </g>
            );
          })}

          {/* Central Core (Laptop) */}
          <circle cx="250" cy="250" r="24" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" filter="url(#glow)" />
        </svg>

        {/* Center Laptop Icon */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center">
          <Laptop className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">HOST</span>
        </div>
      </div>

      {/* Interactive Tooltip Card at Bottom of Radar */}
      <div className="mt-2 min-h-[72px] bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex items-center justify-between transition-all">
        {hoveredPort ? (
          <div className="flex items-center justify-between w-full gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-100 font-mono">
                  Port {hoveredPort.localPort} ({hoveredPort.proto})
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {hoveredPort.title}
                </span>
                {hoveredPort.isLanPublic ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold border border-amber-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> LAN Open
                  </span>
                ) : (
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-semibold border border-blue-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Localhost
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 line-clamp-1">
                {hoveredPort.description}
              </p>
              <div className="text-[11px] text-slate-500 font-mono">
                Process: <strong className="text-slate-300">{hoveredPort.processName}</strong> (PID: {hoveredPort.pid})
              </div>
            </div>

            <button
              onClick={() => onSelectPort(hoveredPort)}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors flex-shrink-0 cursor-pointer"
            >
              <span>Explain</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center w-full py-1">
            Hover over any port orbit node on the radar to preview what server is listening, or click to read its full explanation.
          </div>
        )}
      </div>
    </div>
  );
};
