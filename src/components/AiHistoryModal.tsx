import React, { useState, useEffect } from 'react';
import { 
  X, History, FileText, ArrowLeft, Trash2, Download, Copy, Check, 
  Calendar, Cpu, Sparkles, FolderOpen, ExternalLink 
} from 'lucide-react';
import { MarkdownReport } from './MarkdownReport';

interface AuditHistoryItem {
  id: string;
  filename: string;
  title: string;
  type: string;
  provider: string;
  model: string;
  createdAt: string;
  sizeKb: string;
  preview: string;
}

interface AiHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiHistoryModal: React.FC<AiHistoryModalProps> = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState<AuditHistoryItem[]>([]);
  const [auditsDirectory, setAuditsDirectory] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<{ filename: string; content: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
        setAuditsDirectory(data.auditsDirectory || '');
      }
    } catch (err) {
      console.error('Failed to load audit history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      setSelectedAudit(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAudit = async (filename: string) => {
    try {
      const res = await fetch(`/api/ai/history/${encodeURIComponent(filename)}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedAudit(data);
      }
    } catch (err) {
      alert('Failed to load audit file');
    }
  };

  const handleDelete = async (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete this audit report?`)) return;

    try {
      const res = await fetch(`/api/ai/history/${encodeURIComponent(filename)}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.filename !== filename));
        if (selectedAudit?.filename === filename) setSelectedAudit(null);
      }
    } catch (err) {
      alert('Failed to delete file');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-4xl max-h-[92vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl text-slate-100 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900/95 px-5 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {selectedAudit ? selectedAudit.filename : 'Saved AI Network Audits'}
              </h3>
              <p className="text-xs text-slate-400">
                {selectedAudit ? 'Viewing saved local markdown report' : `Stored locally in ${auditsDirectory || 'audits/'} on your laptop`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedAudit && (
              <button
                onClick={() => setSelectedAudit(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to List</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto max-h-[75vh]">
          {selectedAudit ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-mono text-cyan-400">
                  {selectedAudit.filename}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedAudit.content)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>

                  <button
                    onClick={() => handleDownload(selectedAudit.content, selectedAudit.filename)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              <div className="bg-slate-950/70 p-5 rounded-2xl border border-slate-800/80 shadow-inner">
                <MarkdownReport content={selectedAudit.content} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {history.length > 0 ? (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleOpenAudit(item.filename)}
                    className="bg-slate-950/60 hover:bg-slate-850/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                          {item.type}
                        </span>
                        {item.model && (
                          <span className="text-[10px] font-mono text-slate-400">
                            ({item.provider}/{item.model})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-1 leading-relaxed">
                        {item.preview}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(item.createdAt).toLocaleString()}
                        </span>
                        <span>&bull;</span>
                        <span>{item.sizeKb} KB</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                      <button
                        onClick={(e) => handleDelete(item.filename, e)}
                        className="p-2 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                        title="Delete saved audit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1.5 bg-slate-800 group-hover:bg-cyan-600 text-slate-300 group-hover:text-white rounded-lg text-xs font-semibold transition-colors">
                        View Report &rarr;
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-slate-500 max-w-sm mx-auto space-y-3">
                  <FileText className="w-10 h-10 mx-auto text-slate-600" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-300">No Audits Saved Yet</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Every time you run an AI Network Security Audit or ask AI to explain a category, the full report is automatically saved here on your laptop.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
