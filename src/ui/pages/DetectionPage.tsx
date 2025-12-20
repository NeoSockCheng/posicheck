import { useState, useRef } from 'react';
import UploadBox from '../components/UploadBox';
import type { UploadBoxHandle } from '../components/UploadBox';
import ErrorCard from '../components/ErrorCard';
import Header from '../components/Header';
import {
  FaArrowsAltH, FaSyncAlt, FaUserSlash,
  FaRunning, FaTooth, FaTimes, FaSave
} from 'react-icons/fa';
import { GiBeard, GiTongue  } from "react-icons/gi";
import { BsPersonStanding } from "react-icons/bs";

// Define response type from the IPC channel
type InferenceResponse = {
  success: boolean;
  predictions?: Record<string, number>;
  imagePath?: string;  // Path to saved image
  imageBase64?: string; // Converted image for DICOM display
  error?: string;
};

// Define error types mapping
type ErrorPredictions = {
  chin_high?: number;
  chin_low?: number;
  pos_forward?: number;
  pos_backward?: number;
  head_tilt?: number;
  head_rotate?: number;
  tongue_fail?: number;
  slumped_pos?: number;
  movement?: number;
  no_bite_block?: number;
};

// Error threshold for highlighting
const ERROR_THRESHOLD = 0.5;

// Feature flag to enable/disable video tutorials
const ENABLE_VIDEO_TUTORIALS = false;

const detectionErrors = [  {
    icon: <GiBeard  />,
    title: 'Chin Position Error',
    description: 'Chin tipped too high or low, causing distortion.',
    keys: ['chin_high', 'chin_low'],
    videoId: 'chin_position',
    correctiveAction: {
      chin_high: 'Lower the patient\'s chin to align with the occlusal plane. The chin should be parallel to the floor.',
      chin_low: 'Raise the patient\'s chin slightly to align with the occlusal plane. Position should be natural and comfortable.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions) return '';
      const highVal = predictions.chin_high || 0;
      const lowVal = predictions.chin_low || 0;
      
      // Both exceed threshold - show the higher one
      if (highVal > ERROR_THRESHOLD && lowVal > ERROR_THRESHOLD) {
        if (highVal >= lowVal) {
          return `Chin too high detected - Confidence: ${(highVal * 100).toFixed(1)}%`;
        } else {
          return `Chin too low detected - Confidence: ${(lowVal * 100).toFixed(1)}%`;
        }
      }
      // Only one exceeds threshold
      if (highVal > ERROR_THRESHOLD) {
        return `Chin too high detected - Confidence: ${(highVal * 100).toFixed(1)}%`;
      }
      if (lowVal > ERROR_THRESHOLD) {
        return `Chin too low detected - Confidence: ${(lowVal * 100).toFixed(1)}%`;
      }
      return 'No chin position errors detected';
    }
  },  {
    icon: <BsPersonStanding />,
    title: 'Patient Position Error',
    description: 'Patient moved too far forward or backward, causing image distortion.',
    keys: ['pos_forward', 'pos_backward'],
    videoId: 'patient_position',
    correctiveAction: {
      pos_forward: 'Ask the patient to step back slightly so the spine aligns with the designated mark on the floor. Maintain proper posture.',
      pos_backward: 'Ask the patient to step forward slightly to reach the optimal position. Follow the positioning guides.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions) return '';
      const forwardVal = predictions.pos_forward || 0;
      const backwardVal = predictions.pos_backward || 0;
      
      // Both exceed threshold - show the higher one
      if (forwardVal > ERROR_THRESHOLD && backwardVal > ERROR_THRESHOLD) {
        if (forwardVal >= backwardVal) {
          return `Position too far forward - Confidence: ${(forwardVal * 100).toFixed(1)}%`;
        } else {
          return `Position too far backward - Confidence: ${(backwardVal * 100).toFixed(1)}%`;
        }
      }
      // Only one exceeds threshold
      if (forwardVal > ERROR_THRESHOLD) {
        return `Position too far forward - Confidence: ${(forwardVal * 100).toFixed(1)}%`;
      }
      if (backwardVal > ERROR_THRESHOLD) {
        return `Position too far backward - Confidence: ${(backwardVal * 100).toFixed(1)}%`;
      }
      return 'No positioning errors detected';
    }
  },  {
    icon: <FaSyncAlt />,
    title: 'Head Tilt',
    description: 'Head is tilted to one side, causing asymmetry.',
    keys: ['head_tilt'],
    videoId: 'head_tilt',
    correctiveAction: {
      head_tilt: 'Ensure the patient keeps their head level with the horizon. Align the patient\'s eyes with the horizontal guide lines provided by the machine.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.head_tilt) return '';
      if (predictions.head_tilt > ERROR_THRESHOLD) {
        return `Head tilt detected - Confidence: ${(predictions.head_tilt * 100).toFixed(1)}%`;
      }
      return 'No head tilt detected';
    }
  },  {
    icon: <FaArrowsAltH />,
    title: 'Head Rotation',
    description: 'Head is rotated to one side, causing unequal image size.',
    keys: ['head_rotate'],
    videoId: 'head_rotation',
    correctiveAction: {
      head_rotate: 'Position the patient to face directly forward, keeping their eyes level with the horizon. Use the laser guides to properly align the patient\'s head.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.head_rotate) return '';
      if (predictions.head_rotate > ERROR_THRESHOLD) {
        return `Head rotation detected - Confidence: ${(predictions.head_rotate * 100).toFixed(1)}%`;
      }
      return 'No head rotation detected';
    }
  },  {
    icon: <GiTongue />,
    title: 'Tongue Position',
    description: 'Tongue not against the palate, causing dark shadows.',
    keys: ['tongue_fail'],
    videoId: 'tongue_position',
    correctiveAction: {
      tongue_fail: 'Instruct the patient to press their tongue firmly against the roof of their mouth (palate). This eliminates air spaces and reduces shadows in the image.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.tongue_fail) return '';
      if (predictions.tongue_fail > ERROR_THRESHOLD) {
        return `Tongue not against palate - Confidence: ${(predictions.tongue_fail * 100).toFixed(1)}%`;
      }
      return 'Proper tongue position';
    }
  },  {
    icon: <FaUserSlash />,
    title: 'Slumped Position',
    description: 'Patient not upright, causing overlap and distortion.',
    keys: ['slumped_pos'],
    videoId: 'slumped_position',
    correctiveAction: {
      slumped_pos: 'Ask the patient to stand upright with shoulders back and spine straight. Suggest imagining a string pulling up from the top of their head.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.slumped_pos) return '';
      if (predictions.slumped_pos > ERROR_THRESHOLD) {
        return `Slumped posture detected - Confidence: ${(predictions.slumped_pos * 100).toFixed(1)}%`;
      }
      return 'Proper upright position';
    }
  },  {
    icon: <FaRunning />,
    title: 'Patient Movement',
    description: 'Movement during exposure causing blur.',
    keys: ['movement'],
    videoId: 'patient_movement',
    correctiveAction: {
      movement: 'Instruct the patient to remain completely still during the entire scan. Ask them to hold their breath when instructed but avoid swallowing or moving any part of their body.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.movement) return '';
      if (predictions.movement > ERROR_THRESHOLD) {
        return `Movement detected - Confidence: ${(predictions.movement * 100).toFixed(1)}%`;
      }
      return 'No movement detected';
    }
  },  {
    icon: <FaTooth />,
    title: 'No Bite Block',
    description: 'Missing bite block, causing misalignment.',
    keys: ['no_bite_block'],
    videoId: 'bite_block',
    correctiveAction: {
      no_bite_block: 'Guide the patient to place their teeth in the designated grooves of the bite block. This ensures proper alignment of their dental arches in the final image.'
    },
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.no_bite_block) return '';
      if (predictions.no_bite_block > ERROR_THRESHOLD) {
        return `Missing bite block - Confidence: ${(predictions.no_bite_block * 100).toFixed(1)}%`;
      }
      return 'Bite block properly used';
    }
  },
];

type DetectionPageProps = {
  onSendToFeedback?: (data: { imageData: string; imagePath: string; detectedErrors: string[] }) => void;
};

export default function DetectionPage({ onSendToFeedback }: DetectionPageProps) {
  const [predictions, setPredictions] = useState<ErrorPredictions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const uploadBoxRef = useRef<UploadBoxHandle>(null);

  const handleInferenceResult = async (file: { name: string; data: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      setSaveSuccess(null);
      
      console.log('Sending file for inference:', file.name);
      
      // Create a timeout promise
      const timeout = new Promise<null>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout: Backend did not respond within 30 seconds')), 30000);
      });
      
      // Race between the actual call and the timeout
      const result = await Promise.race([
        window.electron.sendFileForInference(file),
        timeout
      ]) as InferenceResponse | null;
      
      console.log('Inference result:', result);
      
      if (!result) {
        console.error('Inference result is undefined');
        setError('Failed to process image. No response from backend.');
        return;
      }
      
      if (result.success && result.predictions) {
        console.log('Predictions received:', result.predictions);
        setPredictions(result.predictions);
        setImagePath(result.imagePath || null);
        // Use converted base64 for DICOM display
        const displayImage = result.imageBase64 || file.data;
        setImageData(displayImage);
        
        // Update the upload box preview with converted image for DICOM files
        if (result.imageBase64 && uploadBoxRef.current) {
          uploadBoxRef.current.updatePreview(result.imageBase64, file.name);
        }
      } else {
        console.error('Inference failed:', result.error);
        setError(result.error || 'Failed to process image');
      }
    } catch (err) {
      console.error('Inference error:', err);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Error processing image. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isErrorDetected = (keys: string[], preds: ErrorPredictions) => {
    if (!preds) return false;
    return keys.some(key => preds[key as keyof ErrorPredictions] && preds[key as keyof ErrorPredictions]! > ERROR_THRESHOLD);
  };
  
  const getDetectedErrorKey = (keys: string[], preds: ErrorPredictions) => {
    if (!preds) return null;
    return keys.find(key => preds[key as keyof ErrorPredictions] && preds[key as keyof ErrorPredictions]! > ERROR_THRESHOLD) || null;
  };
  
  const handlePlayVideo = (videoId: string) => {
    setCurrentVideo(videoId);
  };
  
  const closeVideoModal = () => {
    setCurrentVideo(null);
  };

  const handleSaveToHistory = async () => {
    if (!predictions || !imagePath) {
      setError('No detection results to save');
      return;
    }

    try {
      setIsSaving(true);
      setSaveSuccess(null);

      const response = await window.electron.saveToHistory({
        imagePath,
        predictions,
        notes: notes.trim() || undefined
      });

      if (response.success) {
        setSaveSuccess(true);
        console.log('Detection saved to history with ID:', response.historyId);
      } else {
        setSaveSuccess(false);
        setError(response.error || 'Failed to save to history');
      }
    } catch (err) {
      console.error('Error saving to history:', err);
      setSaveSuccess(false);
      if (err instanceof Error) {
        setError(`Error: ${err.message}`);
      } else {
        setError('Error saving detection. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendToFeedback = () => {
    if (!predictions || !imageData || !imagePath || !onSendToFeedback) return;
    
    // Get all detected error keys
    const detectedErrors: string[] = [];
    detectionErrors.forEach(errorConfig => {
      const errorKey = getDetectedErrorKey(errorConfig.keys, predictions);
      if (errorKey) {
        detectedErrors.push(errorKey);
      }
    });
    
    onSendToFeedback({
      imageData,
      imagePath,
      detectedErrors
    });
  };

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Positioning Error Detection"
        subtitle="Identify and understand common patient positioning issues in dental panoramic radiographs."
      />

      {/* Main Content */}      <div className="flex flex-col gap-4 p-8 flex-1">
        {/* Upload and Save History Section - Now side by side on top */}
        <div className="flex flex-col lg:flex-row gap-6 w-full">
          {/* Upload box - Full width when no results, half width when results are showing */}
          <div className={`flex flex-col items-center lg:items-start w-full ${predictions && imagePath ? 'lg:w-1/2' : 'w-full'}`}>
            <UploadBox ref={uploadBoxRef} usage="inference" onFileSelect={handleInferenceResult} />
            {isLoading && (
              <div className="mt-3 text-center py-4 bg-violet-100 rounded animate-pulse w-full">
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5 text-violet-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-violet-700 font-medium">Processing image...</p>
                </div>
                <p className="text-violet-600 text-sm mt-2">This may take a few seconds</p>
              </div>
            )}
            {error && (
              <div className="mt-3 text-center py-4 bg-red-100 rounded w-full">
                <p className="text-red-700 font-medium">{error}</p>
                <p className="text-red-600 text-sm mt-1">Please try again or use a different image</p>
              </div>
            )}
            
            {/* Image action buttons - expand, re-upload, remove */}
            {imagePath && predictions && (
              <div className="mt-3 flex gap-2 justify-center">
                {/* Expand/View Full Size */}
                <button
                  onClick={() => setShowImageModal(true)}
                  className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                  title="View Full Size"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                  </svg>
                </button>
                
                {/* Re-upload New Image */}
                <button
                  onClick={() => {
                    // Reset state and trigger file input
                    setPredictions(null);
                    setImagePath(null);
                    setImageData(null);
                    setNotes('');
                    setSaveSuccess(null);
                    setError(null);
                    uploadBoxRef.current?.clearPreview();
                    // Small delay to ensure state is cleared before triggering upload
                    setTimeout(() => uploadBoxRef.current?.triggerUpload(), 50);
                  }}
                  className="p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-200 transition-colors"
                  title="Upload New Image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </button>
                
                {/* Remove/Clear Image */}
                <button
                  onClick={() => {
                    setPredictions(null);
                    setImagePath(null);
                    setImageData(null);
                    setNotes('');
                    setSaveSuccess(null);
                    setError(null);
                    uploadBoxRef.current?.clearPreview();
                  }}
                  className="p-2 bg-red-50 border border-red-200 rounded-md text-red-600 hover:bg-red-100 transition-colors"
                  title="Remove Image"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </button>
                
                {/* Send to Feedback */}
                <button
                  onClick={handleSendToFeedback}
                  className="px-4 py-2 bg-blue-600 border border-blue-700 rounded-md text-white hover:bg-blue-700 transition-colors font-medium text-sm"
                  title="Send to Feedback"
                >
                  <div className="flex items-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    Send to Feedback
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Save to history section - Appears to the right of the upload box when there are results */}
          {predictions && imagePath && (
            <div className="w-full lg:w-1/2 bg-violet-50 border border-violet-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-violet-800 mb-2">Save to History</h3>
              
              <div className="mb-3">
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes about this detection..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-violet-500 focus:border-violet-500 sm:text-sm text-slate-700"
                  rows={3}
                />
              </div>
              
              <button
                onClick={handleSaveToHistory}
                disabled={isSaving || saveSuccess === true}
                className={`flex items-center justify-center w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${saveSuccess === true 
                    ? 'bg-green-600 hover:bg-green-700' 
                    : 'bg-violet-600 hover:bg-violet-700'} 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition-colors`}
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : saveSuccess === true ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Saved to History
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    Save to History
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Error Cards Section - Now below upload and save */}
        <section className="w-full flex flex-col gap-2">
          {/* Sort errors so that detected ones appear at the top */}
          {detectionErrors
            .map((error) => {
              const isDetected = predictions ? isErrorDetected(error.keys, predictions) : false;
              const detectedKey = predictions ? getDetectedErrorKey(error.keys, predictions) : null;
              
              return {
                error,
                isDetected,
                detectedKey,
                component: (
                  <ErrorCard
                    key={error.title}
                    icon={error.icon}
                    title={error.title}
                    description={predictions ? error.getMessage(predictions) : error.description}
                    isDetected={isDetected}
                    videoId={ENABLE_VIDEO_TUTORIALS && isDetected ? error.videoId : undefined}
                    correctiveAction={isDetected && detectedKey && error.correctiveAction ? error.correctiveAction[detectedKey as keyof typeof error.correctiveAction] : undefined}
                    onPlayVideo={handlePlayVideo}
                  />
                )
              };
            })
            .sort((a, b) => {
              // Sort detected errors to the top, then by confidence (highest first)
              if (a.isDetected && !b.isDetected) return -1;
              if (!a.isDetected && b.isDetected) return 1;
              
              // If both are detected, sort by confidence (highest first)
              if (a.isDetected && b.isDetected && predictions) {
                // Get the max confidence for each error from their keys
                const getMaxConfidence = (keys: string[]) => {
                  return Math.max(...keys.map(key => predictions[key as keyof typeof predictions] || 0));
                };
                const aConfidence = getMaxConfidence(a.error.keys);
                const bConfidence = getMaxConfidence(b.error.keys);
                return bConfidence - aConfidence; // Descending order
              }
              
              return 0;
            })
            .map(item => (
              <div key={item.error.title}>
                {item.component}
              </div>
            ))
          }
          {predictions && (
            <div className="mt-2 p-3 bg-slate-100 rounded text-sm text-slate-600">
              <p>Results based on analysis of the uploaded image. Use this information to guide patient positioning for optimal imaging results.</p>
            </div>
          )}
        </section>
      </div>
      
      {/* Video Tutorial Modal */}
      {currentVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full">
            <div className="flex justify-between items-center px-6 py-3 border-b">
              <h3 className="font-semibold text-lg">How to Guide: {detectionErrors.find(e => e.videoId === currentVideo)?.title}</h3>
              <button onClick={closeVideoModal} className="text-gray-500 hover:text-gray-800">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="aspect-video bg-black rounded flex items-center justify-center">
                {/* This would be replaced with an actual video player in production */}
                <div className="text-white text-center">
                  <div className="text-xl mb-2">Tutorial Video: {currentVideo}</div>
                  <div className="text-sm">Video player would be embedded here in production.</div>
                  <div className="text-xs mt-6 bg-violet-600 inline-block px-4 py-2 rounded">This is a placeholder for the actual video content</div>
                </div>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {detectionErrors.find(e => e.videoId === currentVideo)?.correctiveAction[
                  getDetectedErrorKey(
                    detectionErrors.find(e => e.videoId === currentVideo)?.keys || [], 
                    predictions || {}
                  ) as keyof typeof detectionErrors[0]['correctiveAction']
                ]}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Full-Screen Image Modal */}
      {showImageModal && imageData && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 p-4"
          onClick={() => setShowImageModal(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowImageModal(false);
            }}
            className="absolute top-4 right-4 z-10 cursor-pointer p-2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          <img 
            src={imageData}
            alt="Radiograph - Full Size"
            className="max-w-full max-h-screen object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}