import FeatureCard from '../components/FeatureCard';
import { FaUpload, FaCommentDots, FaHistory } from 'react-icons/fa';

type HomePageProps = {
  onTryDetection: () => void;
};

export default function HomePage({ onTryDetection }: HomePageProps) {
    return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center px-4 py-12 sm:py-20">
        <h1 className="text-3xl sm:text-5xl font-bold text-gray-800 mb-4">
          <span className="text-purple-600">Posi</span>Check.
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto text-sm sm:text-base">
          AI-powered tool for detecting positioning errors in dental panoramic radiographs
        </p>
        <button
          onClick={onTryDetection}
          className="mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2 rounded-full transition"
        >
          Try the Detection
        </button>

        {/* Hero Image */}
        <div className="mt-10 w-full max-w-2xl">
          {/* Insert your hero image here */}
          <div className="bg-purple-300 rounded-lg h-48 sm:h-64 flex items-center justify-center text-white">
            Image Placeholder
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-4 py-8 bg-gray-50">
        <FeatureCard
          icon={<FaUpload size={20} className="bg-purple-200 p-2 rounded-full text-purple-700" />}
          title="Easy Upload"
          description="Simple drag-and-drop or file picker to upload radiograph"
        />
        <FeatureCard
          icon={<FaCommentDots size={20} className="bg-pink-200 p-2 rounded-full text-pink-700" />}
          title="Feedback Gaining"
          description="One-click to get result"
        />
        <FeatureCard
          icon={<FaHistory size={20} className="bg-blue-200 p-2 rounded-full text-blue-700" />}
          title="History View"
          description="Clear prediction output with label and confidence"
        />
      </section>
    </div>
  );
}
