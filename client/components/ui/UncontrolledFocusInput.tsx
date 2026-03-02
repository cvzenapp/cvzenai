/**
 * Uncontrolled Focus Input Component
 * Uses refs to prevent focus loss during auto-save operations
 */

import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface UncontrolledFocusInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

export const UncontrolledFocusInput = forwardRef<HTMLInputElement, UncontrolledFocusInputProps>(({
  value,
  onChange,
  debounceMs = 30000000,
  className,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();
  const lastValueRef = useRef<string>(value);

  // Combine refs
  const combinedRef = useCallback((node: HTMLInputElement) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Handle input changes with debouncing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    lastValueRef.current = newValue;

    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout for debounced onChange
    debounceTimeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  }, [onChange, debounceMs]);

  // Update input value when prop changes (but only if different from current input value)
  useEffect(() => {
    if (inputRef.current && value !== lastValueRef.current) {
      const currentCursorPosition = inputRef.current.selectionStart || 0;
      const wasFocused = document.activeElement === inputRef.current;
      
      inputRef.current.value = value;
      lastValueRef.current = value;
      
      // Restore cursor position if the input was focused
      if (wasFocused) {
        requestAnimationFrame(() => {
          if (inputRef.current && document.activeElement === inputRef.current) {
            try {
              inputRef.current.setSelectionRange(currentCursorPosition, currentCursorPosition);
            } catch (error) {
              console.debug('Cursor position restoration failed:', error);
            }
          }
        });
      }
    }
  }, [value]);

  // Cleanup debounce timeout
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <Input
      {...props}
      ref={combinedRef}
      defaultValue={value}
      onChange={handleChange}
      className={cn(className)}
    />
  );
});

UncontrolledFocusInput.displayName = 'UncontrolledFocusInput';

export default UncontrolledFocusInput;