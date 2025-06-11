import { useState } from 'react';
import { FaUpload } from 'react-icons/fa';
import InputField from '../components/InputField';
import ErrorCategory from '../components/ErrorCategory';

export default function FeedbackPage() {
  // User info
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [extraFeedback, setExtraFeedback] = useState('');

  // Error selections
  const [chinError, setChinError] = useState('Absence');
  const [tongueError, setTongueError] = useState('Absence');
  const [headTilt, setHeadTilt] = useState('Absence');
  const [headRotation, setHeadRotation] = useState('Absence');
  const [bodyPosition, setBodyPosition] = useState('Absence');

  const handleSubmit = () => {
    // Submit to backend later
    const feedbackData = {
      phone,
      country,
      extraFeedback,
      chinError,
      tongueError,
      headTilt,
      headRotation,
      bodyPosition,
    };
    console.log('Submit feedback:', feedbackData);
  };

  return (
    <div className="flex flex-col p-4 flex-1 bg-purple-50">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-purple-700">User Feedback</h1>

      <div className="flex flex-col lg:flex-row gap-4 flex-1 bg-purple-100 rounded-lg p-4">
        {/* Personal Info */}
        <div className="flex-1">
          <InputField label="Phone Number" value={phone} onChange={setPhone} />
          <InputField label="Country" value={country} onChange={setCountry} />
          <InputField label="Extra Feedback" value={extraFeedback} onChange={setExtraFeedback} textarea />
        </div>

        {/* Wrong Detection Report */}
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col items-center border-4 border-dashed border-purple-300 rounded-lg bg-purple-50 p-4">
            <FaUpload size={30} className="text-purple-600 mb-2" />
            <p className="text-purple-700 font-semibold text-sm text-center">Upload or Drag and Drop your Panoramic Radiographs</p>
            <p className="text-xs text-purple-400 mt-1">Max File Size: 20MB | Supported: .jpeg, .pdf</p>
          </div>

          <ErrorCategory
            title="Chin Positioning Error"
            options={['Absence', 'Too High', 'Too Low']}
            selected={chinError}
            onSelect={setChinError}
          />

          <ErrorCategory
            title="Tongue Positioning Error"
            options={['Absence', 'Presence']}
            selected={tongueError}
            onSelect={setTongueError}
          />

          <ErrorCategory
            title="Head Tilt Error"
            options={['Absence', 'Tilted Left', 'Tilted Right']}
            selected={headTilt}
            onSelect={setHeadTilt}
          />

          <ErrorCategory
            title="Head Rotation Error"
            options={['Absence', 'Rotated Left', 'Rotated Right']}
            selected={headRotation}
            onSelect={setHeadRotation}
          />

          <ErrorCategory
            title="Body Positioning Error"
            options={['Absence', 'Leaned Forward', 'Leaned Backward']}
            selected={bodyPosition}
            onSelect={setBodyPosition}
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded self-center"
      >
        Submit My Feedback
      </button>
    </div>
  );
}
