import { useEffect, useRef, useState } from 'react';
import { ClueMedia, MediaType } from '../../types';
import { useMediaUrl } from '../../hooks/useMediaUrl';

export function mediaTypeFromMime(mime: string): MediaType | null {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('audio/')) return 'audio';
  if (mime.startsWith('video/')) return 'video';
  return null;
}

interface Props {
  existingMedia: ClueMedia | null;
  pendingFile: File | null;
  onSelectFile: (file: File) => void;
  onRemove: () => void;
}

export default function MediaDropzone({ existingMedia, pendingFile, onSelectFile, onRemove }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const existingUrl = useMediaUrl(pendingFile ? null : existingMedia?.id);

  useEffect(() => {
    if (!pendingFile) {
      setPendingUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!mediaTypeFromMime(file.type)) {
      alert('Please choose an image, audio, or video file.');
      return;
    }
    onSelectFile(file);
  }

  const previewType = pendingFile ? mediaTypeFromMime(pendingFile.type) : existingMedia?.type ?? null;
  const previewUrl = pendingUrl ?? existingUrl;

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition ${
          dragOver ? 'border-gold bg-slate-800' : 'border-slate-700 hover:border-slate-500'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,audio/*,video/*"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {!previewUrl && (
          <p className="text-sm text-slate-400">Click or drop an image, audio, or video file here</p>
        )}
        {previewUrl && previewType === 'image' && (
          <img src={previewUrl} alt="Clue media preview" className="mx-auto max-h-48 rounded" />
        )}
        {previewUrl && previewType === 'audio' && (
          <audio src={previewUrl} controls className="mx-auto w-full" />
        )}
        {previewUrl && previewType === 'video' && (
          <video src={previewUrl} controls className="mx-auto max-h-48 rounded" />
        )}
      </div>
      {(previewUrl || existingMedia) && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="mt-2 text-sm text-red-400 hover:text-red-300"
        >
          Remove media
        </button>
      )}
    </div>
  );
}
