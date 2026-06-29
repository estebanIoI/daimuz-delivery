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
  const [showLink, setShowLink] = useState(false);
  const [linkValue, setLinkValue] = useState("");

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

  const applyLink = () => {
    const v = linkValue.trim();
    if (v) { onChange(v); setShowLink(false); setLinkValue(""); }
  };

  const aspect = shape === "wide" ? "aspect-[16/7]" : "aspect-square w-24 h-24";

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-xs font-medium text-gray-500">{label}</label>
        <button
          type="button"
          onClick={() => { setShowLink((s) => !s); setLinkValue(value && value.startsWith("http") ? value : ""); }}
          className="text-[10px] text-[#25c462] font-semibold hover:underline"
        >
          {showLink ? "Subir archivo" : "Pegar link"}
        </button>
      </div>

      {showLink ? (
        <div className="flex gap-1">
          <input
            type="url"
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyLink(); } }}
            placeholder="https://...imagen.jpg"
            className="flex-1 border border-gray-200 rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#25c462] min-w-0"
          />
          <button type="button" onClick={applyLink} className="bg-[#25c462] text-white px-3 rounded-lg text-xs font-semibold hover:bg-[#1aaa52]">OK</button>
        </div>
      ) : (
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
      )}

      {/* Preview cuando se usa link */}
      {showLink && value && (
        <div className={`${shape === "wide" ? "aspect-[16/7]" : "w-24 h-24"} mt-1 rounded-xl overflow-hidden bg-gray-50 border border-gray-200`}>
          <img src={value} alt={label} className="w-full h-full object-cover" />
        </div>
      )}

      {error && <p className="text-red-500 text-[10px] mt-1">{error}</p>}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
    </div>
  );
}
