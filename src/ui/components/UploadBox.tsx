import { FaUpload } from 'react-icons/fa';

export default function UploadBox() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center border-2 border-dashed border-violet-300 rounded-lg bg-gradient-to-br from-white to-purple-100 p-4 sm:p-6 md:p-8 w-full">
      <FaUpload size={40} className="text-violet-600 mb-4" />
      <p className="text-violet-700 text-center text-sm sm:text-base">
        Upload or Drag and Drop your Panoramic Radiographs
      </p>
      <p className="text-xs text-slate-500 mt-2">Max File Size: 20MB | Supported: .jpeg, .pdf</p>
    </div>
  );
}
