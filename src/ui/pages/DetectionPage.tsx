import UploadBox from '../components/UploadBox';
import ErrorCard from '../components/ErrorCard';

const detectionErrors = [
  {
    icon: '😀',
    title: 'Chin Position',
    description: 'Improper chin angle distorts occlusal plane.',
  },
  {
    icon: '👅',
    title: 'Tongue Position',
    description: 'Tongue causes dark shadows.',
  },
  {
    icon: '🤪',
    title: 'Head Tilt',
    description: 'Tilt causes asymmetry.',
  },
  {
    icon: '🔄',
    title: 'Head Rotation',
    description: 'Unequal image size.',
  },
  {
    icon: '🧍',
    title: 'Body Position',
    description: 'Leaning creates overlap.',
  },
];

export default function DetectionPage() {
  return (
    <div className="flex flex-col flex-1 bg-gray-50">
      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-4 p-4 flex-1">
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
