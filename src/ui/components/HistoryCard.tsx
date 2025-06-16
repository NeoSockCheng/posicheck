import { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';

type HistoryCardProps = {
  id?: number; // Optional for backward compatibility
  date: string;
  error: string;
  imageUrl: string;
  onView: () => void;
  onDelete: () => void;
};

export default function HistoryCard({
  date,
  error,
  imageUrl,
  onView,
  onDelete,
}: HistoryCardProps) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load the image if it's a file path
    if (imageUrl.startsWith('file://')) {
      const loadImage = async () => {
        try {
          setLoading(true);          
          const imagePath = imageUrl.replace('file://', '');
          const result = await window.electron.getHistoryImageAsBase64({ 
            imagePath, 
            isThumb: true 
          });
          if (result.success && result.base64Image) {
            setImage(result.base64Image);
          }
        } catch (err) {
          console.error('Error loading image thumbnail:', err);
        } finally {
          setLoading(false);
        }
      };
      
      loadImage();
    } else {
      // It's already a data URL
      setImage(imageUrl);
      setLoading(false);
    }
  }, [imageUrl]);
  
  return (
    <div className="flex flex-col sm:flex-row items-center bg-white rounded-lg shadow-md hover:shadow-lg border border-gray-200 p-2 sm:p-3 md:p-4 transition-all duration-200 overflow-hidden h-full">
      <div className="w-full sm:w-1/3 md:w-auto sm:mr-3 md:mr-4 mb-3 sm:mb-0 flex-shrink-0">
        {loading ? (
          <div className="w-full h-24 sm:h-28 md:h-32 max-w-56 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 animate-pulse">
            <p className="text-gray-400 text-xs">Loading...</p>
          </div>
        ) : image ? (
          <div className="relative w-full h-24 sm:h-28 md:h-32 max-w-56 rounded-lg overflow-hidden shadow-sm bg-gray-200">
            <img
              src={image}
              alt="Detection result"
              className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 shadow-inner"></div>
          </div>
        ) : (
          <div className="w-full h-24 sm:h-28 md:h-32 max-w-56 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
            <p className="text-gray-400 text-xs">Image unavailable</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 text-sm text-gray-700 min-w-0 flex flex-col w-full">
        <p className="font-semibold text-violet-600">{date}</p>
        <p 
          className="mt-1 text-ellipsis overflow-hidden line-clamp-2 text-gray-600" 
          title={error}
        >
          <span className="font-medium text-gray-700">Errors: </span>
          {error}
        </p>
        <div className="flex mt-auto pt-2 gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-1 text-white bg-violet-600 rounded-md px-2 py-1 text-xs hover:bg-violet-700 transition shadow-sm"
          >
            <FaEye size={12} /> View
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-white bg-red-500 rounded-md px-2 py-1 text-xs hover:bg-red-600 transition shadow-sm"
          >
            <FaTrash size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
