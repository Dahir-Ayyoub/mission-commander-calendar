
import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative p-12 border-4 border-dashed rounded-[2.5rem] transition-all duration-500 ${
          dragActive 
            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10" 
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        } ${isProcessing ? "opacity-60 cursor-not-allowed" : "cursor-pointer group hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-500/10"}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".xlsx, .xls" onChange={handleChange} disabled={isProcessing} />

        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${selectedFile ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rotate-12' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:scale-110 group-hover:-rotate-3'}`}>
            {selectedFile ? <FileText size={40} /> : <Upload size={40} />}
          </div>
          
          <div>
            <h3 className="text-2xl font-black tracking-tight mb-2">
              {selectedFile ? selectedFile.name : "Importer le Planning Excel"}
            </h3>
            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium max-w-xs mx-auto">
              Glissez votre fichier ici. Assurez-vous d'avoir les colonnes <strong>date</strong> (JJ/MM/AAAA) et <strong>mission</strong>. 
              {selectedFile ? "" : "Les colonnes X, Y seront utilisées pour la carte."}
            </p>
          </div>

          {!isProcessing && (
            <div className="flex items-center space-x-4">
              <span className="h-px w-8 bg-slate-200 dark:bg-slate-800"></span>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">OU</span>
              <span className="h-px w-8 bg-slate-200 dark:bg-slate-800"></span>
            </div>
          )}

          {!isProcessing && (
            <Button variant="primary" className="px-8 h-12 rounded-2xl shadow-xl shadow-indigo-500/20">
              Parcourir mes fichiers
            </Button>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center space-y-4">
              <div className="relative w-12 h-12">
                 <div className="absolute inset-0 border-4 border-indigo-100 dark:border-indigo-900/30 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Initialisation...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
