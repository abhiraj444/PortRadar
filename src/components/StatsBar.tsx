import React from 'react';
import { Activity, Radio, Globe, Lock, Cpu, Link2 } from 'lucide-react';
import { PortStats } from '../types/network';

interface StatsBarProps {
  stats: PortStats;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, activeFilter, onSelectFilter }) => {
  const cards = [
    {
      id: 'all',
      label: 'Total Active Ports',
      value: stats.total,
      icon: Activity,
      color: 'text-cyan-400',
      border: 'hover:border-cyan-500/50',
      bg: 'bg-cyan-500/5',
      activeBg: 'border-cyan-500 bg-cyan-500/10'
    },
    {
      id: 'listening',
      label: 'Listening Servers',
      value: stats.listening,
      icon: Radio,
      color: 'text-emerald-400',
      border: 'hover:border-emerald-500/50',
      bg: 'bg-emerald-500/5',
      activeBg: 'border-emerald-500 bg-emerald-500/10'
    },
    {
      id: 'lan',
      label: 'LAN Exposed (Wi-Fi)',
      value: stats.lanExposed,
      icon: Globe,
      color: 'text-amber-400',
      border: 'hover:border-amber-500/50',
      bg: 'bg-amber-500/5',
      activeBg: 'border-amber-500 bg-amber-500/10',
      badge: stats.lanExposed > 0 ? 'Public' : undefined
    },
    {
      id: 'localhost',
      label: 'Localhost Protected',
      value: stats.localhostOnly,
      icon: Lock,
      color: 'text-blue-400',
      border: 'hover:border-blue-500/50',
      bg: 'bg-blue-500/5',
      activeBg: 'border-blue-500 bg-blue-500/10'
    },
    {
      id: 'established',
      label: 'Established Links',
      value: stats.established,
      icon: Link2,
      color: 'text-purple-400',
      border: 'hover:border-purple-500/50',
      bg: 'bg-purple-500/5',
      activeBg: 'border-purple-500 bg-purple-500/10'
    },
    {
      id: 'processes',
      label: 'Host Processes',
      value: stats.processes,
      icon: Cpu,
      color: 'text-rose-400',
      border: 'hover:border-rose-500/50',
      bg: 'bg-rose-500/5',
      activeBg: 'border-rose-500 bg-rose-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isActive = activeFilter === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelectFilter(card.id)}
            className={`flex flex-col p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
              isActive
                ? `${card.activeBg} shadow-lg shadow-black/40 ring-1 ring-white/10`
                : `bg-slate-900/60 border-slate-800 ${card.border} hover:bg-slate-800/40`
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-4 h-4 ${card.color}`} />
              {card.badge && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {card.badge}
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              {card.value}
            </div>
            <div className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
              {card.label}
            </div>
          </button>
        );
      })}
    </div>
  );
};
