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
  
  // Load feedback list from database
  const loadFeedbackList = async () => {
    setIsLoading(true);
    try {
      // TODO: Create this IPC method
      // const result = await window.electron.getAllFeedback({ limit: 100 });
      // if (result.success && result.items) {
      //   setFeedbackList(result.items);
      // } else {
      //   console.error('Failed to load feedback items:', result.error);
      // }
      
      // Placeholder: TODO - Remove once IPC is implemented
      setFeedbackList([]);
    } catch (error) {
      console.error('Error loading feedback list:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load image for a feedback item
  const loadFeedbackImage = async (feedbackItem: FeedbackEntry) => {
    if (feedbackItem.imageData) return; // Already loaded
    
    setLoadingImage(true);
    try {
      // TODO: Create this IPC method
      // const result = await window.electron.getFeedbackImage({ 
      //   imagePath: feedbackItem.imagePath,
      //   quality: 90
      // });
      
      // if (result.success && result.base64Image) {
      //   // Update the feedback list with the loaded image
      //   setFeedbackList(prev => 
      //     prev.map(item => 
      //       item.id === feedbackItem.id 
      //         ? { ...item, imageData: result.base64Image }
      //         : item
      //     )
      //   );
      //   
      //   // Update selected feedback if this is the selected one
      //   if (selectedFeedback?.id === feedbackItem.id) {
      //     setSelectedFeedback({ ...feedbackItem, imageData: result.base64Image });
      //   }
      // }
    } catch (error) {
      console.error('Error loading feedback image:', error);
    } finally {
      setLoadingImage(false);
    }
  };
  
  // Export all feedback as CSV and images as ZIP
  const exportFeedback = async () => {
    setExportStatus({ loading: true });
    try {
      // TODO: Create this IPC method
      // const result = await window.electron.exportFeedback();
      // 
      // if (result.success) {
      //   setExportStatus({ 
      //     loading: false, 
      //     message: `Feedback exported successfully to: ${result.exportPath}` 
      //   });
      // } else {
      //   setExportStatus({ 
      //     loading: false, 
      //     message: result.error || 'Export failed', 
      //     error: true 
      //   });
      // }
      
      // Placeholder: TODO - Remove once IPC is implemented
      setTimeout(() => {
        setExportStatus({
          loading: false,
          message: "Export functionality will be implemented soon",
          error: true
        });
      }, 1000);
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
        setSubmitResult({
          success: true,
          message: 'Thank you for your feedback!'
        });
        // Reset form
        setExtraFeedback('');
        setUploadedFile(null);
        
        // Refresh the feedback list if we're using that tab
        if (activeTab === 'view') {
          loadFeedbackList();
        }
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
        subtitle="Submit and view feedback to help us improve our error detection."
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
          >
            <FaPaperPlane size={14} />
            <span>Submit Feedback</span>
          </button>
          <button
            className={`py-4 px-6 border-b-2 font-medium text-sm flex items-center space-x-2
              ${activeTab === 'view' 
                ? 'border-violet-500 text-violet-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            onClick={() => setActiveTab('view')}
          >
            <FaList size={14} />
            <span>View All Feedback</span>
          </button>
        </nav>
      </div>
      
      <div className="flex flex-col flex-1 p-4">
        {activeTab === 'submit' ? (
          <>
            <div className="flex flex-col lg:flex-row gap-4 flex-1 bg-violet-200 rounded-lg p-4 custom-scrollbar overflow-auto">
              {/* Personal Info */}
              <div className="flex-1">
                <UploadBox usage="feedback" onFileSelect={handleFileSelect} />
                
                {/* Added mt-4 for spacing below upload box */}
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
                  />

                  <InputField
                    label="Email"
                    value={email}
                    onChange={setEmail}
                  />

                  <InputField
                    label="Phone Number"
                    value={phone}
                    onChange={setPhone}
                  />
                  
                  <InputField
                    label="Country"
                    value={country}
                    onChange={setCountry}
                  />
                  
                  <InputField
                    label="Organization"
                    value={organization}
                    onChange={setOrganization}
                  />
                  
                  <InputField
                    label="Extra Feedback"
                    value={extraFeedback}
                    onChange={setExtraFeedback}
                    textarea
                  />
                </div>
              </div>

              {/* Wrong Detection Report */}
              <div className="flex-1 flex flex-col gap-4">
                <ErrorCategory
                  title="Chin Positioning Error"
                  options={['Chin Normal', 'Chin Too High', 'Chin Too Low']}
                  selected={chinError}
                  onSelect={setChinError}
                />

                <ErrorCategory
                  title="Patient Position Error"
                  options={['Position Normal', 'Too Far Forward', 'Too Far Backward']}
                  selected={positionError}
                  onSelect={setPositionError}
                />

                <ErrorCategory
                  title="Head Tilt Error"
                  options={['No Tilt', 'Tilted']}
                  selected={headTilt}
                  onSelect={setHeadTilt}
                />

                <ErrorCategory
                  title="Head Rotation Error"
                  options={['No Rotation', 'Rotated']}
                  selected={headRotation}
                  onSelect={setHeadRotation}
                />

                <ErrorCategory
                  title="Tongue Positioning Error"
                  options={['Tongue Properly Positioned', 'Tongue Not Against Palate']}
                  selected={tongueError}
                  onSelect={setTongueError}
                />

                <ErrorCategory
                  title="Slumped Positioning Error"
                  options={['Upright', 'Slumped']}
                  selected={slumpedPosition}
                  onSelect={setSlumpedPosition}
                />

                <ErrorCategory
                  title="Patient Movement Error"
                  options={['No Movement', 'Movement Detected']}
                  selected={movementError}
                  onSelect={setMovementError}
                />

                <ErrorCategory
                  title="Biteblock Usage"
                  options={['Biteblock Present', 'Biteblock Missing']}
                  selected={biteblockError}
                  onSelect={setBiteblockError}
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="mt-4 self-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit My Feedback'}
            </Button>

            {submitResult && (
              <div className={`mt-4 text-center ${submitResult.success ? 'text-green-600' : 'text-red-600'}`}>
                {submitResult.message}
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
                className="flex items-center gap-2 px-3 py-1.5 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded transition-colors"
                disabled={exportStatus.loading || feedbackList.length === 0}
              >
                {exportStatus.loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <FaFileDownload />
                    <span>Export All (CSV + Images)</span>
                  </>
                )}
              </button>
            </div>
            
            {exportStatus.message && (
              <div className={`px-4 py-2 text-sm ${exportStatus.error ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                {exportStatus.message}
              </div>
            )}
            
            {/* Feedback list and details */}
            <div className="flex flex-1 min-h-0">
              {/* Feedback list */}
              <div className="w-1/3 border-r border-gray-200 overflow-auto custom-scrollbar">
                {isLoading ? (
                  <div className="flex justify-center items-center h-32">
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
                    {feedbackList.map(feedback => (
                      <li 
                        key={feedback.id}
                        className={`cursor-pointer transition-colors ${selectedFeedback?.id === feedback.id ? 'bg-violet-50' : 'hover:bg-gray-50'}`}
                        onClick={() => {
                          setSelectedFeedback(feedback);
                          if (!feedback.imageData) {
                            loadFeedbackImage(feedback);
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
                          <span className="text-gray-500">Image not available</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Feedback details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Date</h4>
                        <p>{formatDate(selectedFeedback.timestamp)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Rating</h4>
                        <p>{selectedFeedback.accuracyRating}/5 stars</p>
                      </div>
                    </div>
                    
                    {/* Reported errors */}
                    <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                      <h4 className="font-medium text-violet-800 mb-2">Reported Errors</h4>
                      {selectedFeedback.errorTypes.length > 0 ? (
                        <ul className="list-disc pl-5">
                          {selectedFeedback.errorTypes.map((error, index) => (
                            <li key={index} className="text-gray-700">{error}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">No specific errors reported</p>
                      )}
                    </div>
                    
                    {/* Extra feedback */}
                    {selectedFeedback.extraFeedback && (
                      <div className="mt-4 bg-gray-50 p-3 rounded border border-gray-200">
                        <h4 className="font-medium text-violet-800 mb-2">Additional Comments</h4>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.extraFeedback}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p>Select a feedback entry to view details</p>
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
