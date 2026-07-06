import React from 'react';
import { ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { formatFriendlyTime, formatFriendlyDate } from '../utils/timeUtils';

export const UpNextCard = ({ nextTask }) => {
  return (
    <div className="glass-panel p-4 rounded-xl border border-cyber-card-border shadow-md relative overflow-hidden flex flex-col justify-between min-h-[140px]">
      
      {/* Background decoration */}
      <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-cyber-indigo/5 rounded-full blur-xl pointer-events-none"></div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-3xs uppercase tracking-widest text-slate-500 font-semibold flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-cyber-indigo" />
            Up Next
          </span>
          {nextTask && nextTask.urgency === 'HIGH' && (
            <span className="flex items-center gap-1 text-2xs text-cyber-crimson font-bold">
              <AlertCircle className="w-3 h-3 text-cyber-crimson" />
              HIGH
            </span>
          )}
        </div>

        {nextTask ? (
          <div className="space-y-1">
            <h4 className="font-extrabold text-sm text-slate-200 line-clamp-1 uppercase tracking-wide">
              {nextTask.title}
            </h4>
            <div className="text-2xs text-slate-400 space-y-0.5">
              <p className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>
                  {formatFriendlyDate(nextTask.start)} &bull; {formatFriendlyTime(nextTask.start)}
                </span>
              </p>
              <p>Type: <span className="text-slate-300 font-semibold">{nextTask.type}</span></p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">
              Schedule Clear
            </span>
            <span className="text-3xs text-slate-600 mt-0.5">
              No further tasks lined up.
            </span>
          </div>
        )}
      </div>

      {nextTask && (
        <div className="pt-2 border-t border-slate-900/50 mt-2 flex justify-between items-center text-3xs text-slate-500">
          <span>Active check sync auto-enabled</span>
          <span className="font-semibold text-cyber-indigo uppercase">STANDBY</span>
        </div>
      )}
    </div>
  );
};
