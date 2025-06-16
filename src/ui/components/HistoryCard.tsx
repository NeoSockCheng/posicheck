import { useState, useEffect } from 'react';
import { FaTrash } from 'react-icons/fa';

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
    <div className="flex flex-col sm:flex-row items-center bg-white rounded-lg shadow-md hover:shadow-lg border border-violet-100 hover:border-violet-300 p-3 md:p-4 transition-all duration-200 overflow-hidden h-full animate-fadeIn">
      <div className="w-full sm:w-1/3 md:w-2/5 sm:mr-3 md:mr-4 mb-3 sm:mb-0 flex-shrink-0">
        {loading ? (
          <div className="w-full h-24 sm:h-28 md:h-32 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200 animate-pulse">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-violet-500 mb-2"></div>
              <p className="text-gray-400 text-xs">Loading...</p>
            </div>
          </div>
        ) : image ? (
          <div className="relative w-full h-24 sm:h-28 md:h-32 rounded-lg overflow-hidden shadow-sm bg-gray-200 group">
            <img
              src={image}
              alt="Detection result"
              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
            />
            <div className="absolute inset-0 shadow-inner"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        ) : (
          <div className="w-full h-24 sm:h-28 md:h-32 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-200">
            <p className="text-gray-400 text-xs">Image unavailable</p>
          </div>
        )}
      </div>
      
      <div className="flex-1 text-sm text-gray-700 min-w-0 flex flex-col w-full">        <div className="flex items-center mb-1">
          <p className="font-semibold text-violet-700">{date}</p>
          <div className="ml-auto">
            <button
              onClick={onDelete}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 transition"
              title="Delete"
            >
              <FaTrash size={13} />
            </button>
          </div>
        </div>        <p 
          className="mt-1 text-ellipsis overflow-hidden line-clamp-2 text-gray-600" 
          title={error}
        >
          <span className="font-medium text-gray-700">Detected: </span>
          {error}
        </p>
        <div className="mt-auto pt-2 border-t border-gray-100">          <button
            onClick={onView}
            className="w-full text-center text-white bg-violet-600 rounded-md px-2 py-2 text-sm hover:bg-violet-700 transition shadow-sm font-medium hover:shadow-md"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
