import { useId } from "react";

// Form building blocks with labels, hints and errors wired for screen readers
// (NFR-ACC-01). Buttons are at least 44 px tall for touch.

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  prefix?: string;
};

export function Field({ label, hint, error, prefix, className, ...input }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      <div className="mt-1.5 flex rounded-xl border border-line bg-surface transition focus-within:border-brand focus-within:shadow-[0_0_0_4px_color-mix(in_srgb,var(--color-brand)_14%,transparent)]">
        {prefix && (
          <span className="flex items-center border-r border-line px-3 text-sm font-medium text-muted">{prefix}</span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 w-full rounded-xl bg-transparent px-3 text-base outline-none placeholder:text-muted/70"
          {...input}
        />
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" };

const buttonStyles = {
  primary:
    "bg-brand-gradient text-white shadow-[0_6px_20px_-6px_color-mix(in_srgb,var(--color-brand)_60%,transparent)] hover:brightness-110 hover:shadow-[0_10px_28px_-8px_color-mix(in_srgb,var(--color-brand)_70%,transparent)]",
  secondary: "border border-line bg-surface hover:border-brand/40 hover:bg-brand-soft",
  ghost: "text-brand hover:bg-brand-soft",
};

/** Class names for links styled as buttons. */
export function buttonClass(variant: keyof typeof buttonStyles = "primary", extra = "") {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none disabled:hover:brightness-100 ${buttonStyles[variant]} ${extra}`;
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Alert({ children, tone = "danger" }: { children: React.ReactNode; tone?: "danger" | "info" }) {
  const color = tone === "danger" ? "border-danger text-danger" : "border-info text-ink";
  return (
    <p
      role={tone === "danger" ? "alert" : "status"}
      className={`rounded-lg border-l-4 bg-surface px-3 py-2 text-sm ${color}`}
    >
      {children}
    </p>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`card rise p-6 ${className}`}>{children}</section>;
}
