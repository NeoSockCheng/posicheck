import { FaPlayCircle } from 'react-icons/fa';

type ErrorCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDetected?: boolean;
  correctiveAction?: string;
  videoId?: string;
  onPlayVideo?: (videoId: string) => void;
};

export default function ErrorCard({ 
  icon, 
  title, 
  description, 
  isDetected = false,
  correctiveAction,
  videoId,
  onPlayVideo
}: ErrorCardProps) {
  
  const handlePlayVideo = () => {
    if (videoId && onPlayVideo) {
      onPlayVideo(videoId);
    }
  };  return (    <div className={`group flex items-start p-4 pl-6 rounded-lg shadow transition-all duration-300 w-full relative overflow-hidden ${
      isDetected 
        ? 'bg-white border border-red-300 shadow-md hover:shadow-lg animate-fadeIn' 
        : 'bg-white border border-transparent hover:border-violet-200 hover:shadow-md'
    }`}>
      {/* Status border on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        isDetected ? 'bg-red-500' : 'bg-transparent group-hover:bg-violet-300'
      }`}></div><div className={`relative flex-shrink-0 text-2xl mr-4 p-2 rounded-full ${
        isDetected 
          ? 'text-red-600 bg-red-100 ring-2 ring-red-200' 
          : 'text-violet-700'
      }`}>
        {icon}
        {isDetected && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start flex-wrap gap-2">          <h3 className={`font-bold text-sm sm:text-base ${
            isDetected 
              ? 'text-red-700' 
              : 'text-violet-700 group-hover:text-violet-800'
          }`}>
            {title}
            {isDetected && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Detected
              </span>
            )}
          </h3>
            {isDetected && videoId && onPlayVideo && (
            <button 
              className="flex items-center text-xs bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white px-3 py-1.5 rounded-full transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
              onClick={handlePlayVideo}
            >
              <FaPlayCircle className="mr-1.5" /> How to Fix
            </button>
          )}
        </div>
        <p className={`mt-1 text-xs sm:text-sm ${
          isDetected ? 'text-red-700' : 'text-gray-600'
        }`}>
          {description}
        </p>
          {isDetected && correctiveAction && (
          <div className="mt-3 p-3 bg-emerald-50 border-l-4 border-emerald-400 rounded-md shadow-sm">
            <div className="flex items-center mb-1">
              <div className="mr-1 text-emerald-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-emerald-800">Recommended Action:</p>
            </div>
            <p className="text-xs sm:text-sm text-emerald-700 ml-5">{correctiveAction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
