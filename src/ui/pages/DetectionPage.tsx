import UploadBox from '../components/UploadBox';
import ErrorCard from '../components/ErrorCard';
import Header from '../components/Header';
import {
  FaArrowsAltH, FaSyncAlt, FaUserSlash,
  FaRunning, FaTooth
} from 'react-icons/fa';
import { GiBeard, GiTongue  } from "react-icons/gi";
import { BsPersonStanding } from "react-icons/bs";

const detectionErrors = [
  {
    icon: <GiBeard  />,
    title: 'Chin Position Error',
    description: 'Chin tipped too high or low, causing distortion.',
  },
  {
    icon: <BsPersonStanding />,
    title: 'Patient Position Error',
    description: 'Patient moved too far forward or backward, causing image distortion.',
  },
  {
    icon: <FaSyncAlt />,
    title: 'Head Tilt',
    description: 'Head is tilted to one side, causing asymmetry.',
  },
  {
    icon: <FaArrowsAltH />,
    title: 'Head Rotation',
    description: 'Head is rotated to one side, causing unequal image size.',
  },
  {
    icon: <GiTongue />,
    title: 'Tongue Position',
    description: 'Tongue not against the palate, causing dark shadows.',
  },
  {
    icon: <FaUserSlash />,
    title: 'Slumped Position',
    description: 'Patient not upright, causing overlap and distortion.',
  },
  {
    icon: <FaRunning />,
    title: 'Patient Movement',
    description: 'Movement during exposure causing blur.',
  },
  {
    icon: <FaTooth />,
    title: 'No Bite Block',
    description: 'Missing bite block, causing misalignment.',
  },
];

export default function DetectionPage() {
  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      <Header
        title="Positioning Error Detection"
        subtitle="Identify and understand common positioning issues in your dental panoramic radiographs."
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-8 flex-1">
        <UploadBox />
        <section className="flex-1 flex flex-col gap-2 w-full">
          {detectionErrors.map((error) => (
            <ErrorCard
              key={error.title}
              icon={error.icon}
              title={error.title}
              description={error.description}
            />
          ))}
        </section>
      </div>
    </div>
  );
}