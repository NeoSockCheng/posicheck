type InputFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
};

export default function InputField({ label, value, onChange, textarea }: InputFieldProps) {
  return (
    <div className="flex flex-col mb-4">
      <label className="font-semibold text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea
          className="border border-gray-300 rounded p-2 resize-none"
          rows={4}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type="text"
          className="border border-gray-300 rounded p-2"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
