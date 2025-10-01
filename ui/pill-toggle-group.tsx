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
    <fieldset className={cn("flex flex-wrap items-center gap-2 border-0 p-0", className)}>
      <legend className="mr-2 px-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
      </legend>
      <div className="flex flex-wrap items-center gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition",
              value === option.value
                ? "bg-neutral-900 text-white"
                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
              disabled ? "cursor-not-allowed opacity-60" : undefined,
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
