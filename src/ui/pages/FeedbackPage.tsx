import { useState, useEffect } from 'react';
import Button from '../components/Button';
import InputField from '../components/InputField';
import ErrorCategory from '../components/ErrorCategory';
import Header from '../components/Header';
import UploadBox from '../components/UploadBox';
import { FaPaperPlane, FaList, FaFileDownload, FaSpinner, FaImage } from 'react-icons/fa';
import { formatDate } from '../utils/dateFormatter';

// Type definition for a feedback entry
type FeedbackEntry = {
  id: number;
  imagePath: string;
  timestamp: number;
  accuracyRating: number;
  errorTypes: string[];
  extraFeedback?: string;
  imageData?: string; // Base64 image data when loaded
};

type ActiveTab = 'submit' | 'view';

export default function FeedbackPage() {
  // Tab state
  const [activeTab, setActiveTab] = useState<ActiveTab>('submit');
  
  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [organization, setOrganization] = useState('');
  const [extraFeedback, setExtraFeedback] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{name: string; data: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);
  const [showThankYouPage, setShowThankYouPage] = useState(false); // Added to control thank you page display
  // Track if the profile is finished loading (used internally for future error handling)
  const [originalProfile, setOriginalProfile] = useState<any>(null);
  
  // View feedback states
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackEntry | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingImage, setLoadingImage] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ loading: boolean; message?: string; error?: boolean }>({
    loading: false
  });

  // Error selections
  const [chinError, setChinError] = useState('Chin Normal');
  const [positionError, setPositionError] = useState('Position Normal');
  const [headTilt, setHeadTilt] = useState('No Tilt');
  const [headRotation, setHeadRotation] = useState('No Rotation');
  const [tongueError, setTongueError] = useState('Tongue Properly Positioned');
  const [slumpedPosition, setSlumpedPosition] = useState('Upright');
  const [movementError, setMovementError] = useState('No Movement');
  const [biteblockError, setBiteblockError] = useState('Biteblock Present');

  // Load profile data and feedback list on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load user profile
        const profileResult = await window.electron.getUserProfile();
        if (profileResult.success && profileResult.profile) {
          // Set the form fields with profile data
          setName(profileResult.profile.name);
          setEmail(profileResult.profile.email);
          setPhone(profileResult.profile.phone);
          setCountry(profileResult.profile.country);
          setOrganization(profileResult.profile.organization);
          
          // Keep a copy of the original profile
          setOriginalProfile(profileResult.profile);
        }
        
        // Load feedback list
        await loadFeedbackList();
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, []);
    // Effect for loading feedback when the view tab is activated
  useEffect(() => {
    if (activeTab === 'view') {
      (async () => {
        await loadFeedbackList();
        
        // Try to load the selected image, if there is one
        if (selectedFeedback && !selectedFeedback.imageData) {
          await refreshCurrentImage();
        }
      })();
    }
  }, [activeTab]);
  
  // Reset form and start a new feedback submission
  const handleStartNewFeedback = () => {
    setShowThankYouPage(false);
    setSubmitResult(null);
    // Form should already be reset in handleSubmit, but we'll do it again just to be safe
    setUploadedFile(null);
    setExtraFeedback('');
    // Error types should already be reset too
  };
    // Load feedback list from database
  const loadFeedbackList = async () => {
    setIsLoading(true);
    try {
      const result = await window.electron.getAllFeedback({ limit: 100 });
      if (result.success && result.items && result.items.length > 0) {
        setFeedbackList(result.items);
        
        // If there are items, select and preload the first one
        const firstItem = result.items[0];
        setSelectedFeedback(firstItem);
        
        // Preload the image for the first item
        if (firstItem && firstItem.imagePath) {
          await loadFeedbackImage(firstItem);
        }
      } else {
        console.error('Failed to load feedback items or no items found:', result.error);
      }
    } catch (error) {
      console.error('Error loading feedback list:', error);    } finally {
      setIsLoading(false);
    }
  };
  
  // Force reload current feedback image
  const refreshCurrentImage = async () => {
    if (selectedFeedback) {
      await loadFeedbackImage(selectedFeedback);
    }
  };
    // Load image for a feedback item
  const loadFeedbackImage = async (feedbackItem: FeedbackEntry) => {
    if (feedbackItem.imageData) return; // Already loaded
    
    setLoadingImage(true);
    try {
      console.log(`[DEBUG UI] Loading image for feedback ${feedbackItem.id}, path: ${feedbackItem.imagePath}`);
      
      const result = await window.electron.getFeedbackImage({ 
        imagePath: feedbackItem.imagePath,
        quality: 90
      });
      
      if (result.success && result.base64Image) {
        console.log(`[DEBUG UI] Successfully loaded image for feedback ${feedbackItem.id}`);
        
        const updatedFeedbackItem = { ...feedbackItem, imageData: result.base64Image };
        
        // First update the selected feedback if this is the selected one
        if (selectedFeedback?.id === feedbackItem.id) {
          setSelectedFeedback(updatedFeedbackItem);
        }
        
        // Then update the feedback list with the loaded image
        setFeedbackList(prev => 
          prev.map(item => 
            item.id === feedbackItem.id 
              ? updatedFeedbackItem
              : item
          )
        );
      } else {
        // Show the error in the console for debugging
        console.error(`[DEBUG UI] Failed to load image for feedback ${feedbackItem.id}:`, result.error);
        // Check for debug info if available
        if ('debug' in result && result.debug) {
          console.error(`[DEBUG UI] Additional debug info:`, result.debug);
        }
      }
    } catch (error) {
      console.error('[DEBUG UI] Error loading feedback image:', error);
    } finally {
      setLoadingImage(false);
    }
  };
  
  // Export all feedback as CSV and images as ZIP
  const exportFeedback = async () => {
    setExportStatus({ loading: true });
    try {
      const result = await window.electron.exportFeedback();
      
      if (result.success) {
        setExportStatus({ 
          loading: false, 
          message: `Feedback exported successfully to: ${result.exportPath}` 
        });
      } else {
        setExportStatus({ 
          loading: false, 
          message: result.error || 'Export failed', 
          error: true 
        });
      }
    } catch (error) {
      console.error('Error exporting feedback:', error);
      setExportStatus({ 
        loading: false, 
        message: error instanceof Error ? error.message : 'Export failed', 
        error: true 
      });
    }
  };

  const handleFileSelect = (file: { name: string; data: string }) => {
    setUploadedFile(file);
    // Clear any previous submission results
    setSubmitResult(null);
  };
  
  const handleSubmit = async () => {
    if (!uploadedFile) {
      setSubmitResult({
        success: false,
        message: 'Please upload an image before submitting feedback.'
      });
      return;
    }
    
    setIsSubmitting(true);
    setSubmitResult(null);
    
    // Collect error types that aren't "normal" to store in the database
    const errorTypes = [];
    if (chinError !== 'Chin Normal') errorTypes.push(chinError);
    if (positionError !== 'Position Normal') errorTypes.push(positionError);
    if (headTilt !== 'No Tilt') errorTypes.push(headTilt);
    if (headRotation !== 'No Rotation') errorTypes.push(headRotation);
    if (tongueError !== 'Tongue Properly Positioned') errorTypes.push(tongueError);
    if (slumpedPosition !== 'Upright') errorTypes.push(slumpedPosition);
    if (movementError !== 'No Movement') errorTypes.push(movementError);
    if (biteblockError !== 'Biteblock Present') errorTypes.push(biteblockError);
    
    // Calculate an accuracy rating (inverse of how many errors they reported)
    // More errors = lower accuracy of our detection
    const errorCount = errorTypes.length;
    const accuracyRating = Math.max(5 - errorCount, 1); // 5 = perfect, 1 = lots of issues
    
    const feedbackData = {
      userInfo: {
        name,
        email,
        phone,
        country,
        organization,
      },
      accuracyRating,
      errorTypes,
      extraFeedback,
    };
    
    try {
      // Update the user profile if information has changed
      if (originalProfile && (
        name !== originalProfile.name ||
        email !== originalProfile.email ||
        phone !== originalProfile.phone ||
        country !== originalProfile.country ||
        organization !== originalProfile.organization
      )) {
        console.log('Profile information has changed, updating...');
        await window.electron.saveUserProfile({
          ...originalProfile,
          name,
          email,
          phone,
          country,
          organization,
        });
      }
      
      const result = await window.electron.sendFileForFeedback({
        ...uploadedFile,
        feedbackData
      });
      
      if (result.success) {
        // Show thank you page instead of just a message
        setSubmitResult({
          success: true,
          message: 'Thank you for your feedback!'
        });
        setShowThankYouPage(true);
        
        // Reset form fields for next submission
        setExtraFeedback('');
        setUploadedFile(null);
        
        // Reset error selections for next submission
        setChinError('Chin Normal');
        setPositionError('Position Normal');
        setHeadTilt('No Tilt');
        setHeadRotation('No Rotation');
        setTongueError('Tongue Properly Positioned');
        setSlumpedPosition('Upright');
        setMovementError('No Movement');
        setBiteblockError('Biteblock Present');
        
        // Refresh the feedback list
        loadFeedbackList();
      } else {
        setSubmitResult({
          success: false,
          message: result.error || 'Failed to submit feedback. Please try again.'
        });
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      setSubmitResult({
        success: false,
        message: err instanceof Error ? err.message : 'An error occurred. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Feedback Center"
        subtitle="Submit and view feedback to help us improve our detection."
      />
      
      {/* Tab Navigation */}
      <div className="bg-white border-b border-violet-200 px-4">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2
              ${activeTab === 'submit' 
                ? 'border-violet-500 text-violet-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('submit')}
          >            <FaPaperPlane size={14} className="mr-2" />
            <span>Submit Feedback</span>
          </button>
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2
              ${activeTab === 'view' 
                ? 'border-violet-500 text-violet-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('view')}
          >            <FaList size={14} className="mr-2" />
            <span>View All Feedback</span>
          </button>
        </nav>
      </div>
      
      <div className="flex flex-col flex-1 p-4">
        {activeTab === 'submit' ? (
          <>
            {showThankYouPage ? (
              <div className="bg-white p-8 rounded-lg shadow-sm max-w-2xl mx-auto text-center">
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank you for your feedback!</h3>
                <p className="text-gray-600 mb-6">Your feedback helps us improve our image error detection system.</p>
                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 justify-center">
                  <Button onClick={handleStartNewFeedback} className="justify-center">
                    Submit New Feedback
                  </Button>
                  <Button 
                    onClick={() => setActiveTab('view')} 
                    className="justify-center bg-violet-100 text-violet-700 hover:bg-violet-200"
                  >
                    View All Feedback
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row gap-4 flex-1 bg-violet-200 rounded-lg p-4 custom-scrollbar overflow-auto">
                {/* Personal Info */}
                <div className="flex-1">
                  <div className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-medium text-gray-800 mb-4">Submit Feedback</h3>
                    
                    {/* Image Upload */}
                    <div className="mb-5">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Upload Image</h4>
                      <UploadBox onFileSelect={handleFileSelect} selectedFile={uploadedFile} />
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-4 py-2 px-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                        Image uploaded: {uploadedFile.name}
                      </div>
                    )}
                    
                    {/* Added mt-6 for more significant spacing before form fields */}
                    <div className="mt-6">
                      <InputField
                        label="Full Name"
                        value={name}
                        onChange={setName}
                        placeholder="Enter your full name"
                      />
                      
                      <div className="mt-4">
                        <InputField
                          label="Email"
                          value={email}
                          onChange={setEmail}
                          placeholder="Enter your email address"
                          type="email"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <InputField
                          label="Phone"
                          value={phone}
                          onChange={setPhone}
                          placeholder="Enter your phone number"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <InputField
                          label="Country"
                          value={country}
                          onChange={setCountry}
                          placeholder="Enter your country"
                        />
                      </div>
                      
                      <div className="mt-4">
                        <InputField
                          label="Organization"
                          value={organization}
                          onChange={setOrganization}
                          placeholder="Enter your organization"
                        />
                      </div>
                    </div>
                    
                    {uploadedFile && (
                      <div className="mt-5">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Comments</h4>
                        <textarea
                          value={extraFeedback}
                          onChange={e => setExtraFeedback(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                          placeholder="Any additional comments about this image..."
                          rows={4}
                        ></textarea>
                      </div>
                    )}
                    
                    {submitResult && !submitResult.success && (
                      <div className="mt-4 bg-red-50 border border-red-200 text-red-700 rounded-md p-3 text-sm">
                        {submitResult.message}
                      </div>
                    )}
                      <div className="mt-8">
                      <Button
                        onClick={handleSubmit}
                        disabled={!uploadedFile || isSubmitting}
                        className="w-full justify-center flex items-center py-3"
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="animate-spin mr-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="mr-2" />
                            Submit Feedback
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Error Selections */}
                {uploadedFile && (
                  <div className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm p-4 h-full">
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Select Errors in Image</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Please select any errors present in the uploaded image to help us improve our detection algorithm.
                      </p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <ErrorCategory
                          title="Chin Position"
                          options={['Chin Normal', 'Chin Too High', 'Chin Too Low']}
                          value={chinError}
                          onChange={setChinError}
                        />
                        
                        <ErrorCategory
                          title="Head Position"
                          options={['Position Normal', 'Too Far Forward', 'Too Far Back']}
                          value={positionError}
                          onChange={setPositionError}
                        />
                        
                        <ErrorCategory
                          title="Head Tilt"
                          options={['No Tilt', 'Tilted']}
                          value={headTilt}
                          onChange={setHeadTilt}
                        />
                        
                        <ErrorCategory
                          title="Head Rotation"
                          options={['No Rotation', 'Rotated']}
                          value={headRotation}
                          onChange={setHeadRotation}
                        />
                        
                        <ErrorCategory
                          title="Tongue Position"
                          options={['Tongue Properly Positioned', 'Tongue Visible', 'Tongue Against Teeth']}
                          value={tongueError}
                          onChange={setTongueError}
                        />
                        
                        <ErrorCategory
                          title="Posture"
                          options={['Upright', 'Slumped']}
                          value={slumpedPosition}
                          onChange={setSlumpedPosition}
                        />
                        
                        <ErrorCategory
                          title="Movement"
                          options={['No Movement', 'Movement Detected']}
                          value={movementError}
                          onChange={setMovementError}
                        />
                        
                        <ErrorCategory
                          title="Biteblock"
                          options={['Biteblock Present', 'Biteblock Missing']}
                          value={biteblockError}
                          onChange={setBiteblockError}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          /* View All Feedback Tab */
          <div className="flex flex-col flex-1 bg-white rounded-lg shadow-sm border border-gray-200 custom-scrollbar overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">Feedback Submissions</h2>
              
              <button 
                onClick={exportFeedback}
                disabled={exportStatus.loading || feedbackList.length === 0}
                className={`flex items-center px-3 py-1.5 rounded text-sm 
                  ${exportStatus.loading || feedbackList.length === 0
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-violet-100 text-violet-700 hover:bg-violet-200'}`}
              >
                {exportStatus.loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" size={14} />
                    Exporting...
                  </>
                ) : (
                  <>
                    <FaFileDownload className="mr-1.5" size={14} />
                    Export All
                  </>
                )}
              </button>
            </div>
            
            {/* Export status message */}
            {exportStatus.message && (
              <div className={`mx-4 mt-2 p-2 text-sm rounded-md ${exportStatus.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {exportStatus.message}
              </div>
            )}
            
            {/* Content area */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left sidebar - list of feedback */}
              <div className="w-1/3 border-r border-gray-200 overflow-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center h-60">
                    <FaSpinner className="animate-spin text-violet-600" size={24} />
                    <span className="ml-2 text-violet-600">Loading feedback...</span>
                  </div>
                ) : feedbackList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-60 text-gray-500">
                    <FaList className="mb-2" size={24} />
                    <p className="text-center">No feedback submissions yet</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {feedbackList.map(feedback => (                      <li 
                        key={feedback.id}
                        className={`cursor-pointer transition-colors ${selectedFeedback?.id === feedback.id ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                        onClick={async () => {
                          // Select the feedback item
                          setSelectedFeedback(feedback);
                          
                          // Always attempt to load the image when clicked
                          if (!feedback.imageData) {
                            await loadFeedbackImage(feedback);
                          }
                        }}
                      >
                        <div className="px-4 py-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-800">Feedback #{feedback.id}</span>
                            <span className="text-xs text-gray-500">{formatDate(feedback.timestamp)}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            Rating: {feedback.accuracyRating}/5
                          </div>
                          <div className="mt-1 text-xs text-gray-500 line-clamp-1">
                            {feedback.errorTypes.length} reported errors
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Feedback details */}
              <div className="w-2/3 p-4 overflow-auto custom-scrollbar">
                {selectedFeedback ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Feedback Details</h3>
                    
                    {/* Image preview */}
                    <div className="mb-6 border border-gray-200 rounded bg-gray-50 p-2">
                      {loadingImage ? (
                        <div className="flex flex-col items-center justify-center h-48">
                          <FaSpinner className="animate-spin text-violet-600 mb-2" size={24} />
                          <span className="text-violet-600">Loading image...</span>
                        </div>
                      ) : selectedFeedback.imageData ? (
                        <img 
                          src={selectedFeedback.imageData} 
                          alt="Feedback" 
                          className="max-h-80 mx-auto object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center h-48">
                          <FaImage className="text-gray-400 mb-2" size={48} />
                          <span className="text-gray-500">Image not available</span>                          <button
                            className="mt-2 text-xs bg-violet-100 text-violet-700 px-2 py-1 rounded"                            onClick={refreshCurrentImage}
                          >
                            Load image
                          </button>
                          <div className="text-xs text-gray-500 mt-1">Path: {selectedFeedback.imagePath}</div>
                        </div>
                      )}
                    </div>
                    
                    {/* Feedback details */}
                    <div className="grid grid-cols-2 gap-4 text-slate-800">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Date</h4>
                        <p>{formatDate(selectedFeedback.timestamp)}</p>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Rating</h4>
                        <p>{selectedFeedback.accuracyRating}/5 stars</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="font-medium text-violet-800 mb-2">Reported Errors</h4>
                      {selectedFeedback.errorTypes.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-1">
                          {selectedFeedback.errorTypes.map((error, index) => (
                            <li key={index} className="text-sm text-gray-700">
                              {error}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-600">No errors reported</p>
                      )}
                    </div>
                    
                    {selectedFeedback.extraFeedback && (
                      <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Additional Feedback</h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{selectedFeedback.extraFeedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>Select a feedback item to view details</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
