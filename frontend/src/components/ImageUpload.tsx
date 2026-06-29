"use client";

import { useRef, useState } from "react";
import { apiUpload } from "@/lib/api";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
  shape?: "square" | "wide";
}

export function ImageUpload({ value, onChange, label = "Imagen", shape = "square" }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const data = await apiUpload(file);
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const aspect = shape === "wide" ? "aspect-[16/7]" : "aspect-square w-24 h-24";

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`${aspect} relative overflow-hidden rounded-xl border-2 border-dashed border-gray-300 hover:border-[#25c462] bg-gray-50 flex items-center justify-center text-gray-400 text-xs transition-colors w-full`}
      >
        {value ? (
          <img src={value} alt={label} className="w-full h-full object-cover" />
        ) : uploading ? (
          <span className="animate-pulse">Subiendo...</span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V18a2 2 0 002 2h14a2 2 0 002-2v-1.5M16 8l-4-4m0 0L8 8m4-4v12" /></svg>
            Subir
          </span>
        )}
        {value && !uploading && (
          <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] py-0.5 text-center">Cambiar</span>
        )}
      </button>
      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
