type ErrorCategoryProps = {
  title: string;
  options: string[];
  selected: string;
  onSelect: (value: string) => void;
};

export default function ErrorCategory({ title, options, selected, onSelect }: ErrorCategoryProps) {
  return (
    <div className="p-3 bg-violet-50 rounded-lg shadow bg-violet-50">
      <h3 className="font-semibold text-sm sm:text-base text-violet-600 mb-3">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1 rounded text-xs sm:text-sm transition border border-slate-200 ${
              selected === opt
                ? 'bg-violet-500 text-white'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
