
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar as CalendarIcon, 
  X, 
  LayoutDashboard,
  Printer,
  CalendarRange,
  RotateCcw,
  ChevronRight,
  Search,
  CheckCircle2,
  Sun,
  Moon,
  FileText
} from 'lucide-react';
import { parseExcelFile } from './services/excelService';
import { analyzeMissions } from './services/geminiService';
import { Mission } from './types';
import { FileUpload } from './components/FileUpload';
import { Calendar } from './components/Calendar';
import { Button } from './components/Button';
import { format, isWithinInterval } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const App: React.FC = () => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [view, setView] = useState<'calendar' | 'missions'>('calendar');
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const pdfTemplateRef = useRef<HTMLDivElement>(null);
  const dayDetailContentRef = useRef<HTMLDivElement>(null);

  const [isRangeModalOpen, setIsRangeModalOpen] = useState(false);
  const [rangeStart, setRangeStart] = useState<string>('');
  const [rangeEnd, setRangeEnd] = useState<string>('');

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);
    try {
      const parsedMissions = await parseExcelFile(file);
      setMissions(parsedMissions);
      setAiAnalysis(null);
      if (parsedMissions.length > 0) {
        const sorted = [...parsedMissions].sort((a, b) => a.date.getTime() - b.date.getTime());
        setCalendarViewDate(new Date(sorted[0].date));
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erreur lors de l'import");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAiAnalysis = async () => {
    if (missions.length === 0) return;
    setIsAnalyzing(true);
    try {
      const summary = await analyzeMissions(missions);
      setAiAnalysis(summary);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearData = () => {
    if (window.confirm("Supprimer toutes les données ?")) {
      setMissions([]);
      setAiAnalysis(null);
      setSelectedDate(null);
    }
  };

  // Explicitly type filteredMissions to avoid type inference issues
  const filteredMissions: Mission[] = useMemo(() => {
    return missions.filter(m => 
      String(m.mission).toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(m.details).some(v => String(v).toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [missions, searchQuery]);

  const missionsByMonth = useMemo<Record<string, Mission[]>>(() => {
    const groups: Record<string, Mission[]> = {};
    filteredMissions.forEach(m => {
      const monthKey = format(m.date, 'MMMM yyyy');
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(m);
    });
    return groups;
  }, [filteredMissions]);

  // Explicitly type rangeMissions to avoid type inference issues
  const rangeMissions: Mission[] = useMemo(() => {
    if (!rangeStart || !rangeEnd) return [];
    try {
      const start = new Date(rangeStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(rangeEnd);
      end.setHours(23, 59, 59, 999);
      return missions
        .filter(m => isWithinInterval(m.date, { start, end }))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    } catch {
      return [];
    }
  }, [missions, rangeStart, rangeEnd]);

  // Explicitly type activeMissionsForExport to fix 'unknown' type errors during mapping
  const activeMissionsForExport: Mission[] = useMemo(() => {
    return rangeStart ? rangeMissions : filteredMissions;
  }, [rangeStart, rangeMissions, filteredMissions]);

  const exportToPDF = async (targetRef: React.RefObject<HTMLDivElement>, fileName: string) => {
    if (!targetRef.current) return;
    setIsExportingPDF(true);
    
    try {
      // Attendre un court instant pour s'assurer que le DOM est prêt
      await new Promise(r => setTimeout(r, 500));
      
      const element = targetRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        height: element.scrollHeight,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculer le ratio pour adapter la largeur de l'image à celle du PDF
      const ratio = pdfWidth / (imgWidth / 2); // /2 car scale=2
      const canvasHeightInPdfUnits = (imgHeight / 2) * ratio;
      
      let heightLeft = canvasHeightInPdfUnits;
      let position = 0;

      // Ajouter la première page
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInPdfUnits);
      heightLeft -= pdfHeight;

      // Ajouter des pages supplémentaires si nécessaire
      while (heightLeft > 0) {
        position = heightLeft - canvasHeightInPdfUnits;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, canvasHeightInPdfUnits);
        heightLeft -= pdfHeight;
      }

      pdf.save(`${fileName}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la génération du PDF.");
    } finally {
      setIsExportingPDF(false);
    }
  };

  const selectedDayMissions = useMemo<Mission[]>(() => {
    if (!selectedDate) return [];
    return missions.filter(m => m.date.toDateString() === selectedDate.toDateString());
  }, [missions, selectedDate]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      <header className="no-print sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight uppercase">Mission Commander</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {missions.length > 0 && (
              <>
                <div className="hidden md:flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button 
                    onClick={() => setView('calendar')}
                    className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${view === 'calendar' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    CALENDRIER
                  </button>
                  <button 
                    onClick={() => setView('missions')}
                    className={`px-5 py-2 rounded-lg text-[10px] font-black tracking-widest transition-all ${view === 'missions' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    LISTE
                  </button>
                </div>
                <Button variant="primary" size="sm" className="rounded-xl" onClick={handleAiAnalysis} isLoading={isAnalyzing}>
                  <Sparkles size={16} className="mr-2" />
                  Analyse IA
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-6 py-8">
        {missions.length === 0 ? (
          <div className="no-print h-[70vh] flex flex-col items-center justify-center">
            <FileUpload onFileSelect={handleFileUpload} isProcessing={isProcessing} />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="no-print w-full lg:w-72 flex-shrink-0 space-y-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Statistiques</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-slate-500">Missions</span>
                    <span className="text-2xl font-black text-indigo-600">{missions.length}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Actions</h3>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start text-[11px] font-bold" onClick={() => setIsRangeModalOpen(true)}>
                    <CalendarRange size={14} className="mr-3 text-indigo-500" />
                    EXPORTER UN RAPPORT
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-[11px] font-bold text-red-500" onClick={clearData}>
                    <RotateCcw size={14} className="mr-3" />
                    RÉINITIALISER
                  </Button>
                </div>
              </div>

              {aiAnalysis && (
                <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-xl shadow-indigo-500/20">
                  <div className="flex items-center space-x-2 mb-3">
                    <Sparkles size={16} />
                    <h3 className="font-bold text-xs uppercase tracking-widest">Avis de l'IA</h3>
                  </div>
                  <p className="text-xs leading-relaxed">{String(aiAnalysis)}</p>
                </div>
              )}
            </aside>

            <div className="flex-1">
              {view === 'calendar' ? (
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-2 overflow-hidden">
                  <Calendar 
                    missions={missions} 
                    onDateClick={setSelectedDate} 
                    currentViewDate={calendarViewDate} 
                    onViewDateChange={setCalendarViewDate} 
                  />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center px-6">
                    <Search className="text-slate-400" size={20} />
                    <input 
                      type="text" 
                      placeholder="Rechercher une mission..." 
                      className="flex-1 ml-4 outline-none text-sm text-slate-700 dark:text-slate-300 bg-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="space-y-12">
                    {Object.entries(missionsByMonth).map(([month, monthMissions]) => (
                      <div key={month} className="space-y-4">
                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">{month}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {monthMissions.map(m => (
                            <div 
                              key={m.id} 
                              onClick={() => setSelectedDate(m.date)}
                              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="text-center min-w-[40px]">
                                  <div className="text-[9px] font-bold text-indigo-500 uppercase">{format(m.date, 'EEE')}</div>
                                  <div className="text-xl font-black text-slate-900 dark:text-white">{format(m.date, 'dd')}</div>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate">{String(m.mission)}</h4>
                              </div>
                              <ChevronRight className="text-slate-300" size={18} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- MODÈLE PDF (CACHÉ) --- */}
      <div className="fixed left-[-9999px] top-0 pointer-events-none">
        <div ref={pdfTemplateRef} className="w-[800px] bg-white p-16 font-sans text-slate-900">
          <div className="border-b-2 border-slate-900 pb-8 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tighter">Mission Commander - Rapport</h1>
              <p className="text-sm text-slate-500">Document généré le {format(new Date(), 'dd/MM/yyyy')}</p>
            </div>
          </div>

          <div className="bg-slate-100 p-6 rounded-lg mb-10 flex gap-12">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Total Missions</p>
              <p className="text-lg font-bold">{activeMissionsForExport.length}</p>
            </div>
            {rangeStart && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Période</p>
                <p className="text-sm font-bold">Du {format(new Date(rangeStart), 'dd/MM/yyyy')} au {format(new Date(rangeEnd), 'dd/MM/yyyy')}</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Added explicit cast to Mission[] to ensure the map operation is recognized by the compiler */}
            {(activeMissionsForExport as Mission[]).map((m: Mission, idx: number) => (
              <div key={m.id} className="pb-6 border-b border-slate-100 last:border-0">
                <div className="flex justify-between items-baseline mb-3">
                   <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-slate-900 text-white rounded text-[10px] flex items-center justify-center font-bold">{idx + 1}</span>
                      <h4 className="text-base font-bold uppercase">{String(m.mission)}</h4>
                   </div>
                   <span className="text-sm font-bold text-indigo-600">{format(m.date, 'dd/MM/yyyy')}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-9">
                  {Object.entries(m.details).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">{k}</p>
                      <p className="text-xs text-slate-700 font-medium">{String(v) || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal d'exportation */}
      {isRangeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-8 shadow-2xl">
            <h3 className="text-xl font-bold mb-6 uppercase">Exporter les Missions</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Du</label>
                <input type="date" value={rangeStart} onChange={(e) => setRangeStart(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Au</label>
                <input type="date" value={rangeEnd} onChange={(e) => setRangeEnd(e.target.value)} className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl outline-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsRangeModalOpen(false)}>Annuler</Button>
              <Button variant="primary" className="flex-1" onClick={() => exportToPDF(pdfTemplateRef, `Rapport-Missions`)} disabled={!rangeStart || !rangeEnd} isLoading={isExportingPDF}>Générer PDF</Button>
            </div>
          </div>
        </div>
      )}

      {/* Détail d'une mission (Side Panel) */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 h-full w-full max-w-xl flex flex-col animate-in slide-in-from-right overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-indigo-600 text-white p-2 rounded-lg text-center min-w-[50px]">
                  <p className="text-[10px] font-bold uppercase">{format(selectedDate, 'MMM')}</p>
                  <p className="text-xl font-black">{format(selectedDate, 'dd')}</p>
                </div>
                <h3 className="font-bold text-lg">{format(selectedDate, 'dd MMMM yyyy')}</h3>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportToPDF(dayDetailContentRef, `Mission-${format(selectedDate, 'dd-MM-yyyy')}`)} isLoading={isExportingPDF}>
                   <Printer size={16} />
                </Button>
                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><X size={20} /></button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-slate-950">
              <div ref={dayDetailContentRef} className="space-y-6 bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-100 dark:border-slate-800">
                <h2 className="text-xl font-black uppercase border-b pb-4 mb-6">Missions du jour</h2>
                {selectedDayMissions.length > 0 ? selectedDayMissions.map((m, i) => (
                  <div key={m.id} className="mb-10 last:mb-0">
                    <div className="flex items-center gap-3 mb-4">
                       <span className="bg-slate-900 text-white w-8 h-8 rounded flex items-center justify-center font-bold text-sm">{i+1}</span>
                       <h4 className="text-lg font-black uppercase text-indigo-600">{String(m.mission)}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-11">
                      {Object.entries(m.details).map(([k, v]) => (
                        <div key={k} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{k}</p>
                          <p className="text-sm font-bold">{String(v) || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 opacity-40">
                    <CalendarIcon size={48} className="mx-auto mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">Aucune mission</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
