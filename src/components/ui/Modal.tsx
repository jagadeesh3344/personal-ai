import React from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-10 animate-scale-in">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-850 bg-zinc-950/40">
          <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-widest">{title}</h3>
          <button 
            onClick={onClose}
            className="text-zinc-450 hover:text-white p-1 rounded-md hover:bg-zinc-800/60 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-5 text-zinc-300">
          {children}
        </div>
      </div>
    </div>
  );
};
