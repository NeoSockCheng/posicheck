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
  const [selectedItemImage, setSelectedItemImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  
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
  const handleView = async (id: number) => {
    const item = historyItems.find(item => item.id === id);
    if (item) {
      setSelectedItem(item);
      setSelectedItemImage(null);
      setImageLoading(true);
      
      try {
        // Load the image via IPC
        const result = await window.electron.getHistoryImageAsBase64({ 
          imagePath: item.imagePath,
          quality: 90,  // Higher quality for detail view
          maxWidth: 1200  // Allow larger dimensions for detail view
        });
        if (result.success && result.base64Image) {
          setSelectedItemImage(result.base64Image);
        } else {
          console.error('Failed to load image:', result.error);
        }
      } catch (err) {
        console.error('Error loading image:', err);
      } finally {
        setImageLoading(false);
      }
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
  
  // Format prediction data for display
  const formatErrorString = (predictionData: Record<string, number>): string => {
    const significantErrors = Object.entries(predictionData)
      .filter(([_, value]) => value > 0.5)
      .map(([key]) => key.replace(/_/g, ' '))
      .map(error => error.charAt(0).toUpperCase() + error.slice(1))
      .join(', ');
    
    return significantErrors || 'No significant errors detected';
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50 overflow-hidden">
      <Header
        title="Detection History"
        subtitle="View the history of your detection attempts."
      />

      <div className="flex flex-wrap gap-2 justify-end p-2 sm:p-4">
        {/* From Date */}
        <div className="flex items-center gap-1 border border-violet-300 rounded px-2 py-1">
          <label className="text-xs text-slate-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="text-sm text-slate-600 bg-transparent outline-none w-[115px] sm:w-auto"
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
            className="text-sm text-slate-600 bg-transparent outline-none w-[115px] sm:w-auto"
          />
          <FaRegCalendarAlt className="text-violet-400" size={14} />
        </div>
      </div>      
      
      {/* Display loading message */}
      {loading && (
        <div className="flex justify-center items-center p-4 sm:p-8">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-violet-500"></div>
          <span className="ml-3 text-base sm:text-lg text-violet-700">Loading history...</span>
        </div>
      )}
      
      {/* Display error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mx-2 sm:mx-4">
          <p>{error}</p>
        </div>
      )}
      
      {/* Display empty state if no history items */}
      {!loading && historyItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8">
          <FaRegCalendarAlt className="text-4xl sm:text-5xl text-gray-300 mb-3 sm:mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Detection History</h3>
          <p className="text-gray-500">Your detection history will appear here</p>
        </div>
      )}
      
      {/* Display history items - MAX TWO COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-2 sm:p-4 overflow-auto">
        {historyItems.map((item) => {
          const errorText = formatErrorString(item.predictionData);
          
          return (
            <HistoryCard
              key={item.id}
              id={item.id}
              date={formatDate(item.timestamp)}
              error={errorText}
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded hover:bg-red-600"
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-500 text-white rounded hover:bg-violet-600"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div className="max-h-[70vh] overflow-y-auto pr-1">            
            <div className="mb-4">
              {imageLoading ? (
                <div className="w-full h-36 sm:h-48 bg-gray-200 flex items-center justify-center rounded">
                  <p className="text-gray-600">Loading image...</p>
                </div>
              ) : selectedItemImage ? (
                <img 
                  src={selectedItemImage}
                  alt="Detection"
                  className="w-full h-auto max-h-60 sm:max-h-80 object-contain rounded mx-auto"
                />
              ) : (
                <div className="w-full h-36 sm:h-48 bg-gray-200 flex items-center justify-center rounded">
                  <p className="text-gray-600">Failed to load image</p>
                </div>
              )}
            </div>            
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">Date</h3>
              <p className="text-gray-700">{formatDate(selectedItem.timestamp)}</p>
            </div>
            <div className="mb-4">
              <h3 className="font-medium text-gray-900">Detected Errors</h3>
              <ul className="list-disc pl-5 text-gray-700">
                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3)
                  .map(([key, value]) => (
                    <li key={key} className="py-1">
                      <span className="font-medium">{key.replace(/_/g, ' ')}</span>: {(value * 100).toFixed(1)}%
                    </li>
                  ))
                }
                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3).length === 0 && (
                    <li>No significant errors detected</li>
                  )
                }
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Notes</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded break-words">{selectedItem.notes || "No notes"}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
