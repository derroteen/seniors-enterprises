"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { StatusMessage } from "@/components/ui/status-message";

interface ComboboxProps {
  id: string;
  label: string;
  inputValue: string;
  options: readonly string[];
  onInputValueChange: (value: string) => void;
  onSelect: (value: string) => void;
  disabled?: boolean;
  freeform?: boolean;
  hint?: string;
  error?: string;
  autoComplete?: string;
  placeholder?: string;
}

interface PopupPosition {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
}

function subscribeToMount() {
  return () => {};
}

function getClientMountedSnapshot() {
  return true;
}

function getServerMountedSnapshot() {
  return false;
}

function normalizeSearch(value: string) {
  return value.toLocaleLowerCase().replace(/[\s'’‘\-‐‑‒–—]/g, "");
}

function getHighlightParts(label: string, query: string) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) {
    return { before: label, match: "", after: "" };
  }

  let normalizedLabel = "";
  const originalIndexes: number[] = [];
  for (let index = 0; index < label.length; index += 1) {
    const character = label[index];
    if (/[\s'’‘\-‐‑‒–—]/.test(character)) {
      continue;
    }
    normalizedLabel += character.toLocaleLowerCase();
    originalIndexes.push(index);
  }

  const matchIndex = normalizedLabel.indexOf(normalizedQuery);
  if (matchIndex < 0) {
    return { before: label, match: "", after: "" };
  }

  const start = originalIndexes[matchIndex];
  const end = originalIndexes[matchIndex + normalizedQuery.length - 1] + 1;
  return {
    before: label.slice(0, start),
    match: label.slice(start, end),
    after: label.slice(end),
  };
}

export function Combobox({
  autoComplete = "off",
  disabled = false,
  error,
  freeform = false,
  hint,
  id,
  inputValue,
  label,
  onInputValueChange,
  onSelect,
  options,
  placeholder = "Type to search",
}: ComboboxProps) {
  const generatedId = useId();
  const listboxId = `${id}-listbox`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const inputRef = useRef<HTMLInputElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountedSnapshot,
    getServerMountedSnapshot,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [position, setPosition] = useState<PopupPosition | null>(null);

  const filteredOptions = useMemo(() => {
    const query = normalizeSearch(inputValue);
    if (!query) {
      return options;
    }
    return options.filter((option) => normalizeSearch(option).includes(query));
  }, [inputValue, options]);

  const updatePosition = useCallback(() => {
    const input = inputRef.current;
    if (!input) {
      return;
    }

    const rect = input.getBoundingClientRect();
    const visualViewport = window.visualViewport;
    const viewportTop = visualViewport?.offsetTop ?? 0;
    const viewportHeight = visualViewport?.height ?? window.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const availableBelow = Math.max(0, viewportBottom - rect.bottom - 8);
    const availableAbove = Math.max(0, rect.top - viewportTop - 8);
    const openBelow = availableBelow >= Math.min(180, availableAbove) || availableBelow >= availableAbove;
    const maxHeight = Math.max(100, Math.min(320, openBelow ? availableBelow : availableAbove));
    const width = Math.min(rect.width, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));

    setPosition(
      openBelow
        ? { left, width, top: rect.bottom + 4, maxHeight }
        : { left, width, bottom: window.innerHeight - rect.top + 4, maxHeight },
    );
  }, []);

  useEffect(() => {
    if (!isOpen || disabled) {
      return;
    }

    updatePosition();
    const visualViewport = window.visualViewport;
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    visualViewport?.addEventListener("resize", updatePosition);
    visualViewport?.addEventListener("scroll", updatePosition);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      visualViewport?.removeEventListener("resize", updatePosition);
      visualViewport?.removeEventListener("scroll", updatePosition);
    };
  }, [disabled, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (
        target instanceof Node &&
        !inputRef.current?.contains(target) &&
        !popupRef.current?.contains(target)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (activeIndex >= 0) {
      optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  function chooseOption(option: string) {
    onInputValueChange(option);
    onSelect(option);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setActiveIndex(
          filteredOptions.length === 0
            ? -1
            : event.key === "ArrowDown"
              ? 0
              : filteredOptions.length - 1,
        );
        return;
      }

      if (filteredOptions.length > 0) {
        setActiveIndex((current) =>
          event.key === "ArrowDown"
            ? (current + 1) % filteredOptions.length
            : (current <= 0 ? filteredOptions.length : current) - 1,
        );
      }
      return;
    }

    if (event.key === "Enter" && isOpen) {
      event.preventDefault();
      if (activeIndex >= 0 && filteredOptions[activeIndex]) {
        chooseOption(filteredOptions[activeIndex]);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Tab") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  const popupStyle: CSSProperties | undefined = position
    ? {
        left: position.left,
        width: position.width,
        top: position.top,
        bottom: position.bottom,
        maxHeight: position.maxHeight,
      }
    : undefined;

  const popup =
    mounted && isOpen && !disabled && position
      ? createPortal(
          <div
            ref={popupRef}
            style={popupStyle}
            className="fixed z-[100] overflow-y-auto overscroll-contain rounded-lg border border-strong bg-surface shadow-xl"
          >
            <ul id={listboxId} role="listbox" aria-label={`${label} suggestions`}>
              {filteredOptions.map((option, index) => {
                const parts = getHighlightParts(option, inputValue);
                return (
                  <li
                    key={option}
                    ref={(node) => {
                      optionRefs.current[index] = node;
                    }}
                    id={`${generatedId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => chooseOption(option)}
                    className={`flex min-h-11 cursor-pointer items-center px-3 py-2 text-sm text-foreground ${
                      index === activeIndex ? "bg-primary/10" : "hover:bg-background"
                    }`}
                  >
                    {parts.match ? (
                      <>
                        {parts.before}
                        <mark className="rounded-sm bg-warning-bg font-semibold text-foreground">
                          {parts.match}
                        </mark>
                        {parts.after}
                      </>
                    ) : (
                      option
                    )}
                  </li>
                );
              })}
            </ul>
            {filteredOptions.length === 0 ? (
              <StatusMessage tone="muted" className="px-3 py-3">
                No match found
              </StatusMessage>
            ) : null}
          </div>,
          document.body,
        )
      : null;

  return (
    <div className="grid gap-1.5">
      <label id={`${id}-label`} htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        role="combobox"
        aria-labelledby={`${id}-label`}
        aria-autocomplete={freeform ? "both" : "list"}
        aria-expanded={isOpen}
        aria-controls={isOpen && mounted && position ? listboxId : undefined}
        aria-haspopup="listbox"
        aria-activedescendant={
          isOpen && activeIndex >= 0 && activeIndex < filteredOptions.length
            ? `${generatedId}-option-${activeIndex}`
            : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        autoComplete={autoComplete}
        disabled={disabled}
        value={inputValue}
        placeholder={placeholder}
        onFocus={() => {
          if (!disabled) {
            setIsOpen(true);
            setActiveIndex(filteredOptions.length > 0 ? 0 : -1);
          }
        }}
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
        onChange={(event) => {
          onInputValueChange(event.target.value);
          setIsOpen(true);
          setActiveIndex(0);
        }}
        onKeyDown={handleKeyDown}
        className="min-h-11 w-full rounded-lg border border-strong bg-surface px-3 text-foreground placeholder:text-muted-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-info disabled:cursor-not-allowed disabled:bg-muted-bg disabled:text-muted-foreground"
      />
      {hint ? (
        <StatusMessage id={hintId} tone="muted" className="text-xs">
          {hint}
        </StatusMessage>
      ) : null}
      {error ? (
        <StatusMessage id={errorId} tone="danger">
          {error}
        </StatusMessage>
      ) : null}
      {popup}
    </div>
  );
}
