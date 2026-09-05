import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Radar, LayoutGrid, Table as TableIcon, RefreshCw, Search, Filter, 
  Wifi, Shield, AlertCircle, Laptop, Globe, Lock, Cpu, ArrowUpDown,
  Sparkles, Settings, Folder, ShieldCheck
} from 'lucide-react';
import { NetworkInfo, PortInfo, ScanResponse } from './types/network';
import { AiConfig, DEFAULT_AI_CONFIG } from './types/ai';
import { LanShareBanner } from './components/LanShareBanner';
import { StatsBar } from './components/StatsBar';
import { RadarView } from './components/RadarView';
import { PortSpectrum } from './components/PortSpectrum';
import { PortCard } from './components/PortCard';
import { PortDetailModal } from './components/PortDetailModal';
import { CategoryAccordion } from './components/CategoryAccordion';
import { AiSettingsModal } from './components/AiSettingsModal';
import { AiAuditModal } from './components/AiAuditModal';

const STORAGE_KEY = 'portradar_ai_config';

export function App() {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'radar' | 'categories' | 'table'>('overview');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedPort, setSelectedPort] = useState<PortInfo | null>(null);

  // AI State
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_AI_CONFIG;
    } catch {
      return DEFAULT_AI_CONFIG;
    }
  });
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isAiAuditOpen, setIsAiAuditOpen] = useState(false);

  // Save AI Config
  const handleSaveAiConfig = (newConfig: AiConfig) => {
    setAiConfig(newConfig);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    } catch {
      // ignore storage error
    }
  };

  // Fetch network IP info
  const fetchNetwork = useCallback(async () => {
    try {
      const res = await fetch('/api/network');
      if (res.ok) {
        const data: NetworkInfo = await res.json();
        setNetwork(data);
      }
    } catch (err) {
      console.error('Failed to load network info', err);
    }
  }, []);

  // Fetch active ports and processes
  const fetchPorts = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    try {
      const res = await fetch('/api/ports');
      if (res.ok) {
        const data: ScanResponse = await res.json();
        setScanData(data);
      }
    } catch (err) {
      console.error('Failed to load ports data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchNetwork();
    fetchPorts();
  }, [fetchNetwork, fetchPorts]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchPorts(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchPorts]);

  // Extract distinct categories for filter dropdown
  const categories = useMemo(() => {
    if (!scanData?.ports) return [];
    const set = new Set(scanData.ports.map(p => p.category));
    return Array.from(set).sort();
  }, [scanData]);

  // Filtered and searched ports
  const filteredPorts = useMemo(() => {
    if (!scanData?.ports) return [];
    let list = scanData.ports;

    // Filter bar (StatsBar selection)
    if (activeFilter === 'listening') {
      list = list.filter(p => p.state === 'LISTENING');
    } else if (activeFilter === 'lan') {
      list = list.filter(p => p.isLanPublic);
    } else if (activeFilter === 'localhost') {
      list = list.filter(p => !p.isLanPublic);
    } else if (activeFilter === 'established') {
      list = list.filter(p => p.state === 'ESTABLISHED');
    } else if (activeFilter === 'processes') {
      const seen = new Set();
      list = list.filter(p => {
        if (seen.has(p.processName)) return false;
        seen.add(p.processName);
        return true;
      });
    }

    // Category dropdown filter
    if (selectedCategory !== 'ALL') {
      list = list.filter(p => p.category === selectedCategory);
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(p => 
        p.localPort.toString().includes(q) ||
        p.processName.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.localAddress.toLowerCase().includes(q) ||
        p.pid.toString().includes(q)
      );
    }

    return list;
  }, [scanData, activeFilter, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 pb-20 sm:pb-8">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand Logo & Name */}
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-lg shadow-cyan-500/20 text-white font-black text-xl">
                <Radar className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                    PortRadar <span className="text-cyan-400 font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">LAN LIVE</span>
                  </h1>
                </div>
                <p className="text-[11px] text-slate-400">
                  Laptop Port Visualizer & AI Security Explainer
                </p>
              </div>
            </div>

            {/* Mobile Header AI triggers */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={() => setIsAiAuditOpen(true)}
                className="p-2 bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border border-cyan-500/40 text-cyan-300 rounded-xl"
                title="AI Audit"
              >
                <Sparkles className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAiSettingsOpen(true)}
                className="p-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl"
                title="AI Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 flex-wrap">
            {/* View Mode Buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
              <button
                onClick={() => setActiveView('overview')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveView('radar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'radar'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Radar className="w-3.5 h-3.5" />
                <span>Radar</span>
              </button>
              <button
                onClick={() => setActiveView('categories')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'categories'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>Categories</span>
              </button>
              <button
                onClick={() => setActiveView('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  activeView === 'table'
                    ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Table</span>
              </button>
            </div>

            {/* AI Security Audit Button */}
            <button
              onClick={() => setIsAiAuditOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-600/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Security Audit</span>
            </button>

            {/* AI Settings Button */}
            <button
              onClick={() => setIsAiSettingsOpen(true)}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Configure AI Provider (Gemini, OpenAI, Claude, Groq, Ollama)"
            >
              <Settings className="w-4 h-4 text-slate-400 hover:text-cyan-400" />
            </button>

            {/* Auto Refresh Toggle */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                autoRefresh
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              <span>{autoRefresh ? 'Auto 3s' : 'Paused'}</span>
            </button>

            {/* Refresh Now Button */}
            <button
              onClick={() => fetchPorts(false)}
              disabled={refreshing}
              className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Ports Now"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
        {/* LAN Access & QR Code Sharing Banner */}
        <LanShareBanner network={network} loading={loading} />

        {/* Stats Metrics Bar */}
        {scanData?.stats && (
          <StatsBar
            stats={scanData.stats}
            activeFilter={activeFilter}
            onSelectFilter={setActiveFilter}
          />
        )}

        {/* View Layouts */}
        {activeView === 'radar' && (
          <div className="max-w-3xl mx-auto">
            <RadarView
              ports={scanData?.ports || []}
              onSelectPort={(p) => setSelectedPort(p)}
            />
          </div>
        )}

        {activeView === 'categories' && (
          <CategoryAccordion
            ports={scanData?.ports || []}
            aiConfig={aiConfig}
            onSelectPort={(p) => setSelectedPort(p)}
            onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          />
        )}

        {activeView === 'overview' && (
          <>
            {/* Interactive Radar & Spectrum */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7">
                <RadarView
                  ports={scanData?.ports || []}
                  onSelectPort={(p) => setSelectedPort(p)}
                />
              </div>
              <div className="lg:col-span-5 flex flex-col gap-6">
                <PortSpectrum
                  ports={scanData?.ports || []}
                  onSelectPort={(p) => setSelectedPort(p)}
                />

                {/* AI Quick Banner */}
                <div className="bg-gradient-to-r from-cyan-950/40 via-indigo-950/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-cyan-400" />
                      <h4 className="text-sm font-bold text-slate-100">
                        AI Network Threat Analyzer
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                      {aiConfig.provider.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">
                    Export all active ports and ask the AI to flag suspicious services, attack vectors on local Wi-Fi, and generate actionable firewall rules.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsAiAuditOpen(true)}
                      className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      Run Security Audit
                    </button>
                    <button
                      onClick={() => setIsAiSettingsOpen(true)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl transition-all cursor-pointer"
                    >
                      Configure AI
                    </button>
                  </div>
                </div>

                {/* Port Exposure Guide */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    How LAN Port Exposure Works
                  </h4>
                  <div className="space-y-3 text-xs text-slate-300/90 leading-relaxed">
                    <div className="flex items-start gap-2.5">
                      <Globe className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-300 block">Bound to 0.0.0.0 (Public LAN):</strong>
                        Any person on your Wi-Fi entering <code className="text-slate-200 bg-slate-900 px-1 py-0.5 rounded font-mono">http://{network?.primaryIp || '<laptop-ip>'}:PORT</code> can reach this server.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Lock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-blue-300 block">Bound to 127.0.0.1 (Localhost Only):</strong>
                        Only software running on this laptop can connect. Safe from outside devices on the local Wi-Fi.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Search, Filter & List Header */}
        {activeView !== 'categories' && (
          <>
            <div className="mt-8 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <span>Active Servers & Ports List</span>
                  <span className="text-xs bg-slate-800 text-cyan-400 px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {filteredPorts.length}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any card to view what this server does, who is running it, and LAN security implications.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search port, process, service..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-cyan-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-colors"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2 cursor-pointer focus:outline-none focus:border-cyan-500"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Port Grid or Table View */}
            {activeView === 'table' ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-x-auto shadow-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono text-[11px] uppercase">
                      <th className="py-3.5 px-4 font-semibold">Port / Proto</th>
                      <th className="py-3.5 px-4 font-semibold">Server & Title</th>
                      <th className="py-3.5 px-4 font-semibold">Process (PID)</th>
                      <th className="py-3.5 px-4 font-semibold">Local Address</th>
                      <th className="py-3.5 px-4 font-semibold">LAN Access</th>
                      <th className="py-3.5 px-4 font-semibold">Risk</th>
                      <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredPorts.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPort(p)}
                        className="hover:bg-slate-850/80 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                          :{p.localPort} <span className="text-[10px] text-slate-500 font-normal">({p.proto})</span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-100">{p.title}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          <div className="text-slate-200 font-medium">{p.processName}</div>
                          <div className="text-slate-500 text-[10px]">PID: {p.pid} | {p.memory || 'N/A'}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">
                          {p.localAddress}:{p.localPort}
                        </td>
                        <td className="py-3 px-4">
                          {p.isLanPublic ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Globe className="w-3 h-3" /> LAN Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <Lock className="w-3 h-3" /> Localhost
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span className={p.risk === 'High' ? 'text-rose-400' : p.risk === 'Medium' ? 'text-amber-400' : 'text-emerald-400'}>
                            {p.risk}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPort(p);
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                          >
                            Explain
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPorts.map((port) => (
                  <PortCard
                    key={port.id}
                    port={port}
                    onSelect={(p) => setSelectedPort(p)}
                  />
                ))}
              </div>
            )}

            {filteredPorts.length === 0 && (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center my-6">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-300 text-sm font-semibold">No active ports matching this filter</p>
                <p className="text-slate-500 text-xs mt-1">Try clearing your search term or selecting "All Active Ports".</p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-lg px-2 py-2 flex items-center justify-around">
        <button
          onClick={() => setActiveView('overview')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] ${
            activeView === 'overview' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Overview</span>
        </button>
        <button
          onClick={() => setActiveView('radar')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] ${
            activeView === 'radar' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Radar className="w-4 h-4" />
          <span>Radar</span>
        </button>
        <button
          onClick={() => setActiveView('categories')}
          className={`flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] ${
            activeView === 'categories' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Folder className="w-4 h-4" />
          <span>Categories</span>
        </button>
        <button
          onClick={() => setIsAiAuditOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] text-indigo-400 font-bold"
        >
          <Sparkles className="w-4 h-4" />
          <span>AI Audit</span>
        </button>
        <button
          onClick={() => setIsAiSettingsOpen(true)}
          className="flex flex-col items-center gap-1 p-1.5 rounded-lg text-[10px] text-slate-400"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Deep-dive Explanation Modal */}
      <PortDetailModal
        port={selectedPort}
        lanIp={network?.primaryIp || '127.0.0.1'}
        onClose={() => setSelectedPort(null)}
        onProcessKilled={() => fetchPorts(true)}
      />

      {/* AI Modals */}
      <AiAuditModal
        isOpen={isAiAuditOpen}
        onClose={() => setIsAiAuditOpen(false)}
        config={aiConfig}
        onOpenSettings={() => {
          setIsAiAuditOpen(false);
          setIsAiSettingsOpen(true);
        }}
        onUpdateConfig={handleSaveAiConfig}
      />

      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        config={aiConfig}
        onSaveConfig={handleSaveAiConfig}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 py-6 text-center text-xs text-slate-500">
        <p>
          PortRadar &bull; Host: <strong className="text-slate-300">{network?.hostname || 'Windows Host'}</strong> &bull; Accessible locally via <code className="text-cyan-400">{network?.primaryUrl || 'http://localhost:8989'}</code>
        </p>
      </footer>
    </div>
  );
}

export default App;
