type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  placeholder?: string;
  type?: string;
};

export default function InputField({ label, value, onChange, textarea, placeholder, type = "text" }: InputFieldProps) {
  return (
    <div className="flex flex-col mb-4">
      <label className="font-semibold text-gray-700 mb-1">{label}</label>      {textarea ? (
        <textarea
          className="border border-violet-200 rounded p-2 resize-none bg-violet-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 focus:bg-white transition"
          rows={4}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (        <input
          type={type}
          className="border border-violet-200 rounded p-2 bg-violet-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 focus:bg-white transition"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
