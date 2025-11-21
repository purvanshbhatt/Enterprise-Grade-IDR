import React from 'react';
import { Shield, LayoutDashboard, Scan, History, Settings, Cpu } from 'lucide-react';
import { ViewState } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: ViewState.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { id: ViewState.SCANNER, label: 'Scanner', icon: Scan },
    { id: ViewState.HISTORY, label: 'History', icon: History },
    { id: ViewState.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 h-full bg-slate-950 border-r border-slate-800 flex flex-col">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)]">
          <Shield className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">SENTINEL</h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-widest">ENTERPRISE IDR</p>
        </div>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group
                ${isActive 
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]' 
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'} />
              <span className="font-medium text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,1)]" />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
          <div className="flex items-center gap-2 mb-2">
             <Cpu size={16} className="text-purple-400" />
             <span className="text-xs font-mono text-purple-200">SYSTEM STATUS</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>CPU Load</span>
            <span>12%</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-3">
            <div className="w-[12%] h-full bg-purple-500" />
          </div>
          
           <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
            <span>Memory</span>
            <span>4.2GB / 16GB</span>
          </div>
          <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
            <div className="w-[25%] h-full bg-blue-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
