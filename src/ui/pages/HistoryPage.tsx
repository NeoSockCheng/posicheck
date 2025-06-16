import { useState, useEffect } from 'react';
import HistoryCard from '../components/HistoryCard';
import Header from '../components/Header';
import { FaRegCalendarAlt, FaFilter, FaChevronDown, FaSort, FaChartBar } from 'react-icons/fa';
import { formatDate } from '../utils/dateFormatter';
import { formatErrorString, getFriendlyErrorName, errorNamesMapping } from '../utils/errorFormatter';
import Modal from '../components/Modal';

// Define types for history items
type HistoryItem = {
  id: number;
  imagePath: string;
  timestamp: number;
  predictionData: Record<string, number>;
  notes?: string;
};

// Simplified sort options
type SortOption = 'newest' | 'oldest';

// Type for error statistics
type ErrorStatistic = {
  errorKey: string;
  friendlyName: string;
  count: number;
  percentage: number; 
  avgConfidence: number;
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
  const [sortedItems, setSortedItems] = useState<HistoryItem[]>([]);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Error statistics state
  const [showStatistics, setShowStatistics] = useState(false);
  const [errorStatistics, setErrorStatistics] = useState<ErrorStatistic[]>([]);
    // New state for filter UI
  const [isErrorFilterOpen, setIsErrorFilterOpen] = useState(false);
  const [selectedErrorTypes, setSelectedErrorTypes] = useState<string[]>([]);
  // We use all error keys from the mapping
  const availableErrorTypes = Object.keys(errorNamesMapping);
  
  // Helper function to clear date filters
  const clearDateFilters = () => {
    setFromDate('');
    setToDate('');
  };
  
  // Helper function to clear error type filters
  const clearErrorFilters = () => {
    setSelectedErrorTypes([]);
  };
  // Helper to toggle an error type in the filter
  const toggleErrorType = (errorType: string) => {
    setSelectedErrorTypes(prev => 
      prev.includes(errorType)
        ? prev.filter(type => type !== errorType)
        : [...prev, errorType]
    );
  };

  // Calculate error statistics from history items
  const calculateErrorStatistics = () => {
    if (historyItems.length === 0) return [];
    
    const stats: Record<string, { count: number, totalConfidence: number }> = {};
    const totalItems = historyItems.length;
    
    // Initialize stats for all error types
    availableErrorTypes.forEach(errorType => {
      stats[errorType] = { count: 0, totalConfidence: 0 };
    });
    
    // Count occurrences of each error type and sum confidences
    historyItems.forEach(item => {
      Object.entries(item.predictionData).forEach(([key, value]) => {
        // Only count errors with confidence > 0.3
        if (value > 0.3) {
          if (stats[key]) {
            stats[key].count += 1;
            stats[key].totalConfidence += value;
          }
        }
      });
    });
    
    // Convert to array and calculate percentages and averages
    const statsArray = Object.entries(stats).map(([errorKey, data]) => {
      return {
        errorKey,
        friendlyName: getFriendlyErrorName(errorKey),
        count: data.count,
        percentage: (data.count / totalItems) * 100,
        avgConfidence: data.count > 0 ? (data.totalConfidence / data.count) * 100 : 0
      };
    });
    
    // Sort by occurrence percentage (descending)
    return statsArray.sort((a, b) => b.percentage - a.percentage);
  };

  // Fetch history items from the database
  useEffect(() => {
    fetchHistoryItems();
  }, []);

  // Update error statistics when history items change
  useEffect(() => {
    if (historyItems.length > 0) {
      setErrorStatistics(calculateErrorStatistics());
    }
  }, [historyItems]);
  
  // Filter history items when filters change
  useEffect(() => {
    if (!historyItems.length) {
      setFilteredItems([]);
      return;
    }
    
    let filtered = [...historyItems];
    
    // Apply date filters
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
    
    // Apply error type filtering
    if (selectedErrorTypes.length > 0) {
      filtered = filtered.filter(item => {
        const errorKeys = Object.keys(item.predictionData);
        return selectedErrorTypes.some(type => errorKeys.includes(type) && item.predictionData[type] > 0.3);
      });
    }
    
    setFilteredItems(filtered);
  }, [historyItems, fromDate, toDate, selectedErrorTypes]);

  // Sort filtered items when filter or sort option changes
  useEffect(() => {
    let sorted = [...filteredItems];
    
    switch (sortOption) {
      case 'newest':
        sorted = sorted.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        sorted = sorted.sort((a, b) => a.timestamp - b.timestamp);
        break;
    }
    
    setSortedItems(sorted);
  }, [filteredItems, sortOption]);
  
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

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Detection History"
        subtitle="View the history of your detection attempts."
      />

      <div className="bg-violet-50 border-t border-b border-violet-100 p-3 sm:p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center text-violet-800 mr-2">
            <FaRegCalendarAlt className="mr-1.5 text-violet-500" size={16} />
            <span className="font-medium">Date Range:</span>
          </div>
          
          {/* From Date - Enhanced UI */}
          <div className="relative">
            <div className="flex items-center gap-1 bg-white border border-violet-300 rounded-md px-2 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500">
              <label className="text-xs font-medium text-violet-700">From</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none w-[125px] sm:w-auto ml-1"
              />
            </div>
          </div>

          {/* To Date - Enhanced UI */}
          <div className="relative">
            <div className="flex items-center gap-1 bg-white border border-violet-300 rounded-md px-2 py-1.5 shadow-sm focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500">
              <label className="text-xs font-medium text-violet-700">To</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="text-sm text-gray-700 bg-transparent outline-none w-[125px] sm:w-auto ml-1"
              />
            </div>
          </div>
          
          {/* Preset date ranges for easier selection */}
          <div className="flex items-center ml-auto">
            <div className="text-xs text-gray-500 mr-2">Quick Select:</div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  // Last 7 days
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - 7);
                  setToDate(end.toISOString().split('T')[0]);
                  setFromDate(start.toISOString().split('T')[0]);
                }}
                className="text-xs bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 px-2 py-1 rounded transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => {
                  // Last 30 days
                  const end = new Date();
                  const start = new Date();
                  start.setDate(end.getDate() - 30);
                  setToDate(end.toISOString().split('T')[0]);
                  setFromDate(start.toISOString().split('T')[0]);
                }}
                className="text-xs bg-white hover:bg-violet-100 text-violet-700 border border-violet-200 px-2 py-1 rounded transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={clearDateFilters}
                className="text-xs bg-white hover:bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter section - Errors */}
      <div className="border-t border-violet-100 bg-white">
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-violet-100">
          <div className="flex items-center">
            <FaFilter className="text-violet-500 mr-2" size={16} />
            <h4 className="text-sm sm:text-base font-medium text-violet-800">Error Type Filters</h4>
            {selectedErrorTypes.length > 0 && (
              <span className="ml-2 bg-violet-100 text-violet-800 text-xs px-2 py-0.5 rounded-full">
                {selectedErrorTypes.length} selected
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowStatistics(!showStatistics)}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
              title="View error statistics"
            >
              <FaChartBar className="text-violet-500" size={14} />
              <span className="hidden sm:inline">Statistics</span>
            </button>
            <button
              onClick={() => setIsErrorFilterOpen(prev => !prev)}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 px-2 py-1 rounded hover:bg-violet-50 transition-colors"
            >
              {isErrorFilterOpen ? 'Hide Filters' : 'Show Filters'}
              <FaChevronDown className={`transition-transform ${isErrorFilterOpen ? 'rotate-180' : ''} text-violet-400`} size={12} />
            </button>
          </div>
        </div>
        
        {isErrorFilterOpen && (
          <div className="p-3 sm:p-4 bg-white border-b border-violet-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {availableErrorTypes.map((errorType) => {
                const isSelected = selectedErrorTypes.includes(errorType);
                // Determine color based on error type category
                let colorClass = isSelected 
                  ? 'bg-violet-100 border-violet-500 text-violet-800' 
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100';
                
                // Customize color based on error type
                if (errorType.includes('chin') || errorType.includes('head')) {
                  colorClass = isSelected 
                    ? 'bg-blue-100 border-blue-500 text-blue-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-blue-50';
                } else if (errorType.includes('pos') || errorType.includes('slump')) {
                  colorClass = isSelected 
                    ? 'bg-green-100 border-green-500 text-green-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-green-50';
                } else if (errorType.includes('movement') || errorType.includes('tongue')) {
                  colorClass = isSelected 
                    ? 'bg-amber-100 border-amber-500 text-amber-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-amber-50';
                } else if (errorType.includes('bite')) {
                  colorClass = isSelected 
                    ? 'bg-red-100 border-red-500 text-red-800' 
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-red-50';
                }
                
                return (
                  <div
                    key={errorType}
                    onClick={() => toggleErrorType(errorType)}
                    className={`cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-all flex items-center gap-2 border ${colorClass}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded accent-violet-500"
                    />
                    <span>{getFriendlyErrorName(errorType)}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Action buttons */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={clearErrorFilters}
                disabled={selectedErrorTypes.length === 0}
                className={`px-3 py-1.5 text-sm font-medium rounded transition-colors
                  ${selectedErrorTypes.length > 0 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Clear All
              </button>
              <button
                onClick={() => {
                  // Select all error types
                  setSelectedErrorTypes([...availableErrorTypes]);
                }}
                className="px-3 py-1.5 text-sm font-medium bg-violet-100 text-violet-700 rounded hover:bg-violet-200 transition-colors"
              >
                Select All
              </button>
            </div>
          </div>
        )}
        
        {/* Error Statistics View */}
        {showStatistics && (
          <div className="p-3 sm:p-4 bg-white border-b border-violet-100">
            <div className="mb-3 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-800">Error Statistics</h3>
              <span className="text-sm text-gray-500">Based on {historyItems.length} detection{historyItems.length !== 1 ? 's' : ''}</span>
            </div>
            
            {errorStatistics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bar chart visualization */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Error Occurrence Rate</h4>
                  <div className="space-y-3">
                    {errorStatistics.filter(stat => stat.count > 0).slice(0, 5).map(stat => (
                      <div key={stat.errorKey}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-700">{stat.friendlyName}</span>
                          <span className="text-xs font-medium bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">
                            {stat.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-violet-500 h-2.5 rounded-full"
                            style={{ width: `${stat.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {errorStatistics.filter(stat => stat.count > 0).length > 5 && (
                    <div className="text-center mt-2 text-sm text-gray-500">
                      Showing top 5 of {errorStatistics.filter(stat => stat.count > 0).length} errors
                    </div>
                  )}
                </div>
                
                {/* Statistics table */}
                <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Detailed Statistics</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error Type</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                          <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Confidence</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {errorStatistics.filter(stat => stat.count > 0).map((stat) => (
                          <tr key={stat.errorKey} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-700">{stat.friendlyName}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-700">{stat.count}</td>
                            <td className="px-3 py-2 text-sm text-center text-gray-700">{stat.percentage.toFixed(1)}%</td>
                            <td className="px-3 py-2 text-sm text-right">
                              <span className={`px-2 py-0.5 rounded-full text-xs 
                                ${stat.avgConfidence > 70 
                                  ? 'bg-red-100 text-red-700' 
                                  : stat.avgConfidence > 50 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-green-100 text-green-700'
                                }`}>
                                {stat.avgConfidence.toFixed(1)}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {errorStatistics.filter(stat => stat.count > 0).length === 0 && (
                          <tr>
                            <td colSpan={4} className="px-3 py-4 text-sm text-center text-gray-500">
                              No error statistics available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No error statistics available</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add summary statistics and sort options */}
      {!loading && !error && historyItems.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-2 sm:p-4 border-t border-violet-100 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Showing <span className="font-semibold text-violet-700">{filteredItems.length}</span> of <span className="font-semibold text-violet-700">{historyItems.length}</span> items
            </span>
            {(fromDate || toDate || selectedErrorTypes.length > 0) && (
              <span className="text-xs bg-violet-50 text-violet-800 px-2 py-0.5 rounded-full">
                Filters active
              </span>
            )}
          </div>
          
          {/* Simplified Sort options dropdown */}
          <div className="relative ml-auto">
            <button 
              onClick={() => setShowSortOptions(!showSortOptions)}
              className="flex items-center gap-1.5 text-sm bg-white border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors"
            >
              <FaSort className="text-gray-500" size={12} />
              <span className="text-gray-700">
                Sort: 
                <span className="font-medium ml-1">
                  {sortOption === 'newest' ? 'Newest First' : 'Oldest First'}
                </span>
              </span>
              <FaChevronDown size={10} className={`ml-1 transition-transform ${showSortOptions ? 'rotate-180' : ''}`} />
            </button>
            
            {showSortOptions && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 z-10 w-48">
                <div className="py-1">
                  <button 
                    onClick={() => {
                      setSortOption('newest');
                      setShowSortOptions(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'newest' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'}`}
                  >
                    Newest First
                  </button>
                  <button 
                    onClick={() => {
                      setSortOption('oldest');
                      setShowSortOptions(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${sortOption === 'oldest' ? 'bg-violet-50 text-violet-700' : 'text-gray-700'}`}
                  >
                    Oldest First
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
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
      
      {/* Display empty state if no filtered items */}
      {!loading && historyItems.length > 0 && filteredItems.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center p-4 sm:p-8 bg-yellow-50 mx-3 sm:mx-4 my-2 rounded-lg border border-yellow-200">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">No Matching Results</h3>
          <p className="text-gray-600 text-center mb-4">No items match your current filter criteria</p>
          <div className="flex gap-2">
            <button
              onClick={clearDateFilters}
              className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
            >
              Clear Date Filters
            </button>
            <button
              onClick={clearErrorFilters}
              className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors"
            >
              Clear Error Filters
            </button>
          </div>
        </div>
      )}

      {/* Display history items - MAX TWO COLUMNS */}
      <div className="flex-1 overflow-auto p-2 sm:p-4 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {sortedItems.map((item) => {
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
              <div className="space-y-2">
                {Object.entries(selectedItem.predictionData)
                  .filter(([_, value]) => value > 0.3)
                  .sort((a, b) => b[1] - a[1]) // Sort by confidence value (descending)
                  .map(([key, value]) => {
                    const confidence = value * 100;
                    // Use the imported getFriendlyErrorName utility
                    const friendlyName = getFriendlyErrorName(key);
                    // Color based on confidence level
                    const barColor = confidence > 70 ? 'bg-red-500' : confidence > 50 ? 'bg-orange-400' : 'bg-yellow-400';
                    
                    return (
                      <div key={key} className="py-2">
                        <div className="flex justify-between mb-1.5">
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
                }
                {Object.entries(selectedItem.predictionData)
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
