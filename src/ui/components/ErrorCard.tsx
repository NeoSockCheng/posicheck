type ErrorCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  isDetected?: boolean;
};

export default function ErrorCard({ icon, title, description, isDetected = false }: ErrorCardProps) {
  return (
    <div className={`flex items-start p-4 rounded shadow hover:shadow-md transition w-full ${
      isDetected 
        ? 'bg-red-50 border border-red-200' 
        : 'bg-white'
    }`}>
      <div className={`text-xl mr-3 p-2 ${
        isDetected ? 'text-red-600' : 'text-violet-700'
      }`}>{icon}</div>
      <div className="flex flex-col">
        <h3 className={`font-bold text-sm sm:text-base ${
          isDetected ? 'text-red-700' : 'text-violet-700'
        }`}>{title}</h3>
        <p className={`text-xs sm:text-sm ${
          isDetected ? 'text-red-600' : 'text-gray-600'
        }`}>{description}</p>
      </div>
    </div>
  );
}
