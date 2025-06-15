import { useState } from 'react';
import UploadBox from '../components/UploadBox';
import ErrorCard from '../components/ErrorCard';
import Header from '../components/Header';
import {
  FaArrowsAltH, FaSyncAlt, FaUserSlash,
  FaRunning, FaTooth
} from 'react-icons/fa';
import { GiBeard, GiTongue  } from "react-icons/gi";
import { BsPersonStanding } from "react-icons/bs";

// Define response type from the IPC channel
type InferenceResponse = {
  success: boolean;
  predictions?: Record<string, number>;
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

const detectionErrors = [
  {
    icon: <GiBeard  />,
    title: 'Chin Position Error',
    description: 'Chin tipped too high or low, causing distortion.',
    keys: ['chin_high', 'chin_low'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions) return '';
      if (predictions.chin_high && predictions.chin_high > ERROR_THRESHOLD) {
        return `Chin too high detected (${(predictions.chin_high * 100).toFixed(1)}%)`;
      } else if (predictions.chin_low && predictions.chin_low > ERROR_THRESHOLD) {
        return `Chin too low detected (${(predictions.chin_low * 100).toFixed(1)}%)`;
      }
      return 'No chin position errors detected';
    }
  },
  {
    icon: <BsPersonStanding />,
    title: 'Patient Position Error',
    description: 'Patient moved too far forward or backward, causing image distortion.',
    keys: ['pos_forward', 'pos_backward'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions) return '';
      if (predictions.pos_forward && predictions.pos_forward > ERROR_THRESHOLD) {
        return `Position too far forward (${(predictions.pos_forward * 100).toFixed(1)}%)`;
      } else if (predictions.pos_backward && predictions.pos_backward > ERROR_THRESHOLD) {
        return `Position too far backward (${(predictions.pos_backward * 100).toFixed(1)}%)`;
      }
      return 'No positioning errors detected';
    }
  },
  {
    icon: <FaSyncAlt />,
    title: 'Head Tilt',
    description: 'Head is tilted to one side, causing asymmetry.',
    keys: ['head_tilt'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.head_tilt) return '';
      if (predictions.head_tilt > ERROR_THRESHOLD) {
        return `Head tilt detected (${(predictions.head_tilt * 100).toFixed(1)}%)`;
      }
      return 'No head tilt detected';
    }
  },
  {
    icon: <FaArrowsAltH />,
    title: 'Head Rotation',
    description: 'Head is rotated to one side, causing unequal image size.',
    keys: ['head_rotate'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.head_rotate) return '';
      if (predictions.head_rotate > ERROR_THRESHOLD) {
        return `Head rotation detected (${(predictions.head_rotate * 100).toFixed(1)}%)`;
      }
      return 'No head rotation detected';
    }
  },
  {
    icon: <GiTongue />,
    title: 'Tongue Position',
    description: 'Tongue not against the palate, causing dark shadows.',
    keys: ['tongue_fail'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.tongue_fail) return '';
      if (predictions.tongue_fail > ERROR_THRESHOLD) {
        return `Tongue not against palate (${(predictions.tongue_fail * 100).toFixed(1)}%)`;
      }
      return 'Proper tongue position';
    }
  },
  {
    icon: <FaUserSlash />,
    title: 'Slumped Position',
    description: 'Patient not upright, causing overlap and distortion.',
    keys: ['slumped_pos'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.slumped_pos) return '';
      if (predictions.slumped_pos > ERROR_THRESHOLD) {
        return `Slumped posture detected (${(predictions.slumped_pos * 100).toFixed(1)}%)`;
      }
      return 'Proper upright position';
    }
  },
  {
    icon: <FaRunning />,
    title: 'Patient Movement',
    description: 'Movement during exposure causing blur.',
    keys: ['movement'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.movement) return '';
      if (predictions.movement > ERROR_THRESHOLD) {
        return `Movement detected (${(predictions.movement * 100).toFixed(1)}%)`;
      }
      return 'No movement detected';
    }
  },
  {
    icon: <FaTooth />,
    title: 'No Bite Block',
    description: 'Missing bite block, causing misalignment.',
    keys: ['no_bite_block'],
    getMessage: (predictions: ErrorPredictions) => {
      if (!predictions || !predictions.no_bite_block) return '';
      if (predictions.no_bite_block > ERROR_THRESHOLD) {
        return `Missing bite block (${(predictions.no_bite_block * 100).toFixed(1)}%)`;
      }
      return 'Bite block properly used';
    }
  },
];

export default function DetectionPage() {
  const [predictions, setPredictions] = useState<ErrorPredictions | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleInferenceResult = async (file: { name: string; data: string }) => {
    try {
      setIsLoading(true);
      setError(null);
      
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

  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Positioning Error Detection"
        subtitle="Identify and understand common positioning issues in your dental panoramic radiographs."
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-8 flex-1">
        <div className="flex flex-col">
          <UploadBox usage="inference" onFileSelect={handleInferenceResult} />
          {isLoading && (
            <div className="mt-3 text-center py-4 bg-violet-100 rounded animate-pulse">
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
            <div className="mt-3 text-center py-4 bg-red-100 rounded">
              <p className="text-red-700 font-medium">{error}</p>
              <p className="text-red-600 text-sm mt-1">Please try again or use a different image</p>
            </div>
          )}
        </div>
        <section className="flex-1 flex flex-col gap-2 w-full">
          {detectionErrors.map((error) => (
            <ErrorCard
              key={error.title}
              icon={error.icon}
              title={error.title}
              description={predictions ? error.getMessage(predictions) : error.description}
              isDetected={predictions ? isErrorDetected(error.keys, predictions) : false}
            />
          ))}
          {predictions && (
            <div className="mt-4 p-3 bg-slate-100 rounded text-sm text-slate-600">
              <p>Results based on analysis of the uploaded image. Consult with a dental professional for confirmation.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}