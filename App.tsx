
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import { ViewState, ScanResult, ThreatLevel } from './types';
import { Search } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  
  // Real-time System Statistics
  const [stats, setStats] = useState({
    scanned: 0,
    threats: 0,
    health: 100
  });

  const addScanToHistory = (result: ScanResult) => {
    setScanHistory(prev => [result, ...prev]);
    
    setStats(prev => {
      const newScanned = prev.scanned + 1;
      const isThreat = result.threatLevel !== ThreatLevel.SAFE;
      const newThreats = isThreat ? prev.threats + 1 : prev.threats;
      
      // Calculate health based on threat ratio
      // If 0 files, 100%. If threats exist, health drops.
      // Simple formula: 100 - (threats / scanned * 50) -> Cap at 0.
      const threatRatio = newThreats / newScanned;
      const newHealth = Math.max(0, 100 - (threatRatio * 100));

      return {
        scanned: newScanned,
        threats: newThreats,
        health: parseFloat(newHealth.toFixed(1))
      };
    });
  };

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard stats={stats} />;
      case ViewState.SCANNER:
        return <Scanner addScanToHistory={addScanToHistory} />;
      case ViewState.HISTORY:
        return (
          <div className="p-6 animate-in fade-in duration-500">
             <h2 className="text-2xl font-bold text-white mb-6">Scan History</h2>
             <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left text-slate-400">
                  <thead className="text-xs text-slate-200 uppercase bg-slate-800 font-mono">
                    <tr>
                      <th className="px-6 py-3">File Name</th>
                      <th className="px-6 py-3">Threat Level</th>
                      <th className="px-6 py-3">Vulnerabilities</th>
                      <th className="px-6 py-3">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanHistory.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-500 italic">
                          No history available. Run a scan in the Scanner module.
                        </td>
                      </tr>
                    ) : (
                      scanHistory.map((scan, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-4 font-medium text-white">{scan.fileName}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold 
                              ${scan.threatLevel === 'SAFE' ? 'bg-emerald-500/10 text-emerald-500' : 
                                scan.threatLevel === 'MALICIOUS' ? 'bg-red-500/10 text-red-500' : 
                                'bg-amber-500/10 text-amber-500'}`}>
                              {scan.threatLevel}
                            </span>
                          </td>
                          <td className="px-6 py-4 truncate max-w-xs">
                             {scan.vulnerabilities.length > 0 ? scan.vulnerabilities.join(", ") : "None"}
                          </td>
                          <td className="px-6 py-4">
                             {scan.confidenceScore}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        );
      default:
        return (
          <div className="h-full flex items-center justify-center text-slate-500">
            Module under construction.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden selection:bg-cyan-900 selection:text-cyan-200">
      {/* Top Right Decorative/Background Elements for that "Million Dollar" feel */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
         <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[128px]" />
         <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[128px]" />
      </div>

      <div className="z-10 flex w-full h-full shadow-2xl">
        <Sidebar currentView={currentView} setView={setCurrentView} />
        <main className="flex-1 flex flex-col min-w-0 bg-slate-950/80 backdrop-blur-sm">
           {/* Header/Search Bar Area */}
           <div className="h-16 border-b border-slate-800 flex items-center px-6 justify-between shrink-0">
              <div className="flex items-center text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 w-96">
                 <Search size={16} className="mr-2" />
                 <input 
                    type="text" 
                    placeholder="Search logs, hashes, or filenames..." 
                    className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder:text-slate-600"
                 />
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-white">Admin User</span>
                    <span className="text-[10px] text-cyan-400">SECURITY LEVEL 5</span>
                 </div>
                 <div className="w-8 h-8 bg-slate-800 rounded-full border border-slate-700 flex items-center justify-center text-slate-400">
                    AU
                 </div>
              </div>
           </div>
           
           <div className="flex-1 overflow-hidden relative">
             {renderContent()}
           </div>
        </main>
      </div>
    </div>
  );
};

export default App;
