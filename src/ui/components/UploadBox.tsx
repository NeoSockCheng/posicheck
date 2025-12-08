import React, { useRef, useState } from 'react';

type UploadBoxProps = {
  usage?: 'inference' | 'feedback';
  onFileSelect?: (file: { name: string; data: string }) => void;
  selectedFile?: { name: string; data: string } | null;
};

export default function UploadBox({ usage = 'feedback', onFileSelect, selectedFile }: UploadBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(selectedFile?.data || null);
  const [fileName, setFileName] = useState<string | null>(selectedFile?.name || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: file.name,
          data: reader.result as string,
        };
        setPreview(reader.result as string);

        if (onFileSelect) {
          onFileSelect(fileData);
        } else if (usage === 'inference') {
          window.electron.sendFileForInference(fileData);
        } else {
          window.electron.sendFileForFeedback(fileData);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const fileData = {
        name: file.name,
        data: '',
      };
      setPreview(null);

      if (onFileSelect) {
        onFileSelect(fileData);
      } else if (usage === 'inference') {
        window.electron.sendFileForInference(fileData);
      } else {
        window.electron.sendFileForFeedback(fileData);
      }
    }
  };

  const handleBoxClick = () => {
    inputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setFileName(file.name);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        const fileData = {
          name: file.name,
          data: reader.result as string,
        };
        setPreview(reader.result as string);

        if (onFileSelect) {
          onFileSelect(fileData);
        } else if (usage === 'inference') {
          window.electron.sendFileForInference(fileData);
        } else {
          window.electron.sendFileForFeedback(fileData);
        }
      };
      reader.readAsDataURL(file);
    } else {
      const fileData = {
        name: file.name,
        data: '',
      };
      setPreview(null);

      if (onFileSelect) {
        onFileSelect(fileData);
      } else if (usage === 'inference') {
        window.electron.sendFileForInference(fileData);
      } else {
        window.electron.sendFileForFeedback(fileData);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  return (
    <div
      className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-violet-300 rounded-lg bg-gradient-to-br from-white to-purple-100 p-4 sm:p-6 md:p-8 w-full cursor-pointer"
      onClick={handleBoxClick}
      onDrop={handleDrop}
      onDragOver={handleDragOver}      style={{ 
        height: '280px',
        width: '100%'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jpeg,.jpg,.png,.pdf"
        className="mt-4 hidden"
        onChange={handleFileChange}
      />
      <div className="flex flex-col items-center justify-center h-full w-full">
        {!preview ? (
          <>
            <svg
              width="40"
              height="40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="text-violet-600 mb-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
              />
            </svg>
            <p className="text-violet-700 text-center text-sm sm:text-base">
              Upload or Drag and Drop your Panoramic Radiographs
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Max File Size: 20MB | Supported: .jpeg, .pdf, .dcm
            </p>
          </>
        ) : (
          <>            <div className="h-[180px] w-full flex items-center justify-center">
              <img
                src={preview}
                alt="Preview"
                className="rounded shadow"
                style={{ 
                  objectFit: 'contain', 
                  maxWidth: '100%', 
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </div>
            <div className="text-slate-700 text-sm mt-4 text-center max-w-full truncate">
              {fileName}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
