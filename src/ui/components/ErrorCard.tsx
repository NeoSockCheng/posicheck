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
  };

  return (
    <div className={`flex items-start p-4 rounded shadow hover:shadow-md transition w-full ${
      isDetected 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-white'
    }`}>
      <div className={`text-xl mr-3 p-2 ${
        isDetected ? 'text-red-600' : 'text-violet-700'
      }`}>{icon}</div>
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          <h3 className={`font-bold text-sm sm:text-base ${
            isDetected ? 'text-red-700' : 'text-violet-700'
          }`}>{title}</h3>
          
          {isDetected && videoId && onPlayVideo && (
            <button 
              className="flex items-center text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition"
              onClick={handlePlayVideo}
            >
              <FaPlayCircle className="mr-1" /> How to Fix
            </button>
          )}
        </div>
        <p className={`text-xs sm:text-sm ${
          isDetected ? 'text-red-600' : 'text-gray-600'
        }`}>{description}</p>
        
        {isDetected && correctiveAction && (
          <div className="mt-2 p-2 bg-green-50 border border-green-100 rounded">
            <p className="text-xs text-green-800 font-medium">Corrective Action:</p>
            <p className="text-xs text-green-700">{correctiveAction}</p>
          </div>
        )}
      </div>
    </div>
  );
}
