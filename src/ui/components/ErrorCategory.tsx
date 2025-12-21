import React from 'react';

type ErrorCategoryProps = {
  title: string;
  options: string[];
  selected?: string;
  onSelect?: (value: string) => void;
  value?: string;
  onChange?: (value: string) => void;
};

export default function ErrorCategory({ 
  title, 
  options, 
  selected, 
  onSelect, 
  value, 
  onChange 
}: ErrorCategoryProps) {
  const currentValue = value || selected;
  
  return (
    <div className="p-3 bg-violet-50 rounded-lg shadow bg-violet-50">
      <h3 className="font-semibold text-sm sm:text-base text-violet-600 mb-3">{title}</h3>      <div className="flex flex-wrap gap-2">
        {options.map((opt, index) => {
          const isSelected = currentValue === opt;
          const isErrorOption = index !== 0; // First option is always "normal", rest are errors
          
          return (
            <button
              key={opt}
              onClick={() => {
                if (onChange) onChange(opt);
                if (onSelect) onSelect(opt);
              }}
              className={`px-3 py-1 rounded text-xs sm:text-sm transition border border-slate-200 ${
                isSelected
                  ? isErrorOption
                    ? 'bg-red-500 text-white border-red-600'  // Red for error selections
                    : 'bg-violet-500 text-white border-violet-600'  // Purple for normal
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
