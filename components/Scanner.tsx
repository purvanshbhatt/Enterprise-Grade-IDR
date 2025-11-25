
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileCode, FileImage, CheckCircle, AlertTriangle, XCircle, Loader2, Search, Globe, Mail, Clock, Bell, Sliders, ChevronDown, ChevronUp, Zap, Shield, Eye, FileArchive, FileText, FileCog, File, Binary, Hash, Lock } from 'lucide-react';
import { FileQueueItem, ScanStatus, ThreatLevel, ScanResult, ScanOptions } from '../types';
import { analyzeFile, checkKnownVulnerabilities } from '../services/geminiService';

interface ScannerProps {
  addScanToHistory: (result: ScanResult) => void;
}

const Scanner: React.FC<ScannerProps> = ({ addScanToHistory }) => {
  const [queue, setQueue] = useState<FileQueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeScanId, setActiveScanId] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Options State
  const [scanOptions, setScanOptions] = useState<ScanOptions>({
    scanDepth: 'balanced',
    enableHeuristics: true,
    enableSignatures: true,
    sensitivityThreshold: 50,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newItems: FileQueueItem[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: ScanStatus.IDLE,
      progress: 0,
      eta: undefined
    }));

    setQueue(prev => [...newItems, ...prev]);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const updateItemStatus = (id: string, status: ScanStatus, progress: number, result?: ScanResult, eta?: number) => {
    setQueue(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status, progress, result, eta };
      }
      return item;
    }));
  };

  const startScan = async (id: string) => {
    const item = queue.find(i => i.id === id);
    if (!item || item.status === ScanStatus.SCANNING) return;

    setActiveScanId(id);
    
    // Estimate duration based on depth
    let baseTime = 15;
    if (scanOptions.scanDepth === 'quick') baseTime = 5;
    if (scanOptions.scanDepth === 'deep') baseTime = 45;

    const initialEta = item.file.size > 2 * 1024 * 1024 ? baseTime * 2 : baseTime; 
    let currentEta = initialEta;
    let currentProgress = 0;

    updateItemStatus(id, ScanStatus.SCANNING, 0, undefined, currentEta);

    // Progress simulation interval
    const intervalId = setInterval(() => {
      // Asymptotic progress approach
      currentProgress += (90 - currentProgress) * 0.05;
      
      // Decrease ETA but keep it above 2s until actually done
      currentEta -= 0.5;
      if (currentEta < 2) currentEta = 2;

      setQueue(prev => prev.map(qItem => {
        if (qItem.id === id) {
           return { 
             ...qItem, 
             progress: currentProgress, 
             eta: Math.ceil(currentEta) 
           };
        }
        return qItem;
      }));
    }, 500);

    try {
      // Simulate Pre-processing
      await new Promise(r => setTimeout(r, 1000));
      
      // Update status description to Analyzing
      setQueue(prev => prev.map(qItem => {
        if (qItem.id === id) return { ...qItem, status: ScanStatus.ANALYZING };
        return qItem;
      }));

      // Actual Gemini Analysis with Options
      const result = await analyzeFile(item.file, scanOptions);

      // If threats found, try to correlate with online DB (Search Grounding)
      if (result.threatLevel !== ThreatLevel.SAFE) {
        currentProgress = 92; 
        const searchQueries = result.vulnerabilities.length > 0 
          ? result.vulnerabilities[0] 
          : `${result.fileName} vulnerabilities`;
        
        const cveLinks = await checkKnownVulnerabilities(searchQueries);
        if (cveLinks.length > 0) {
          result.cveMatches = cveLinks;
        }
      }

      clearInterval(intervalId);
      updateItemStatus(id, ScanStatus.COMPLETED, 100, result, 0);
      addScanToHistory(result);

      if (emailNotifications) {
        showNotification(`Scan report for "${item.file.name}" sent to admin.`);
      }

    } catch (e) {
      console.error(e);
      clearInterval(intervalId);
      updateItemStatus(id, ScanStatus.ERROR, 0, undefined, 0);
      showNotification(`Scan failed for "${item.file.name}".`);
    } finally {
      setActiveScanId(null);
    }
  };

  const getThreatColor = (level?: ThreatLevel) => {
    switch (level) {
      case ThreatLevel.MALICIOUS: return 'text-red-500';
      case ThreatLevel.SUSPICIOUS: return 'text-amber-500';
      case ThreatLevel.SAFE: return 'text-emerald-500';
      default: return 'text-slate-500';
    }
  };

  const getFileIcon = (file: File) => {
    const name = file.name.toLowerCase();
    const type = file.type.toLowerCase();

    if (type.startsWith('image')) return <FileImage size={20} />;
    if (name.endsWith('.zip') || name.endsWith('.rar') || name.endsWith('.7z') || name.endsWith('.tar') || name.endsWith('.gz')) return <FileArchive size={20} />;
    if (name.endsWith('.pdf') || name.endsWith('.doc') || name.endsWith('.docx') || name.endsWith('.txt') || name.endsWith('.md')) return <FileText size={20} />;
    if (name.endsWith('.exe') || name.endsWith('.msi') || name.endsWith('.bat') || name.endsWith('.sh') || name.endsWith('.bin')) return <FileCog size={20} />;
    if (name.endsWith('.js') || name.endsWith('.ts') || name.endsWith('.py') || name.endsWith('.cpp') || name.endsWith('.html') || name.endsWith('.css')) return <FileCode size={20} />;
    
    return <File size={20} />;
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-hidden relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute bottom-6 right-6 z-50 bg-slate-800 border border-cyan-500/50 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <Bell className="text-cyan-400" size={20} />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">
            <XCircle size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Deep Scan Engine</h2>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-sm">
              <span>Powered by Gemini 3 Pro</span>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-emerald-500">
                <Lock size={12} />
                <span className="text-xs uppercase">Vault Storage Active</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Email Toggle */}
            <button 
              onClick={() => setEmailNotifications(!emailNotifications)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-xs font-mono
                ${emailNotifications 
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400' 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
            >
              <Mail size={14} />
              {emailNotifications ? 'ALERTS ON' : 'ALERTS OFF'}
            </button>

            <div className="flex gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-cyan-600 hover:bg-cyan-500 text-white px-4 py-2 rounded-md text-sm font-semibold transition-colors shadow-[0_0_15px_rgba(8,145,178,0.3)]"
              >
                Upload Files
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                multiple 
                onChange={(e) => processFiles(e.target.files)} 
              />
            </div>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Sliders size={14} />
            ADVANCED CONFIGURATION
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          
          {showAdvanced && (
            <div className="mt-3 bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-sm grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-200">
              
              {/* Scan Depth */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                  <Zap size={14} /> Scan Depth
                </h4>
                <div className="flex gap-2">
                  {(['quick', 'balanced', 'deep'] as const).map(depth => (
                    <button
                      key={depth}
                      onClick={() => setScanOptions(s => ({ ...s, scanDepth: depth }))}
                      className={`flex-1 py-1.5 text-xs font-medium rounded border capitalize transition-all
                        ${scanOptions.scanDepth === depth 
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                    >
                      {depth}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-500">
                  {scanOptions.scanDepth === 'deep' ? 'Maximum thoroughness. Uses extended thinking budget.' : 
                   scanOptions.scanDepth === 'quick' ? 'Optimized for speed. Basic signature checks.' :
                   'Standard analysis balancing speed and depth.'}
                </p>
              </div>

              {/* Engines */}
              <div className="space-y-3">
                 <h4 className="text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                  <Shield size={14} /> Active Engines
                </h4>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer p-1.5 hover:bg-slate-800/50 rounded">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Heuristic Analysis</span>
                    <input 
                      type="checkbox" 
                      checked={scanOptions.enableHeuristics}
                      onChange={e => setScanOptions(s => ({ ...s, enableHeuristics: e.target.checked }))}
                      className="accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm text-slate-300 cursor-pointer p-1.5 hover:bg-slate-800/50 rounded">
                    <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Signature Match</span>
                    <input 
                      type="checkbox" 
                      checked={scanOptions.enableSignatures}
                      onChange={e => setScanOptions(s => ({ ...s, enableSignatures: e.target.checked }))}
                      className="accent-cyan-500"
                    />
                  </label>
                </div>
              </div>

              {/* Sensitivity */}
              <div className="space-y-3">
                <h4 className="text-xs font-mono text-slate-500 uppercase flex items-center gap-2">
                  <Eye size={14} /> Threat Sensitivity
                </h4>
                <div className="px-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={scanOptions.sensitivityThreshold}
                    onChange={e => setScanOptions(s => ({ ...s, sensitivityThreshold: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
                    <span>Lenient</span>
                    <span className="text-cyan-400">{scanOptions.sensitivityThreshold}%</span>
                    <span>Paranoid</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Drop Zone */}
      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex-shrink-0 h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300
          ${isDragging 
            ? 'border-cyan-400 bg-cyan-900/20 scale-[1.01]' 
            : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
          }
        `}
      >
        <div className={`p-3 rounded-full ${isDragging ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'} mb-2 transition-colors`}>
          <Upload size={24} />
        </div>
        <p className="text-slate-300 font-medium text-sm">Drag and drop files or archives here</p>
        <p className="text-slate-500 text-xs mt-1">Supports .zip, .exe, .pdf, .png, source code</p>
      </div>

      {/* Queue / List */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {queue.length === 0 && (
          <div className="text-center text-slate-600 py-12 font-mono text-sm">
            Awaiting input stream...
          </div>
        )}

        {queue.map(item => (
          <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg p-4 transition-all hover:border-slate-700 group">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 relative">
                {getFileIcon(item.file)}
                {item.result && (
                   <div className="absolute -top-1 -right-1 bg-slate-950 rounded-full p-0.5">
                     {item.result.threatLevel === ThreatLevel.SAFE ? <CheckCircle size={12} className="text-emerald-500"/> : <AlertTriangle size={12} className="text-red-500"/>}
                   </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-slate-200 font-medium truncate pr-4">{item.file.name}</h4>
                  <div className="flex items-center gap-3">
                    {item.eta !== undefined && item.eta > 0 && item.status !== ScanStatus.COMPLETED && (
                      <span className="text-xs font-mono text-cyan-400 flex items-center gap-1 bg-cyan-950 px-2 py-0.5 rounded">
                        <Clock size={12} />
                        ETC: ~{item.eta}s
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-mono">{(item.file.size / 1024).toFixed(2)} KB</span>
                  </div>
                </div>
                
                {/* Hash Display if available */}
                {item.result?.fileHash && (
                   <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono mb-2">
                     <Hash size={10} />
                     <span className="truncate max-w-[200px]">{item.result.fileHash}</span>
                   </div>
                )}

                {/* Status Bar & Percentage */}
                <div className="flex items-center gap-3 mt-2">
                  <div className="relative flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        item.status === ScanStatus.ERROR ? 'bg-red-500' : 
                        item.result?.threatLevel === ThreatLevel.MALICIOUS ? 'bg-red-500' :
                        item.result?.threatLevel === ThreatLevel.SUSPICIOUS ? 'bg-amber-500' :
                        'bg-cyan-500'
                      }`} 
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {(item.status === ScanStatus.SCANNING || item.status === ScanStatus.ANALYZING) && (
                     <span className="text-xs font-mono text-cyan-400 min-w-[2.5rem] text-right">{Math.round(item.progress)}%</span>
                  )}
                </div>
              </div>

              {/* Actions / Status */}
              <div className="w-32 flex justify-end">
                {item.status === ScanStatus.IDLE && (
                  <button 
                    onClick={() => startScan(item.id)}
                    disabled={activeScanId !== null}
                    className="text-xs font-bold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  >
                    INITIATE
                  </button>
                )}
                
                {(item.status === ScanStatus.SCANNING || item.status === ScanStatus.ANALYZING) && (
                  <span className="flex items-center gap-2 text-xs text-cyan-400 animate-pulse font-mono">
                    <Loader2 size={14} className="animate-spin" />
                    {item.status === ScanStatus.ANALYZING ? 'THINKING' : 'SCANNING'}
                  </span>
                )}

                {item.status === ScanStatus.COMPLETED && item.result && (
                   <div className={`flex items-center gap-2 font-bold text-xs ${getThreatColor(item.result.threatLevel)}`}>
                      {item.result.threatLevel === ThreatLevel.SAFE ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                      {item.result.threatLevel}
                   </div>
                )}
              </div>
            </div>

            {/* Results Expand */}
            {item.status === ScanStatus.COMPLETED && item.result && (
              <div className="mt-4 pt-4 border-t border-slate-800 text-sm animate-in fade-in slide-in-from-top-2">
                
                {/* Results Header */}
                <div className="flex items-center justify-between mb-4">
                   <p className="text-slate-400"><span className="text-slate-200 font-semibold">Verdict:</span> {item.result.summary}</p>
                   <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">CONFIDENCE: {item.result.confidenceScore}%</span>
                </div>
                
                {/* Result Tabs/Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left: Vulnerabilities */}
                  <div className="space-y-4">
                    <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                      <h5 className="text-xs font-mono text-slate-500 uppercase mb-2">Vulnerabilities</h5>
                      {item.result.vulnerabilities.length > 0 ? (
                        <ul className="space-y-1">
                          {item.result.vulnerabilities.map((v, i) => (
                            <li key={i} className="text-red-400 flex items-start gap-2">
                              <span className="mt-1.5 w-1 h-1 bg-red-500 rounded-full shrink-0"></span>
                              <span className="break-all">{v}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-emerald-500 flex items-center gap-1"><CheckCircle size={12}/> None Detected</span>
                      )}
                    </div>

                    <div className="bg-slate-950/50 p-3 rounded border border-slate-800">
                      <h5 className="text-xs font-mono text-slate-500 uppercase mb-2">Turn OS Intelligence (CVE Matches)</h5>
                      {item.result.cveMatches && item.result.cveMatches.length > 0 ? (
                         <ul className="space-y-1">
                         {item.result.cveMatches.map((link, i) => (
                           <li key={i} className="text-cyan-400 flex items-center gap-2 truncate">
                             <Globe size={12} />
                             <a href={link} target="_blank" rel="noreferrer" className="hover:underline truncate block w-full">{link}</a>
                           </li>
                         ))}
                       </ul>
                      ) : (
                        <span className="text-slate-500 text-xs italic">No public CVE matches found.</span>
                      )}
                    </div>
                  </div>

                  {/* Right: Binary Inspector & Tech Details */}
                  <div className="space-y-4">
                     {/* Binary Inspector */}
                     <div className="bg-slate-950 p-0 rounded border border-slate-800 overflow-hidden flex flex-col">
                        <div className="bg-slate-900 px-3 py-2 border-b border-slate-800 flex items-center gap-2">
                           <Binary size={12} className="text-slate-400" />
                           <h5 className="text-xs font-mono text-slate-400 uppercase">Binary Inspector (Header 1KB)</h5>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-slate-800">
                           <div className="flex flex-col">
                              <div className="bg-slate-900/50 px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">Hexadecimal</div>
                              <div className="h-48 overflow-y-auto custom-scrollbar bg-slate-950/30 p-3">
                                <pre className="text-[10px] font-mono text-cyan-300/70 whitespace-pre-wrap break-all leading-relaxed select-all">
                                   {item.result.hexDump || "No binary data available"}
                                </pre>
                              </div>
                           </div>
                           <div className="flex flex-col">
                              <div className="bg-slate-900/50 px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono text-slate-500 uppercase tracking-wider">ASCII</div>
                              <div className="h-48 overflow-y-auto custom-scrollbar bg-slate-950/30 p-3">
                                <pre className="text-[10px] font-mono text-emerald-300/70 whitespace-pre-wrap break-all leading-relaxed select-all">
                                   {item.result.asciiDump || "No ASCII data available"}
                                </pre>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-slate-950 p-3 rounded border border-slate-800">
                       <h5 className="text-xs font-mono text-slate-500 uppercase mb-2">Technical Analysis</h5>
                       <div className="font-mono text-xs text-slate-400 whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
                          {item.result.technicalDetails}
                       </div>
                     </div>
                  </div>

                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Scanner;
