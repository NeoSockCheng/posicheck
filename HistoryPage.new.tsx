import { useState, useEffect } from 'react';
import HistoryCard from '../components/HistoryCard';
import Header from '../components/Header';
import { FaRegCalendarAlt } from 'react-icons/fa';
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

      {/* Display loading message */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
          <span className="ml-3 text-lg text-violet-700">Loading history...</span>
        </div>
      )}
      
      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded m-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Display empty state if no history items */}
      {!loading && historyItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-8">
          <FaRegCalendarAlt className="text-5xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Detection History</h3>
          <p className="text-gray-500">Your detection history will appear here</p>
        </div>
      )}
      
      {/* Display history items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {historyItems.map((item) => {
          // Extract main errors from prediction data
          const errors = Object.entries(item.predictionData)
            .filter(([_, value]) => value > 0.5)
            .map(([key]) => key.replace('_', ' '))
            .join(', ');
            
          return (
            <HistoryCard
              key={item.id}
              id={item.id}
              date={formatDate(item.timestamp)}
              error={errors || 'No significant errors detected'}
              imageUrl={`file://${item.imagePath}`}
              onView={() => handleView(item.id)}
              onDelete={() => setDeleteConfirmId(item.id)}
            />
          );
        })}
      </div>
      
      {/* Delete confirmation modal */}
      <Modal 
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Delete"
        footer={
          <div className="flex justify-end space-x-2">
            <button
              className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={() => deleteConfirmId !== null && handleDelete(deleteConfirmId)}
            >
              Delete
            </button>
          </div>
        }
      >
        <p>Are you sure you want to delete this history item? This action cannot be undone.</p>
      </Modal>
      
      {/* Detail view modal */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title="Detection Details"
        footer={
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div>
            <div className="mb-4">
              <img 
                src={`file://${selectedItem.imagePath}`}
                alt="Detection"
                className="w-full h-48 object-cover rounded"
              />
            </div>
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">Date</h3>
              <p>{formatDate(selectedItem.timestamp)}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">Detected Errors</h3>
              <ul className="list-disc pl-5">
                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3)
                  .map(([key, value]) => (
                    <li key={key}>
                      {key.replace('_', ' ')}: {(value * 100).toFixed(1)}%
                    </li>
                  ))
                }
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Notes</h3>
              <p>{selectedItem.notes || "No notes"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
