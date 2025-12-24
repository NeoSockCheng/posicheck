import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DetectionPage from './pages/DetectionPage';
import HistoryPage from './pages/HistoryPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import HomePage from './pages/HomePage';
import Footer from './components/Footer';
import './index.css';

export default function App() {
  const [selectedPage, setSelectedPage] = useState('home');
  const [feedbackData, setFeedbackData] = useState<{ imageData: string; imagePath: string; detectedErrors: string[] } | null>(null);

  const renderPage = () => {
    switch (selectedPage) {
      case 'home':
        return <HomePage onTryDetection={() => setSelectedPage('detection')} />;
      case 'detection':
        return <DetectionPage onSendToFeedback={(data) => {
          setFeedbackData(data);
          setSelectedPage('feedback');
        }} />;
      case 'history':
        return <HistoryPage />;
      case 'feedback':
        return <FeedbackPage initialData={feedbackData} onClearInitialData={() => setFeedbackData(null)} />;
      case 'profile':
        return <ProfilePage />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center">Page not found</div>
        );
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans">
      <Sidebar selected={selectedPage} onSelect={setSelectedPage} />
      <main className="flex-1 flex flex-col overflow-auto bg-gray-50">
        <div className="flex-1 flex flex-col">{renderPage()}</div>
        <Footer />
      </main>
      
    </div>
    
  );
}
