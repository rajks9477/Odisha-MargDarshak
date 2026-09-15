"use client";

import React, { useRef, useState } from "react";
import { Camera, Image as ImageIcon, Trash2, ShieldCheck, Loader2 } from "lucide-react";
import { MediaService } from "../services/mediaService";

interface PhotoItem {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
}

interface Props {
  photos: PhotoItem[];
  onPhotosChange: (photos: PhotoItem[]) => void;
}

export const PhotoCapture: React.FC<Props> = ({ photos, onPhotosChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photos.length + files.length > MediaService.MAX_PHOTOS) {
      setError(`Maximum ${MediaService.MAX_PHOTOS} photos allowed per report.`);
      return;
    }

    setCompressing(true);
    try {
      const newItems: PhotoItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = MediaService.validateImage(file);
        if (!validation.valid) {
          setError(validation.error || "Invalid file format");
          continue;
        }

        // Compress image client side
        const compressed = await MediaService.compressImage(file);
        newItems.push({
          file: new File([compressed.blob], file.name, { type: "image/jpeg" }),
          dataUrl: compressed.dataUrl,
          originalSize: file.size,
          compressedSize: compressed.sizeBytes,
        });
      }

      onPhotosChange([...photos, ...newItems]);
    } catch (err: any) {
      console.error("Image processing error", err);
      setError("Failed to compress and load photo.");
    } finally {
      setCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removePhoto = (index: number) => {
    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          4. Photo Evidence ({photos.length}/{MediaService.MAX_PHOTOS})
        </label>
        <span className="text-[11px] text-slate-500">Optional but recommended</span>
      </div>

      {error && (
        <div className="text-xs text-red-400 bg-red-950/40 border border-red-800/60 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Thumbnails list */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {photos.map((item, idx) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-700 bg-slate-900 aspect-video">
              <img
                src={item.dataUrl}
                alt={`Evidence ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="p-1.5 bg-red-600/90 text-white rounded-lg hover:bg-red-500 transition-colors"
                  title="Remove Photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-slate-950/80 px-1 py-0.5 text-[9px] text-emerald-400 text-center truncate">
                {(item.compressedSize / 1024).toFixed(0)} KB ({(100 - (item.compressedSize / item.originalSize) * 100).toFixed(0)}% saved)
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {photos.length < MediaService.MAX_PHOTOS && (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            multiple={photos.length === 0}
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            type="button"
            disabled={compressing}
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700 border-dashed rounded-xl text-xs font-semibold text-slate-300 transition-all hover:border-emerald-500/60"
          >
            {compressing ? (
              <>
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                <span>Compressing photo...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Take / Select Photo</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
        <ShieldCheck className="w-3 h-3 text-emerald-500" />
        <span>Photos are automatically compressed to save field bandwidth.</span>
      </div>
    </div>
  );
};
