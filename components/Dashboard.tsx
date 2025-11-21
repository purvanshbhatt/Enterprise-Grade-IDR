import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, Lock, Server, Terminal, Radio } from 'lucide-react';

const data = [
  { name: '10:00', processed: 450, anomalies: 2 },
  { name: '10:05', processed: 320, anomalies: 1 },
  { name: '10:10', processed: 550, anomalies: 5 },
  { name: '10:15', processed: 780, anomalies: 8 },
  { name: '10:20', processed: 900, anomalies: 12 },
  { name: '10:25', processed: 650, anomalies: 4 },
  { name: '10:30', processed: 400, anomalies: 3 },
];

const vulnData = [
  { name: 'Critical', value: 4, color: '#ef4444' },
  { name: 'High', value: 12, color: '#f97316' },
  { name: 'Medium', value: 25, color: '#eab308' },
  { name: 'Low', value: 45, color: '#22c55e' },
];

const logEntries = [
  { time: '10:32:45', msg: 'System initiated. Monitoring active channels.', type: 'info' },
  { time: '10:32:48', msg: 'Downloading latest CVE definitions from Turn OS DB...', type: 'info' },
  { time: '10:33:02', msg: 'Heuristic engine warmed up. Gemini 3 Pro online.', type: 'success' },
  { time: '10:33:15', msg: 'Incoming packet stream from Agent-042 detected.', type: 'info' },
  { time: '10:33:45', msg: 'Suspicious pattern found in file `win_svc.exe`. Analysis needed.', type: 'warning' },
  { time: '10:34:12', msg: 'Deep scan initiated for batch #88391.', type: 'info' },
];

const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState(logEntries);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulate live logs
  useEffect(() => {
    const interval = setInterval(() => {
      const msgs = [
        { msg: 'Scanning incoming buffer...', type: 'info' },
        { msg: 'Signature match verification passed.', type: 'success' },
        { msg: 'Network latency spike detected in sector 4.', type: 'warning' },
        { msg: 'File integrity check complete.', type: 'info' },
        { msg: 'Encryption protocol handshake successful.', type: 'success' }
      ];
      const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
      const newLog = {
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        msg: randomMsg.msg,
        type: randomMsg.type
      };
      
      setLogs(prev => {
        const newLogs = [...prev, newLog];
        if (newLogs.length > 20) return newLogs.slice(newLogs.length - 20);
        return newLogs;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Files Scanned</p>
              <h3 className="text-2xl font-bold text-white mt-1">24,592</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Server size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-emerald-400 flex items-center mr-2">↑ 12%</span> vs last 24h
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Threats Blocked</p>
              <h3 className="text-2xl font-bold text-white mt-1">147</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
              <ShieldAlert size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-red-400 flex items-center mr-2">↑ 4%</span> vs last 24h
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">System Health</p>
              <h3 className="text-2xl font-bold text-white mt-1">98.2%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <ShieldCheck size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
            All systems operational
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Active Agents</p>
              <h3 className="text-2xl font-bold text-white mt-1">84</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Activity size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
            Global distribution
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live Throughput Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
               <Activity size={18} className="text-cyan-400" />
               Live Scan Throughput
            </h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
               <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
               LIVE FEED
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorProcessed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnomalies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }} 
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="processed" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorProcessed)" />
                <Area type="monotone" dataKey="anomalies" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorAnomalies)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Tracker Log (Replaces standard chart) */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex flex-col">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Terminal size={18} className="text-emerald-400" />
            Live System Operations
          </h3>
          
          <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-xs overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
              <Radio size={14} className="animate-pulse text-cyan-500" />
              <span>Monitoring Port 443...</span>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {logs.map((log, i) => (
                <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                  <span className="text-slate-600 shrink-0">[{log.time}]</span>
                  <span className={`
                    ${log.type === 'warning' ? 'text-amber-400' : 
                      log.type === 'success' ? 'text-emerald-400' : 
                      'text-cyan-300'}
                  `}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 h-32">
            <p className="text-sm font-semibold text-slate-400 mb-2">Current Threat Load</p>
             <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vulnData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={50} tickLine={false} axisLine={false} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={15}>
                  {vulnData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;