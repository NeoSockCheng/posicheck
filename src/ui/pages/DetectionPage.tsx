import { useState } from 'react';
import UploadBox from '../components/UploadBox';
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
  imagePath?: string;  // Updated to return image path instead of historyId
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
      if (predictions.chin_high && predictions.chin_high > ERROR_THRESHOLD) {
        return `Chin too high detected - Confidence: ${(predictions.chin_high * 100).toFixed(1)}%`;
      } else if (predictions.chin_low && predictions.chin_low > ERROR_THRESHOLD) {
        return `Chin too low detected - Confidence: ${(predictions.chin_low * 100).toFixed(1)}%`;
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
      if (predictions.pos_forward && predictions.pos_forward > ERROR_THRESHOLD) {
        return `Position too far forward - Confidence: ${(predictions.pos_forward * 100).toFixed(1)}%`;
      } else if (predictions.pos_backward && predictions.pos_backward > ERROR_THRESHOLD) {
        return `Position too far backward - Confidence: ${(predictions.pos_backward * 100).toFixed(1)}%`;
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

export default function DetectionPage() {
  const [predictions, setPredictions] = useState<ErrorPredictions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideo, setCurrentVideo] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);  const handleInferenceResult = async (file: { name: string; data: string }) => {
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
            <UploadBox usage="inference" onFileSelect={handleInferenceResult} />
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
                    videoId={isDetected ? error.videoId : undefined}
                    correctiveAction={isDetected && detectedKey && error.correctiveAction ? error.correctiveAction[detectedKey as keyof typeof error.correctiveAction] : undefined}
                    onPlayVideo={handlePlayVideo}
                  />
                )
              };
            })
            .sort((a, b) => {
              // Sort detected errors to the top
              if (a.isDetected && !b.isDetected) return -1;
              if (!a.isDetected && b.isDetected) return 1;
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
    </div>
  );
}