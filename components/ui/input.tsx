import { useId, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className = "", error, id, label, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="grid gap-2">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId ?? props["aria-describedby"]}
        className={`min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
