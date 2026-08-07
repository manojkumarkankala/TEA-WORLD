import { useRef, useState } from 'react';
import { Upload, Loader2, X } from 'lucide-react';
import { uploadMedia } from '@/lib/upload';
import { useToast } from '@/context/ToastContext';

type Props = {
  folder: string;
  accept: string;
  value: string;
  onChange: (url: string) => void;
  label?: string;
};

export function MediaUpload({ folder, accept, value, onChange, label = 'Upload' }: Props) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    const { url, error } = await uploadMedia(file, folder);
    setUploading(false);
    if (error) {
      toast('Upload failed: ' + error, 'error');
      return;
    }
    onChange(url);
    toast('Uploaded successfully');
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = '';
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-tea-50 px-3 py-2 text-sm font-medium text-tea-700 hover:bg-tea-100 disabled:opacity-50 transition-colors"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? 'Uploading…' : label}
      </button>
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex shrink-0 items-center gap-1 rounded-lg bg-red-50 px-2.5 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors"
          title="Clear"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {value && accept.startsWith('image') && (
        <img src={value} alt="" className="h-9 w-9 rounded-lg object-cover border border-cream-200" />
      )}
    </div>
  );
}
