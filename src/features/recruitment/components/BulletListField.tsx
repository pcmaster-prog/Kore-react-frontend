interface BulletListFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export default function BulletListField({
  label,
  value,
  onChange,
  placeholder = "Un elemento por línea",
  rows = 4,
}: BulletListFieldProps) {
  return (
    <div>
      <label className="block text-sm font-bold text-k-text-h mb-1">{label}</label>
      <textarea
        className="w-full bg-k-bg-primary border border-k-border rounded-xl px-4 py-2 focus:outline-none focus:border-k-accent"
        style={{ minHeight: `${rows * 1.5}rem` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      <p className="text-xs text-k-text-b mt-1">Un elemento por línea</p>
    </div>
  );
}
