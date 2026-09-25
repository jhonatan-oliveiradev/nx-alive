"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X, RotateCcw } from "lucide-react";
import { useId, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
export function Modal({
  title,
  description,
  open,
  onOpenChange,
  children,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <header>
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Close dialog"
                onClick={() => onOpenChange(false)}
              >
                <X size={18} />
              </Button>
            </Dialog.Close>
          </header>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Card({
  title,
  detail,
  onReset,
  children,
}: {
  title: string;
  detail?: string;
  onReset?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="card">
      <header className="card-heading">
        <div>
          <h3>{title}</h3>
          {detail && <p>{detail}</p>}
        </div>
        {onReset && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onReset}
            aria-label={`Reset ${title}`}
            title={`Reset ${title}`}
          >
            <RotateCcw size={14} />
          </Button>
        )}
      </header>
      {children}
    </section>
  );
}
export function Range({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onStart,
  onEnd,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  onStart?: () => void;
  onEnd?: () => void;
}) {
  const id = useId();
  return (
    <div className="range-row">
      <label htmlFor={id}>{label}</label>
      <input
        aria-label={`${label} slider`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onPointerDown={onStart}
        onPointerUp={onEnd}
        onPointerCancel={onEnd}
        onBlur={onEnd}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number(value.toFixed(2))}
        onChange={(e) => {
          if (e.target.value !== "")
            onChange(Math.max(min, Math.min(max, Number(e.target.value))));
        }}
      />
    </div>
  );
}
export function Color({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="color-row">
      <span>{label}</span>
      <span className="color-value">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <code>{value.toUpperCase()}</code>
      </span>
    </label>
  );
}
