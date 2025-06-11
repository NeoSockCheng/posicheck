import { FaEye, FaTrash } from 'react-icons/fa';

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
    <div className="flex flex-col sm:flex-row items-center border border-violet-300 rounded p-4 mb-4 hover:shadow transition">
      <img
        src={imageUrl}
        alt="Detection result"
        className="w-64 h-32 object-cover rounded mb-2 sm:mb-0 sm:mr-4 border border-violet-200"
      />
      <div className="flex-1 text-sm text-gray-700">
        <p className="font-semibold text-violet-600">{date}</p>
        <p className="mt-1">{error}</p>
        <div className="flex mt-2 gap-2">
          <button
            onClick={onView}
            className="flex items-center gap-2 text-violet-600 border border-violet-600 rounded px-3 py-1 text-xs hover:bg-violet-300 hover:text-violet-700 transition"
          >
            <FaEye size={14} /> View
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-500 border border-red-500 rounded px-3 py-1 text-xs hover:bg-red-300 hover:text-red-700 transition"
          >
            <FaTrash size={14} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}
