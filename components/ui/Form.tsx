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
      <div className="mt-1 flex rounded-lg border border-line bg-surface focus-within:border-accent">
        {prefix && <span className="flex items-center border-r border-line px-3 text-muted">{prefix}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="min-h-11 w-full rounded-lg bg-transparent px-3 text-base outline-none"
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

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const styles = {
    primary: "bg-brand text-brand-ink hover:opacity-90",
    secondary: "border border-line bg-surface hover:bg-bg",
    ghost: "text-accent hover:underline",
  }[variant];
  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${styles} ${className}`}
      {...props}
    />
  );
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
  return <section className={`rounded-2xl border border-line bg-surface p-6 ${className}`}>{children}</section>;
}
