import React, { useState } from 'react';
import { Wifi, Copy, Check, QrCode, Laptop, ExternalLink, ShieldAlert, ChevronDown } from 'lucide-react';
import { NetworkInfo, NetworkInterface } from '../types/network';

interface LanShareBannerProps {
  network: NetworkInfo | null;
  loading: boolean;
}

export const LanShareBanner: React.FC<LanShareBannerProps> = ({ network, loading }) => {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null);

  if (loading || !network) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 animate-pulse">
        <div className="h-5 bg-slate-800 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-slate-800/60 rounded w-1/2"></div>
      </div>
    );
  }

  const currentIf = selectedInterface || 
    network.interfaces.find(i => i.address === network.primaryIp) || 
    network.interfaces.find(i => i.isLan) || 
    network.interfaces[0];

  const currentUrl = currentIf ? currentIf.url : network.primaryUrl;
  const currentQr = currentIf ? currentIf.qrCode : network.primaryQr;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl shadow-indigo-950/20 relative overflow-hidden backdrop-blur-md">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              LAN Access Active (0.0.0.0:{network.port})
            </span>
            <div className="flex items-center text-xs text-slate-400 gap-1 bg-slate-800/80 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Laptop className="w-3.5 h-3.5 text-slate-400" />
              <span>Host: <strong className="text-slate-200">{network.hostname}</strong></span>
            </div>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Wifi className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            Share Live Visualizer Across Your Local Wi-Fi Network
          </h2>

          <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">
            Anyone connected to your local Wi-Fi / LAN network can enter this address in their web browser or scan the QR code to view all live active ports and server explanations running on this laptop.
          </p>
        </div>

        {/* URL Card & Actions */}
        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center bg-slate-950/80 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-cyan-300 font-mono text-sm shadow-inner group">
            <span className="select-all font-semibold tracking-wide mr-2">{currentUrl}</span>
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 rounded-lg transition-colors ml-auto"
              title="Copy URL"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQr(!showQr)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-medium rounded-xl shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQr ? 'Hide QR' : 'Phone QR Code'}</span>
            </button>

            {/* Interface switcher if multiple network adapters exist */}
            {network.interfaces.filter(i => i.isLan).length > 1 && (
              <div className="relative group">
                <select
                  value={currentIf?.address}
                  onChange={(e) => {
                    const match = network.interfaces.find(i => i.address === e.target.value);
                    if (match) setSelectedInterface(match);
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2.5 appearance-none pr-8 cursor-pointer focus:outline-none focus:border-cyan-400"
                >
                  {network.interfaces.filter(i => i.isLan).map(iface => (
                    <option key={iface.address} value={iface.address}>
                      {iface.name}: {iface.address}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Reveal Modal / Box */}
      {showQr && (
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-6 bg-slate-950/60 p-4 rounded-xl">
          {currentQr ? (
            <div className="bg-white p-2.5 rounded-xl shadow-lg flex-shrink-0 border border-slate-200">
              <img src={currentQr} alt="Scan QR for LAN access" className="w-36 h-36" />
            </div>
          ) : (
            <div className="w-36 h-36 bg-slate-800 flex items-center justify-center text-xs text-slate-500 rounded-xl">
              QR Unavailable
            </div>
          )}
          <div className="space-y-2 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold text-sm">
              <QrCode className="w-4 h-4" />
              Instant Mobile Scanning
            </div>
            <p className="text-xs text-slate-300 max-w-md">
              Point your smartphone or tablet camera at this QR code while connected to the same Wi-Fi network to open the dashboard immediately.
            </p>
            <div className="text-[11px] text-slate-400 font-mono bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 inline-block">
              Network: <span className="text-slate-200 font-semibold">{currentIf?.name || 'Local Wi-Fi'}</span> ({currentIf?.address})
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
