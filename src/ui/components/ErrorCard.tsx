type ErrorCardProps = {
  icon: string;
  title: string;
  description: string;
};

export default function ErrorCard({ icon, title, description }: ErrorCardProps) {
  return (
    <div className="flex items-start p-4 bg-white rounded shadow hover:shadow-md transition w-full">
      <div className="text-2xl mr-3">{icon}</div>
      <div className="flex flex-col">
        <h3 className="font-bold text-purple-700 text-sm sm:text-base">{title}</h3>
        <p className="text-gray-600 text-xs sm:text-sm">{description}</p>
      </div>
    </div>
  );
}
