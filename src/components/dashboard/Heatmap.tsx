import React from 'react';
import { cn } from '../../lib/utils';
import type { HeatmapData } from '../../hooks/useDashboardData';
import { HelpCircle } from 'lucide-react';

interface HeatmapProps {
  data: HeatmapData[];
  columns: string[];
  title: string;
  subtitle: string;
}

// Semáforo colors based on thresholds
const getScoreColor = (score: number) => {
  if (score >= 8.0) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (score >= 6.0) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
};

export function Heatmap({ data, columns, title, subtitle }: HeatmapProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-outline-variant/50 flex items-center justify-between bg-surface-container-lowest">
        <div>
          <h3 className="text-lg font-bold text-on-background tracking-tight">{title}</h3>
          <p className="text-sm text-secondary mt-0.5">{subtitle}</p>
        </div>
        
        {/* Legend */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-secondary bg-surface-variant/50 px-3 py-1.5 rounded-lg">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> ≥ 8.0
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 6.0 - 7.9
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> &lt; 6.0
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              <th className="px-5 py-4 text-xs font-bold text-secondary uppercase tracking-wider bg-surface-container-lowest border-b border-outline-variant/50 w-48">
                Dimensión
              </th>
              {columns.map((col) => (
                <th key={col} className="px-3 py-4 text-xs font-bold text-secondary uppercase tracking-wider bg-surface-container-lowest border-b border-outline-variant/50 text-center min-w-[100px]">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {data.map((row) => {
              // Calculate average for this dimension
              const scores = Object.values(row.scores);
              const avg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '-';

              return (
                <tr key={row.dimension} className="hover:bg-surface-container-low transition-colors group">
                  <td className="px-5 py-3 font-semibold text-sm text-on-background flex items-center justify-between">
                    {row.dimension}
                    <div className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-xs font-bold text-secondary">
                      {avg}
                    </div>
                  </td>
                  {columns.map((col) => {
                    const score = row.scores[col];
                    const displayScore = score !== undefined ? score.toFixed(1) : '-';
                    
                    return (
                      <td key={col} className="p-2 text-center">
                        {score !== undefined ? (
                          <div className={cn(
                            "mx-auto w-12 h-10 flex items-center justify-center rounded-lg text-sm font-bold border transition-transform duration-200 group-hover:scale-105",
                            getScoreColor(score)
                          )}>
                            {displayScore}
                          </div>
                        ) : (
                          <span className="text-outline">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Mobile legend */}
      <div className="md:hidden p-4 border-t border-outline-variant/50 bg-surface-container-lowest">
        <div className="flex items-center justify-center gap-4 text-xs font-medium text-secondary">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Buena</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Regular</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Crítica</div>
        </div>
      </div>
    </div>
  );
}
