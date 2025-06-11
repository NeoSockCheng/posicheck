type ErrorCategoryProps = {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export default function ErrorCategory({ title, options, selected, onSelect }: ErrorCategoryProps) {
  return (
    <div className="mb-4">
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            className={`border rounded px-2 py-1 text-xs transition ${
              selected === opt ? 'bg-purple-600 text-white' : 'bg-white text-gray-600'
            }`}
            onClick={() => onSelect(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
