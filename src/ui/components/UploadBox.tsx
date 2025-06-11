import { FaUpload } from 'react-icons/fa';

export default function UploadBox() {
  return (
    <div className="flex-1 flex flex-col justify-center items-center border-4 border-dashed border-purple-300 rounded-lg bg-purple-50 p-4 sm:p-6 md:p-8 w-full">
      <FaUpload size={40} className="text-purple-600 mb-4" />
      <p className="text-purple-700 font-semibold text-center text-sm sm:text-base">
        Upload or Drag and Drop your Panoramic Radiographs
      </p>
      <p className="text-xs text-purple-400 mt-2">Max File Size: 20MB | Supported: .jpeg, .pdf</p>
    </div>
  );
}
