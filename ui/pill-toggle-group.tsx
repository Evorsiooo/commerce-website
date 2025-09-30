import { cn } from "@/lib/utils";

type PillOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type PillToggleGroupProps<TValue extends string> = {
  label: string;
  value: TValue;
  onChange: (value: TValue) => void;
  options: ReadonlyArray<PillOption<TValue>>;
  disabled?: boolean;
  className?: string;
};

export function PillToggleGroup<TValue extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  className,
}: PillToggleGroupProps<TValue>) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</span>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          disabled={disabled}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
            value === option.value
              ? "border-neutral-900 bg-neutral-900 text-white"
              : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400",
            disabled ? "cursor-not-allowed opacity-60" : undefined,
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
