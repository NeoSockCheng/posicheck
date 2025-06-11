type HistoryCardProps = {
  date: string;
  error: string;
  imageUrl: string;
  onView: () => void;
  onDelete: () => void;
};

export default function HistoryCard({
  date,
  error,
  imageUrl,
  onView,
  onDelete,
}: HistoryCardProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center border border-purple-300 rounded p-4 mb-4 hover:shadow transition">
      <img
        src={imageUrl}
        alt="Detection result"
        className="w-32 h-32 object-cover rounded mb-2 sm:mb-0 sm:mr-4 border border-purple-200"
      />
      <div className="flex-1 text-sm text-gray-700">
        <p className="font-semibold text-purple-600">{date}</p>
        <p className="mt-1">{error}</p>
        <div className="flex mt-2 gap-2">
          <button
            onClick={onView}
            className="text-purple-600 border border-purple-600 rounded px-3 py-1 text-xs hover:bg-purple-600 hover:text-white transition"
          >
            View 👁
          </button>
          <button
            onClick={onDelete}
            className="text-red-500 border border-red-500 rounded px-3 py-1 text-xs hover:bg-red-500 hover:text-white transition"
          >
            Delete 🗑
          </button>
        </div>
      </div>
    </div>
  );
}
