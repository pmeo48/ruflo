import React from 'react';

export default function StatCard({ label, value, sub, color, icon: Icon, trend }) {
  return (
    <div className="glass p-4 flex flex-col gap-1.5 fade-in">
      <div className="flex items-center justify-between">
        <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={14} className="text-white/20" />}
      </div>
      <div className="font-bold text-2xl" style={{ color: color || 'rgba(255,255,255,0.9)' }}>{value}</div>
      {sub && <div className="text-xs text-white/40">{sub}</div>}
    </div>
  );
}
