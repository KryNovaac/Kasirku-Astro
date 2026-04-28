import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Option {
  id: string;
  name: string;
  disabled?: boolean;
  meta?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  icon?: React.ReactNode;
}

export default function CustomSelect({ 
  options, 
  value, 
  onChange, 
  placeholder = "Pilih...", 
  className,
  label,
  icon
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">{label}</label>}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full h-14 px-5 rounded-2xl border-2 border-slate-100 bg-white flex items-center justify-between text-sm font-bold transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-500/5 group",
          isOpen ? "border-blue-600 ring-4 ring-blue-500/5" : "hover:border-slate-300"
        )}
      >
        <div className="flex items-center gap-3">
          {icon && <div className={cn("w-5 h-5 transition-colors", isOpen ? "text-blue-600" : "text-slate-300 group-hover:text-slate-400")}>{icon}</div>}
          <span className={selectedOption ? "text-slate-900" : "text-slate-400"}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform duration-300", isOpen && "rotate-180 text-blue-600")} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-[100] w-full bg-white border-2 border-slate-100 rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden mt-2 p-2"
          >
            <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
              {options.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada pilihan</div>
              ) : (
                options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      onChange(opt.id);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl text-left transition-all mb-1",
                      opt.disabled ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-blue-50",
                      value === opt.id ? "bg-blue-600 text-white hover:bg-blue-700" : "text-slate-700"
                    )}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-black tracking-tight">{opt.name}</span>
                      {opt.meta && <span className={cn("text-[9px] font-bold uppercase tracking-widest", value === opt.id ? "text-blue-200" : "text-slate-400")}>{opt.meta}</span>}
                    </div>
                    {value === opt.id && <Check className="w-4 h-4" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
