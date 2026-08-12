import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, 
  Calendar, 
  CheckCircle2, 
  BarChart2, 
  PieChart, 
  DownloadCloud, 
  Clock, 
  ShieldCheck,
  TrendingUp,
  Filter,
  CheckSquare,
  Sparkles
} from 'lucide-react';
import { auth, db } from '../../utils/firebase';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const HistoryTab = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7DAYS'); // '7DAYS', '30DAYS', 'ALL'
  const [filterAction, setFilterAction] = useState('ALL'); // 'ALL', 'create', 'update', 'delete'

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const logsRef = collection(db, 'users', user.uid, 'history_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'), limit(150));

    const unsub = onSnapshot(q, (snap) => {
      const list = [];
      snap.forEach(doc => {
        const data = doc.data();
        list.push({
          id: doc.id,
          ...data,
          dateObj: data.timestamp?.toDate ? data.timestamp.toDate() : new Date()
        });
      });
      setLogs(list);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching history logs:", err);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    let cutoff = new Date(0);

    if (timeRange === '7DAYS') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 7);
    } else if (timeRange === '30DAYS') {
      cutoff = new Date(now);
      cutoff.setDate(cutoff.getDate() - 30);
    }

    return logs.filter(log => {
      if (log.dateObj < cutoff) return false;
      if (filterAction !== 'ALL' && log.action !== filterAction) return false;
      return true;
    });
  }, [logs, timeRange, filterAction]);

  const stats = useMemo(() => {
    let completedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;

    const categoryCounts = {};
    const dailyCounts = {};

    filteredLogs.forEach(log => {
      if (log.action === 'create') createdCount++;
      if (log.action === 'update') updatedCount++;
      if (log.action === 'delete') deletedCount++;

      if (log.action === 'update' && log.dataAfter?.completed && !log.dataBefore?.completed) {
        completedCount++;
      }

      const cat = (log.dataAfter?.category || log.dataBefore?.category || 'General').toLowerCase();
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;

      const dateStr = log.dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    return {
      totalLogs: filteredLogs.length,
      completedCount,
      createdCount,
      updatedCount,
      deletedCount,
      categoryCounts,
      dailyCounts
    };
  }, [filteredLogs]);

  const handleExportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      summary: {
        totalActions: stats.totalLogs,
        completedBlocks: stats.completedCount,
        createdBlocks: stats.createdCount,
        updatedBlocks: stats.updatedCount,
        deletedBlocks: stats.deletedCount
      },
      logs: filteredLogs.map(l => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        title: l.dataAfter?.title || l.dataBefore?.title || 'N/A',
        category: l.dataAfter?.category || l.dataBefore?.category || 'N/A',
        timestamp: l.dateObj.toISOString()
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `duevault_history_report_${new Date().toLocaleDateString('en-CA')}.json`;
    a.click();
  };

  const chartDays = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const count = stats.dailyCounts[dateStr] || 0;
      days.push({ label, count, dateStr });
    }
    return days;
  }, [stats]);

  const maxDailyCount = Math.max(1, ...chartDays.map(d => d.count));

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 animate-fade-in pb-4 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-3">
            <History className="w-6 h-6 text-cyan-400" />
            Execution Audit & History
          </h2>
          <p className="text-slate-400 text-xs">
            Review completed timetable blocks, track productivity trends, and export audit reports.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.5)] cursor-pointer"
        >
          <DownloadCloud className="w-4 h-4" />
          Export Audit Report (JSON)
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <div className="flex gap-2">
          <span className="text-xs font-bold text-slate-400 self-center px-2">Range:</span>
          {[
            { id: '7DAYS', label: 'Last 7 Days' },
            { id: '30DAYS', label: 'Last 30 Days' },
            { id: 'ALL', label: 'All Time' }
          ].map(r => (
            <button
              key={r.id}
              onClick={() => setTimeRange(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                timeRange === r.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <span className="text-xs font-bold text-slate-400 self-center px-2">Action:</span>
          {[
            { id: 'ALL', label: 'All' },
            { id: 'create', label: 'Created' },
            { id: 'update', label: 'Updated' },
            { id: 'delete', label: 'Deleted' }
          ].map(a => (
            <button
              key={a.id}
              onClick={() => setFilterAction(a.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterAction === a.id ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Total Actions</span>
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-white mt-2">{stats.totalLogs}</div>
          <div className="text-[10px] text-slate-500 mt-1">Audit log entries</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Completed Blocks</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">{stats.completedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Marked done</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Created Items</span>
            <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-indigo-400 mt-2">{stats.createdCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">New schedule additions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
            <span>Modifications</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-400 mt-2">{stats.updatedCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Updates & status changes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-cyan-400" />
            Daily Activity Velocity (Last 7 Days)
          </h3>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 px-2 border-b border-slate-800 pb-2">
            {chartDays.map((day, idx) => {
              const heightPercent = (day.count / maxDailyCount) * 100;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                  <div className="absolute -top-8 bg-slate-950 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                    {day.count} action{day.count !== 1 ? 's' : ''}
                  </div>

                  <div className="w-full bg-slate-800/80 rounded-t-lg h-32 flex items-end overflow-hidden">
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-600 to-indigo-500 rounded-t-lg transition-all duration-500 group-hover:from-cyan-400 group-hover:to-indigo-400"
                      style={{ height: `${Math.max(5, heightPercent)}%` }}
                    />
                  </div>

                  <span className="text-[10px] font-bold text-slate-400">{day.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-indigo-400" />
            Category Distribution
          </h3>

          <div className="space-y-3 pt-2">
            {Object.keys(stats.categoryCounts).length === 0 ? (
              <p className="text-slate-500 text-xs italic">No activity recorded for this period.</p>
            ) : (
              Object.entries(stats.categoryCounts).map(([cat, count]) => {
                const percent = Math.round((count / stats.totalLogs) * 100);
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="capitalize text-slate-300">{cat}</span>
                      <span className="text-slate-400 font-mono">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-emerald-400" />
          Audit Log Trail
        </h3>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-xs">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-xs italic">No audit records found for selected filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Title / Details</th>
                  <th className="py-3 px-4">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map(log => {
                  const title = log.dataAfter?.title || log.dataBefore?.title || log.entityId;
                  const cat = log.dataAfter?.category || log.dataBefore?.category || 'N/A';
                  const timeStr = log.dateObj.toLocaleString('en-US', { 
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  });

                  let actionBadge = 'bg-slate-800 text-slate-300';
                  if (log.action === 'create') actionBadge = 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
                  if (log.action === 'update') actionBadge = 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
                  if (log.action === 'delete') actionBadge = 'bg-rose-500/20 text-rose-400 border border-rose-500/30';

                  return (
                    <tr key={log.id} className="hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400">{timeStr}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${actionBadge}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 uppercase text-[10px] font-bold text-slate-400">{log.entity}</td>
                      <td className="py-3 px-4 font-semibold text-white max-w-xs truncate">{title}</td>
                      <td className="py-3 px-4 capitalize font-mono text-slate-400">{cat}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
