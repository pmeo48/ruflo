import React from 'react';

const STAGES = ['Fetching Games', 'Live Intel', 'Quant Model', 'Risk Analysis', 'Done'];

export default function ProgressPipeline({ stage }) {
  // stage: 0-4
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {STAGES.map((s, i) => {
        const done = i < stage;
        const active = i === stage;
        return (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? 'bg-green-500 text-black' : active ? 'border-2 border-green-400 text-green-400' : 'border border-white/15 text-white/25'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-xs transition-colors ${active ? 'text-green-400 font-semibold' : done ? 'text-white/50' : 'text-white/25'}`}>
                {s}
              </span>
            </div>
            {i < STAGES.length - 1 && (
              <div className={`w-4 h-px ${done ? 'bg-green-500' : 'bg-white/10'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
