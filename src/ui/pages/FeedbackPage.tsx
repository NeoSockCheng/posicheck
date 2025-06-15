import { useState } from 'react';
import Button from '../components/Button';
import InputField from '../components/InputField';
import ErrorCategory from '../components/ErrorCategory';
import Header from '../components/Header';
import UploadBox from '../components/UploadBox';

export default function FeedbackPage() {
  // User info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [extraFeedback, setExtraFeedback] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{name: string; data: string} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{success: boolean; message: string} | null>(null);

  // Error selections
  const [chinError, setChinError] = useState('Chin Normal');
  const [positionError, setPositionError] = useState('Position Normal');
  const [headTilt, setHeadTilt] = useState('No Tilt');
  const [headRotation, setHeadRotation] = useState('No Rotation');
  const [tongueError, setTongueError] = useState('Tongue Properly Positioned');
  const [slumpedPosition, setSlumpedPosition] = useState('Upright');
  const [movementError, setMovementError] = useState('No Movement');
  const [biteblockError, setBiteblockError] = useState('Biteblock Present');

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
    
    const feedbackData = {
      name,
      email,
      phone,
      country,
      extraFeedback,
      chinError,
      positionError,
      headTilt,
      headRotation,
      tongueError,
      slumpedPosition,
      movementError,
      biteblockError,
    };
    
    try {
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
        title="Submit Your Feedback"
        subtitle="Help us improve our error detection by providing your feedback."
      />

      <div className="flex flex-col flex-1 p-4">
        <div className="flex flex-col lg:flex-row gap-4 flex-1 bg-violet-200 rounded-lg p-4">
          {/* Personal Info */}
          <div className="flex-1">
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
              label="Extra Feedback"
              value={extraFeedback}
              onChange={setExtraFeedback}
              textarea
            />
          </div>

          {/* Wrong Detection Report */}
          <div className="flex-1 flex flex-col gap-4">
            <UploadBox usage="feedback" onFileSelect={handleFileSelect} />
            
            {uploadedFile && (
              <div className="py-2 px-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                Image uploaded: {uploadedFile.name}
              </div>
            )}

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
      </div>
    </div>
  );
}
