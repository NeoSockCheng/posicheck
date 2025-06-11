type ErrorCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
};

export default function ErrorCard({ icon, title, description }: ErrorCardProps) {
  return (
    <div className="flex items-start p-4 bg-white rounded shadow hover:shadow-md transition w-full">
      <div className="text-xl text-violet-700 mr-3 p-2">{icon}</div>
      <div className="flex flex-col">
        <h3 className="font-bold text-violet-700 text-sm sm:text-base">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
}
