"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export type DropdownOption = { value: string; label: string; disabled?: boolean };

export function CustomDropdown({
  name,
  options,
  defaultValue = "",
  value,
  onChange,
  placeholder = "Select an option",
  className,
  required = false,
}: {
  name?: string;
  options: DropdownOption[];
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}) {
  const listboxId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const controlled = value !== undefined;
  const selectedValue = controlled ? value : internalValue;
  const selectedOption = options.find((option) => option.value === selectedValue);

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, []);

  function choose(option: DropdownOption) {
    if (option.disabled) return;
    if (!controlled) setInternalValue(option.value);
    onChange?.(option.value);
    setOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) setOpen(true);
      const direction = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + direction + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      if (!open) {
        event.preventDefault();
        setOpen(true);
      } else {
        event.preventDefault();
        const option = options[activeIndex];
        if (option) choose(option);
      }
    }
  }

  return (
    <div ref={rootRef} className="relative w-full">
      {name && <input type="hidden" name={name} value={selectedValue} />}
      <button
        type="button"
        id={name}
        role="combobox"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-required={required}
        aria-label={selectedOption?.label ?? placeholder}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={handleKeyDown}
        className={className ?? "flex h-11 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3 text-left text-sm text-zinc-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"}
      >
        <span className={selectedOption ? "truncate" : "truncate text-zinc-400"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <ChevronDown className={`ml-2 h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl shadow-blue-950/15 ring-1 ring-black/5"
        >
          {options.map((option, index) => {
            const isSelected = option.value === selectedValue;
            return (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                disabled={option.disabled}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`flex min-h-10 w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-zinc-400 ${isSelected ? "bg-blue-50 font-medium text-blue-950" : "text-zinc-700 hover:bg-zinc-50"} ${activeIndex === index ? "ring-1 ring-inset ring-blue-200" : ""}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check className="ml-3 h-4 w-4 shrink-0 text-blue-800" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
