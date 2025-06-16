import { useState, useEffect } from 'react';
import HistoryCard from '../components/HistoryCard';
import Header from '../components/Header';
import { FaRegCalendarAlt } from 'react-icons/fa';
import { formatDate } from '../utils/dateFormatter';
import { formatErrorString, getFriendlyErrorName } from '../utils/errorFormatter';
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
  const [filteredItems, setFilteredItems] = useState<HistoryItem[]>([]);
    // Fetch history items from the database
  useEffect(() => {
    fetchHistoryItems();
  }, []);
  
  // Filter history items when fromDate or toDate changes
  useEffect(() => {
    if (!historyItems.length) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...historyItems];
    
    if (fromDate) {
      const fromTimestamp = new Date(fromDate).getTime();
      filtered = filtered.filter(item => item.timestamp >= fromTimestamp);
    }
    
    if (toDate) {
      // Set time to end of day for toDate
      const toTimestamp = new Date(toDate);
      toTimestamp.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => item.timestamp <= toTimestamp.getTime());
    }
    
    setFilteredItems(filtered);
  }, [historyItems, fromDate, toDate]);
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
  // We're now using the imported formatErrorString utility

  return (    <div className="flex flex-col flex-1 bg-gray-50">
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
        {/* Display history items - MAX TWO COLUMNS */}      <div className="flex-1 overflow-auto p-2 sm:p-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredItems.map((item) => {
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
            );        })}
        </div>
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
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-violet-500 text-white rounded hover:bg-violet-600 transition-colors font-medium"
              onClick={() => setSelectedItem(null)}
            >
              Close
            </button>
          </div>
        }
      >
        {selectedItem && (
          <div>
            <div className="mb-6">
              {imageLoading ? (
                <div className="w-full h-48 sm:h-56 bg-gray-200 flex items-center justify-center rounded-lg animate-pulse">
                  <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-violet-500 mb-2"></div>
                    <p className="text-gray-500">Loading image...</p>
                  </div>
                </div>
              ) : selectedItemImage ? (
                <div className="rounded-lg overflow-hidden bg-gray-100 p-1 shadow-inner border border-gray-200">
                  <img 
                    src={selectedItemImage}
                    alt="Detection"
                    className="w-full h-auto max-h-[60vh] object-contain mx-auto"
                  />
                </div>
              ) : (
                <div className="w-full h-48 sm:h-56 bg-gray-200 flex items-center justify-center rounded-lg border border-gray-300">
                  <p className="text-gray-600">Failed to load image</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-violet-800 text-lg mb-2">Date</h3>
                <p className="text-gray-700">{formatDate(selectedItem.timestamp)}</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-medium text-violet-800 text-lg mb-2">Notes</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded break-words min-h-[60px]">
                  {selectedItem.notes || "No notes added"}
                </p>
              </div>
            </div>
            
            <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h3 className="font-medium text-violet-800 text-lg mb-2">Detected Errors</h3>
              <div className="space-y-2">                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3)
                  .sort((a, b) => b[1] - a[1]) // Sort by confidence value (descending)
                  .map(([key, value]) => {
                    const confidence = value * 100;                    // Use the imported getFriendlyErrorName utility
                    const friendlyName = getFriendlyErrorName(key);
                    // Color based on confidence level
                    const barColor = confidence > 70 ? 'bg-red-500' : confidence > 50 ? 'bg-orange-400' : 'bg-yellow-400';
                    
                    return (
                      <div key={key} className="py-2">                        <div className="flex justify-between mb-1.5">
                          <span className="font-medium text-gray-700">{friendlyName}</span>
                          <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{confidence.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className={`${barColor} h-3 rounded-full transition-all duration-500 ease-out shadow-sm`} 
                            style={{ width: `${confidence}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                }                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3).length === 0 && (
                    <div className="text-center py-8 bg-green-50 rounded-lg border border-green-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-green-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-green-700 font-medium text-lg">No significant errors detected</p>
                      <p className="text-green-600 text-sm mt-1">The patient positioning looks good</p>
                    </div>
                  )
                }
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
