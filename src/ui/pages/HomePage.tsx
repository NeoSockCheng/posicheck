import FeatureCard from '../components/FeatureCard';
import { FaUpload, FaCommentDots, FaHistory } from 'react-icons/fa';
import Button from '../components/Button';
import { imageHome } from '../assets/assets.ts';


type HomePageProps = {
  onTryDetection: () => void;
};

export default function HomePage({ onTryDetection }: HomePageProps) {
  return (
    <div className="flex flex-col flex-1 bg-white">
      {/* Hero Section */}
      <section className="flex flex-col sm:flex-row items-center justify-center text-center px-4 py-12 sm:py-20 gap-8 bg-gray-50">
        {/* Left: Text and Button */}
        <div className="flex-1">
          <h1 className="text-3xl sm:text-5xl font-bold text-violet-600 mb-4">
            <span className="text-slate-600">Posi</span>Check.
          </h1>
          <p className="font-sans text-gray-600 max-w-xl mx-auto text-sm sm:text-base mb-8">
            AI-powered tool for detecting positioning errors in dental panoramic radiographs
          </p>
          <Button onClick={onTryDetection}>Start Detection</Button>
        </div>

        {/* Right: Image */}
        <div className="flex-1 flex justify-center">
          <img src={imageHome} alt="Pan Cartoon" className="max-w-xs sm:max-w-sm" />
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-20 py-8 bg-white">
        <FeatureCard
          icon={<FaUpload size={35} className="bg-indigo-200 p-2 rounded-full text-indigo-400" />}
          title="Easy Upload"
          description="Simple drag-and-drop or file picker to upload radiograph"
        />
        <FeatureCard
          icon={<FaCommentDots size={35} className="bg-pink-200 p-2 rounded-full text-pink-400" />}
          title="Feedback Gaining"
          description="One-click to get result"
        />
        <FeatureCard
          icon={<FaHistory size={35} className="bg-blue-200 p-2 rounded-full text-blue-400" />}
          title="History View"
          description="Clear prediction output with label and confidence"
        />
      </section>
    </div>
  );
}
