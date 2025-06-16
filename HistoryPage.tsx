import { useState, useEffect } from 'react';
import HistoryCard from '../components/HistoryCard';
import Header from '../components/Header';
import { FaRegCalendarAlt, FaTrash } from 'react-icons/fa';
import { formatDate } from '../utils/dateFormatter';
import Modal from '../components/Modal';

// Define types for history items
type HistoryItem = {
  id: number;
  imagePath: string;
  timestamp: number;
  predictionData: Record<string, number>;
  notes?: string;
};

export default function HistoryPage() {
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  
  // Fetch history items from the database
  useEffect(() => {
    fetchHistoryItems();
  }, []);
  
  const fetchHistoryItems = async () => {
    try {
      setLoading(true);
      const response = await window.electron.getHistoryItems({ limit: 50 });
      
      if (response.success && response.items) {
        setHistoryItems(response.items);
      } else {
        setError(response.error || 'Failed to retrieve history items');
      }
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load history data');
    } finally {
      setLoading(false);
    }
  };

  const handleView = (id: number) => {
    const item = historyItems.find(item => item.id === id);
    if (item) {
      setSelectedItem(item);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await window.electron.deleteHistoryItem(id);
      if (response.success) {
        // Remove the item from the list
        setHistoryItems(prev => prev.filter(item => item.id !== id));
      } else {
        setError(response.error || 'Failed to delete item');
      }
    } catch (err) {
      console.error('Error deleting history item:', err);
      setError('Failed to delete history item');
    } finally {
      setDeleteConfirmId(null); // Close modal
    }
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
