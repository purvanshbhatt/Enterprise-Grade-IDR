
import React, { useEffect, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShieldAlert, ShieldCheck, Activity, Lock, Server, Terminal, Radio, Siren, Shield } from 'lucide-react';

// Initial placeholder data for the chart
const initialChartData = [
  { name: 'Start', processed: 0, anomalies: 0 },
];

const logEntries = [
  { time: 'System', msg: 'Initializing Sentinel IDR Core...', type: 'info' },
  { time: 'System', msg: 'Waiting for user authorization...', type: 'warning' },
];

interface DashboardProps {
  stats: {
    scanned: number;
    threats: number;
    health: number;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ stats }) => {
  const [logs, setLogs] = useState(logEntries);
  const [threats, setThreats] = useState<any[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [systemInfo, setSystemInfo] = useState<{cores: number, platform: string, agentId: string}>({ cores: 0, platform: 'Unknown', agentId: '' });
  const [chartData, setChartData] = useState(initialChartData);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Update chart data when stats change
  useEffect(() => {
    if (!permissionGranted) return;
    
    setChartData(prev => {
      const now = new Date();
      const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
      const newDataPoint = { 
        name: timeLabel, 
        processed: stats.scanned, 
        anomalies: stats.threats 
      };
      const newChart = [...prev, newDataPoint];
      if (newChart.length > 20) return newChart.slice(newChart.length - 20);
      return newChart;
    });
  }, [stats, permissionGranted]);

  useEffect(() => {
    // Simulate checking local system info
    if (permissionGranted) {
       const cores = navigator.hardwareConcurrency || 4;
       // @ts-ignore
       const platform = navigator.userAgentData?.platform || navigator.platform || 'Linux x86_64';
       const agentId = `AGT-${Math.random().toString(16).substr(2, 8).toUpperCase()}`;
       setSystemInfo({ cores, platform, agentId });
       
       // Add initialization log
       setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg: `Local Agent ${agentId} mounted on ${platform} (${cores} cores).`, type: 'success' }]);
    }
  }, [permissionGranted]);

  // Simulate live logs
  useEffect(() => {
    if (!permissionGranted) return;

    const interval = setInterval(() => {
      const msgs = [
        { msg: 'Idle. Monitoring active file system changes...', type: 'info' },
        { msg: 'Heartbeat signal sent to secure vault.', type: 'success' },
        { msg: 'Memory integrity verification passed.', type: 'success' },
        { msg: 'Checking for background background processes...', type: 'info' },
      ];
      // Only add random log if nothing is happening
      if (Math.random() > 0.7) {
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
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [permissionGranted]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!permissionGranted) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6 bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-md w-full bg-slate-900/90 border border-slate-700 rounded-2xl p-8 backdrop-blur-xl shadow-2xl z-10 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
             <Lock size={32} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Security Clearance Required</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Sentinel IDR requires permission to access local system telemetry and perform real-time file operations. 
            All data is encrypted using AES-256 before processing.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left bg-slate-950/50 p-3 rounded-lg border border-slate-800">
               <Activity size={18} className="text-emerald-400 shrink-0" />
               <div>
                 <p className="text-xs font-bold text-slate-200">System Health Monitoring</p>
                 <p className="text-[10px] text-slate-500">CPU, Memory, and Network Traffic Analysis</p>
               </div>
            </div>
            <div className="flex items-center gap-3 text-left bg-slate-950/50 p-3 rounded-lg border border-slate-800">
               <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
               <div>
                 <p className="text-xs font-bold text-slate-200">File System Access</p>
                 <p className="text-[10px] text-slate-500">Read, Hash, and Analyze local files</p>
               </div>
            </div>
          </div>

          <button 
            onClick={() => setPermissionGranted(true)}
            className="w-full mt-8 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 group"
          >
            <Shield size={18} className="group-hover:scale-110 transition-transform" />
            Grant System Access
          </button>
          <p className="text-[10px] text-slate-600 mt-4 font-mono">SESSION ID: {Math.random().toString(36).substr(2, 12).toUpperCase()}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto animate-in fade-in duration-500">
      
      {/* System Header */}
      <div className="flex items-center justify-between bg-slate-900/30 p-4 rounded-xl border border-slate-800/50 backdrop-blur-sm">
         <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center border border-cyan-500/20">
               <Server size={20} className="text-cyan-400" />
            </div>
            <div>
               <h2 className="text-sm font-bold text-white">Local Agent: {systemInfo.agentId}</h2>
               <p className="text-xs text-slate-400 font-mono">{systemInfo.platform} • {systemInfo.cores} Cores Active</p>
            </div>
         </div>
         <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-emerald-400">SECURE CONNECTION ESTABLISHED</span>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm hover:border-cyan-500/30 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Session Scans</p>
              <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-cyan-400 transition-colors">{stats.scanned}</h3>
            </div>
            <div className="p-3 bg-cyan-500/10 rounded-lg text-cyan-400">
              <Server size={24} />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-emerald-400 flex items-center mr-2">Active</span> Real-time counter
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm hover:border-red-500/30 transition-colors group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Threats Detected</p>
              <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-red-400 transition-colors">{stats.threats}</h3>
            </div>
            <div className="p-3 bg-red-500/10 rounded-lg text-red-400">
              <ShieldAlert size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
            <span className="text-red-400 flex items-center mr-2">{stats.scanned > 0 ? ((stats.threats/stats.scanned)*100).toFixed(1) : 0}%</span> Detection rate
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">System Health</p>
              <h3 className={`text-2xl font-bold mt-1 ${stats.health < 50 ? 'text-red-500' : stats.health < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {stats.health}%
              </h3>
            </div>
            <div className={`p-3 rounded-lg ${stats.health < 50 ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
              <ShieldCheck size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
             Based on scan results
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl backdrop-blur-sm hover:border-purple-500/30 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm font-mono">Encryption</p>
              <h3 className="text-2xl font-bold text-white mt-1">AES-256</h3>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <Lock size={24} />
            </div>
          </div>
           <div className="mt-4 flex items-center text-xs text-slate-500">
            Zero-knowledge storage active
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
              <AreaChart data={chartData}>
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

        {/* Right Panel: Threats & Logs */}
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl flex flex-col gap-6">
          
          {/* Critical Threat Feed */}
          <div className="flex flex-col">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2 uppercase tracking-wider">
                  <Siren size={16} className="animate-pulse" />
                  Critical Threat Feed
                </h3>
             </div>
             <div className="bg-slate-950/80 rounded-lg border border-red-900/30 p-3 h-48 overflow-y-auto custom-scrollbar">
               {stats.threats === 0 ? (
                 <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                    No active threats detected.
                 </div>
               ) : (
                 <div className="space-y-2">
                    <div className="bg-red-500/5 border-l-2 border-red-500 pl-3 py-2 pr-2 rounded-r animate-in slide-in-from-right-2 duration-300">
                      <div className="flex justify-between items-start">
                          <span className="text-xs font-bold text-red-400">ALERT</span>
                          <span className="text-[10px] font-mono text-slate-500">Now</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 font-medium">Threat counter incremented. Verify Scanner logs.</p>
                    </div>
                 </div>
               )}
             </div>
          </div>

          {/* Live System Ops */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Terminal size={16} className="text-emerald-400" />
              Live System Ops
            </h3>
            
            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs overflow-hidden flex flex-col h-40">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
                <Radio size={14} className="animate-pulse text-cyan-500" />
                <span>Monitoring Active Channels...</span>
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
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
