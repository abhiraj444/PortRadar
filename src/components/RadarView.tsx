import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Laptop, Globe, Lock, ExternalLink, Zap, X, ShieldAlert, ArrowUpRight, Info } from 'lucide-react';
import { PortInfo } from '../types/network';

interface RadarViewProps {
  ports: PortInfo[];
  onSelectPort: (port: PortInfo) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({ ports, onSelectPort }) => {
  // activePort persists on hover/tap until dismissed by clicking blank space, another port, or close [X]
  const [activePort, setActivePort] = useState<PortInfo | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'lan' | 'dev'>('all');

  // Dismiss activePort on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePort(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter listening ports for clean visualization
  const filteredList = useMemo(() => {
    let list = ports.filter(p => p.state === 'LISTENING');

    if (filterMode === 'lan') {
      list = list.filter(p => p.isLanPublic);
    } else if (filterMode === 'dev') {
      list = list.filter(p => 
        p.category.toLowerCase().includes('dev') || 
        p.category.toLowerCase().includes('web') ||
        p.processName.toLowerCase().includes('node') ||
        p.processName.toLowerCase().includes('python') ||
        p.processName.toLowerCase().includes('vite') ||
        p.processName.toLowerCase().includes('java')
      );
    }

    return list;
  }, [ports, filterMode]);

  // Distribute nodes 360 degrees around EACH ring separately to avoid clumping
  const activeNodes = useMemo(() => {
    const systemRing = filteredList.filter(p => p.localPort < 1024);
    const registeredRing = filteredList.filter(p => p.localPort >= 1024 && p.localPort <= 20000);
    const dynamicRing = filteredList.filter(p => p.localPort > 20000);

    const mapRingNodes = (ring: PortInfo[], radius: number, offsetAngle: number = 0) => {
      const len = ring.length || 1;
      return ring.map((port, idx) => {
        // Distribute 360 degrees around the ring
        const angle = (idx / len) * 2 * Math.PI - Math.PI / 2 + offsetAngle;
        const x = 250 + radius * Math.cos(angle);
        const y = 250 + radius * Math.sin(angle);
        return {
          ...port,
          x,
          y,
          angle,
          ringRadius: radius
        };
      });
    };

    // Stagger angles slightly between rings so dots don't line up in spokes
    const systemMapped = mapRingNodes(systemRing, 80, 0);
    const registeredMapped = mapRingNodes(registeredRing, 145, 0.25);
    const dynamicMapped = mapRingNodes(dynamicRing, 210, 0.5);

    return [...systemMapped, ...registeredMapped, ...dynamicMapped];
  }, [filteredList]);

  // Keep activePort data updated if ports data refreshes
  useEffect(() => {
    if (activePort) {
      const fresh = ports.find(p => p.id === activePort.id || (p.localPort === activePort.localPort && p.proto === activePort.proto));
      if (fresh) {
        setActivePort(fresh);
      }
    }
  }, [ports]);

  // Determine if a node should show a persistent label
  const lanPortsCount = useMemo(() => activeNodes.filter(n => n.isLanPublic).length, [activeNodes]);

  const shouldShowLabel = useCallback((node: any, isSelected: boolean) => {
    if (isSelected) return true;
    if (node.localPort === 8989) return true; // Always label PortRadar
    if (node.isLanPublic && lanPortsCount <= 5) return true; // Label LAN ports if few
    if (activeNodes.length <= 15) return true; // Label all if few nodes
    return false;
  }, [lanPortsCount, activeNodes.length]);

  return (
    <div 
      onClick={() => setActivePort(null)} 
      className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 mb-6 relative overflow-hidden backdrop-blur-md transition-colors select-none"
    >
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4" onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Live Port Topology & Radar Map
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Orbital radar mapping listening servers orbiting your laptop core.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-xl text-xs w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterMode === 'all' ? 'bg-cyan-500/20 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Listening</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
              {ports.filter(p => p.state === 'LISTENING').length}
            </span>
          </button>
          <button
            onClick={() => setFilterMode('lan')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterMode === 'lan' ? 'bg-amber-500/20 text-amber-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span>LAN Public</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
              {ports.filter(p => p.state === 'LISTENING' && p.isLanPublic).length}
            </span>
          </button>
          <button
            onClick={() => setFilterMode('dev')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              filterMode === 'dev' ? 'bg-indigo-500/20 text-indigo-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Dev & Web</span>
          </button>
        </div>
      </div>

      {/* Radar SVG Container */}
      <div 
        className="relative w-full aspect-square max-w-[460px] mx-auto flex items-center justify-center cursor-crosshair"
      >
        <svg 
          viewBox="0 0 500 500" 
          className="w-full h-full select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActivePort(null);
            }
          }}
        >
          <defs>
            {/* Radar scanner sweep gradient */}
            <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.15)" />
              <stop offset="80%" stopColor="rgba(56, 189, 248, 0.03)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Radar background circle click catcher */}
          <circle cx="250" cy="250" r="240" fill="transparent" />

          {/* Concentric Radar Rings */}
          <circle cx="250" cy="250" r="80" fill="none" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="250" cy="250" r="145" fill="none" stroke="rgba(56, 189, 248, 0.14)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="250" cy="250" r="210" fill="none" stroke="rgba(56, 189, 248, 0.18)" strokeWidth="1" />

          {/* Crosshairs */}
          <line x1="250" y1="25" x2="250" y2="475" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" />
          <line x1="25" y1="250" x2="475" y2="250" stroke="rgba(56, 189, 248, 0.07)" strokeWidth="1" />

          {/* Orbital Range Labels (Subtle & Clean) */}
          <text x="250" y="165" fill="rgba(148, 163, 184, 0.3)" fontSize="8.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.05em">
            SYSTEM CORE (&lt; 1024)
          </text>
          <text x="250" y="100" fill="rgba(148, 163, 184, 0.3)" fontSize="8.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.05em">
            REGISTERED APPS (1024 - 20000)
          </text>
          <text x="250" y="36" fill="rgba(148, 163, 184, 0.3)" fontSize="8.5" textAnchor="middle" fontFamily="monospace" letterSpacing="0.05em">
            DYNAMIC HIGH (&gt; 20000)
          </text>

          {/* Connecting Laser Beam to Active Port */}
          {activePort && (
            <line
              x1="250"
              y1="250"
              x2={activeNodes.find(n => n.id === activePort.id || (n.localPort === activePort.localPort && n.proto === activePort.proto))?.x || 250}
              y2={activeNodes.find(n => n.id === activePort.id || (n.localPort === activePort.localPort && n.proto === activePort.proto))?.y || 250}
              stroke="rgba(56, 189, 248, 0.8)"
              strokeWidth="2"
              strokeDasharray="3 3"
              className="animate-pulse"
            />
          )}

          {/* Orbit Nodes */}
          {activeNodes.map((node) => {
            const isSelected = activePort?.id === node.id || (activePort?.localPort === node.localPort && activePort?.proto === node.proto);
            const isLan = node.isLanPublic;
            const isHighRisk = node.risk === 'High';
            const isAppServer = node.localPort === 8989;

            let fillColor = '#38bdf8'; // Cyan default (localhost apps)
            let strokeColor = '#0284c7';

            if (isAppServer) {
              fillColor = '#10b981'; // Emerald for PortRadar itself
              strokeColor = '#059669';
            } else if (isHighRisk) {
              fillColor = '#f43f5e'; // Rose
              strokeColor = '#e11d48';
            } else if (isLan) {
              fillColor = '#f59e0b'; // Amber for LAN public
              strokeColor = '#d97706';
            } else {
              fillColor = '#6366f1'; // Indigo for protected localhost
              strokeColor = '#4f46e5';
            }

            const showLabel = shouldShowLabel(node, isSelected);

            return (
              <g
                key={node.id}
                className="cursor-pointer"
                onMouseEnter={() => setActivePort(node)}
                onTouchStart={() => setActivePort(node)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePort(node);
                }}
              >
                {/* Generous touch/hover hit area */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="14"
                  fill="transparent"
                />

                {/* Animated Ping Ring for active/selected node or PortRadar server */}
                {(isSelected || isAppServer) && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={isSelected ? "16" : "10"}
                    fill="none"
                    stroke={fillColor}
                    strokeWidth={isSelected ? "2" : "1.5"}
                    className="animate-ping opacity-60"
                  />
                )}

                {/* Main Node Dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isSelected ? "7" : isAppServer ? "6" : isLan ? "5" : "4"}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? "2" : "1.2"}
                  filter={isSelected ? "url(#glow)" : undefined}
                  className="transition-all duration-150"
                />

                {/* Clean Floating Badge Label for Active / Key Ports */}
                {showLabel && (
                  <g className="pointer-events-none transition-all">
                    {isSelected ? (
                      /* Active Highlight Pill */
                      <g>
                        <rect
                          x={node.x - 32}
                          y={node.y - 26}
                          width="64"
                          height="18"
                          rx="5"
                          fill="#090d16"
                          stroke={fillColor}
                          strokeWidth="1.5"
                          filter="url(#glow)"
                        />
                        <text
                          x={node.x}
                          y={node.y - 14}
                          fill="#ffffff"
                          fontSize="10"
                          fontWeight="bold"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          :{node.localPort}
                        </text>
                      </g>
                    ) : (
                      /* Subtle Non-overlapping Label */
                      <text
                        x={node.x}
                        y={node.y - 8}
                        fill="rgba(203, 213, 225, 0.75)"
                        fontSize="8.5"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="drop-shadow"
                      >
                        {node.localPort}
                      </text>
                    )}
                  </g>
                )}
              </g>
            );
          })}

          {/* Central Core (Laptop Host) */}
          <circle cx="250" cy="250" r="24" fill="#090d16" stroke="#38bdf8" strokeWidth="2" filter="url(#glow)" />
        </svg>

        {/* Center Laptop Icon */}
        <div 
          onClick={(e) => {
            e.stopPropagation();
            setActivePort(null);
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center"
        >
          <Laptop className="w-5 h-5 text-cyan-400 animate-pulse" />
          <span className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5 tracking-wider">HOST</span>
        </div>
      </div>

      {/* Persistent Inspection Card at Bottom of Radar */}
      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`mt-3 min-h-[82px] rounded-xl p-3.5 transition-all border ${
          activePort 
            ? 'bg-slate-900/95 border-cyan-500/40 shadow-xl shadow-cyan-950/20 ring-1 ring-cyan-500/20' 
            : 'bg-slate-900/40 border-slate-800/70'
        }`}
      >
        {activePort ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 w-full">
            <div className="space-y-1 flex-1 min-w-0">
              {/* Title & Badges Bar */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-black text-cyan-300 font-mono tracking-tight">
                  Port :{activePort.localPort}
                </span>
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                  {activePort.proto}
                </span>
                <span className="text-xs text-slate-100 font-semibold truncate max-w-[220px]">
                  {activePort.title}
                </span>

                {/* LAN Open / Localhost Pill */}
                {activePort.isLanPublic ? (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-semibold border border-amber-500/30 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> LAN Open
                  </span>
                ) : (
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold border border-indigo-500/30 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Localhost
                  </span>
                )}

                {activePort.risk === 'High' && (
                  <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-semibold border border-rose-500/30 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> High Risk
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 line-clamp-1 leading-relaxed">
                {activePort.description}
              </p>

              {/* Process & PID */}
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                <span>Process: <strong className="text-slate-200">{activePort.processName}</strong></span>
                <span className="text-slate-600">&bull;</span>
                <span>PID: <strong className="text-slate-300">{activePort.pid}</strong></span>
                <span className="text-slate-600">&bull;</span>
                <span>Address: <code className="text-cyan-400/90">{activePort.localAddress}:{activePort.localPort}</code></span>
              </div>
            </div>

            {/* Action Buttons & Close */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
              {[80, 443, 3000, 5000, 5173, 8000, 8080, 8081, 8888, 8989, 9000, 9090].includes(activePort.localPort) && (
                <a
                  href={`http://localhost:${activePort.localPort}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg flex items-center gap-1 transition-colors"
                  title="Open in Browser"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open</span>
                </a>
              )}

              {/* Explain Button */}
              <button
                onClick={() => onSelectPort(activePort)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-cyan-900/30 cursor-pointer"
              >
                <span>Explain in Detail</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss [X] Button */}
              <button
                onClick={() => setActivePort(null)}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Dismiss (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 py-1.5 text-center">
            <Info className="w-4 h-4 text-cyan-500/70 flex-shrink-0" />
            <span>
              Hover or tap any orbit node to inspect it. The card stays open until you click blank space, another port, or the close button.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
