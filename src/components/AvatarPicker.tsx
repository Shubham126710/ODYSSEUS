"use client";

import React, { useRef, useState } from 'react';

interface AvatarPickerProps {
  onSelect: (file: File | null, previewUrl: string) => void;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({ onSelect }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      onSelect(file, objectUrl);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div 
        onClick={handleClick}
        className="relative w-24 h-24 rounded-full border-2 border-dashed border-juice-cream/30 hover:border-juice-orange cursor-pointer transition-all duration-300 flex items-center justify-center overflow-hidden group bg-juice-cream/5"
      >
        {preview ? (
          <img src={preview} alt="Avatar Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-2">
            <svg className="w-8 h-8 mx-auto text-juice-cream/50 group-hover:text-juice-orange transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-[8px] uppercase tracking-widest text-juice-cream/50 block mt-1">Upload</span>
          </div>
        )}
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white">Change</span>
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />
    </div>
  );
};
