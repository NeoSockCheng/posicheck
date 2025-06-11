import { useState } from 'react';
import HistoryCard from '../components/HistoryCard';
import Header from '../components/Header';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { imageSamplePanoramic } from '../assets/assets';

const sampleHistory = [
  {
    id: 1,
    date: 'May 14, 2025 10:34 AM',
    error: 'Chin too high, Tongue not pressed',
    imageUrl: imageSamplePanoramic,
  },
  {
    id: 2,
    date: 'May 15, 2025 1:00 PM',
    error: 'Head Tilted Left',
    imageUrl: imageSamplePanoramic, 
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
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Detection History"
        subtitle="View the history of your detection attempts."
      />


      <div className="flex gap-2 justify-end p-1">
        {/* From Date */}
        <div className="flex items-center gap-1 border border-violet-300 rounded px-2 py-1">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-sm text-slate-600 bg-transparent outline-none"
          />
          <FaRegCalendarAlt className="text-violet-400" size={14} />
        </div>

        {/* To Date */}
        <div className="flex items-center gap-1 border border-violet-300 rounded px-2 py-1">
          <label className="text-xs text-slate-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="text-sm text-slate-600 bg-transparent outline-none"
          />
          <FaRegCalendarAlt className="text-violet-400" size={14} />
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
    </div>
  );
}
