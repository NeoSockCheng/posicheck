import { useState } from 'react';
import Footer from '../components/Footer';
import HistoryCard from '../components/HistoryCard';

const sampleHistory = [
  {
    id: 1,
    date: 'May 14, 2025 10:34 AM',
    error: 'Chin too high, Tongue not pressed',
    imageUrl: '/images/sample1.png', // placeholder
  },
  {
    id: 2,
    date: 'May 15, 2025 1:00 PM',
    error: 'Head Tilted Left',
    imageUrl: '/images/sample2.png', // placeholder
  },
];

export default function HistoryPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const handleView = (id: number) => {
    console.log('View:', id);
  };

  const handleDelete = (id: number) => {
    console.log('Delete:', id);
  };

  return (
    <div className="flex flex-col flex-1 bg-white">
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between">
        <h1 className="text-xl font-bold text-purple-700 mb-4 sm:mb-0">
          Detection History
        </h1>
        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-purple-300 rounded px-2 py-1 text-sm"
            placeholder="From Date"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-purple-300 rounded px-2 py-1 text-sm"
            placeholder="To Date"
          />
        </div>
      </div>

      <div className="flex-1 p-4">
        {sampleHistory.map((item) => (
          <HistoryCard
            key={item.id}
            date={item.date}
            error={item.error}
            imageUrl={item.imageUrl}
            onView={() => handleView(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>

      <Footer />
    </div>
  );
}
