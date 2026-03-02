/**
 * Focus-Preserving Input Component
 * Maintains cursor position and focus during re-renders and auto-save operations
 */

import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface FocusPreservingInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  preserveCursor?: boolean;
  debounceMs?: number;
}

export const FocusPreservingInput = forwardRef<HTMLInputElement, FocusPreservingInputProps>(({
  value,
  onChange,
  preserveCursor = true,
  debounceMs = 0,
  className,
  ...props
}, ref) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const isUserTypingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Combine refs
  const combinedRef = useCallback((node: HTMLInputElement) => {
    inputRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Store cursor position before re-render
  const storeCursorPosition = useCallback(() => {
    if (inputRef.current && document.activeElement === inputRef.current) {
      cursorPositionRef.current = inputRef.current.selectionStart || 0;
    }
  }, []);

  // Restore cursor position after re-render
  const restoreCursorPosition = useCallback(() => {
    if (
      preserveCursor &&
      inputRef.current &&
      document.activeElement === inputRef.current &&
      isUserTypingRef.current
    ) {
      const position = cursorPositionRef.current;
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (inputRef.current && document.activeElement === inputRef.current) {
          try {
            inputRef.current.setSelectionRange(position, position);
          } catch (error) {
            // Silently handle any cursor position errors
            console.debug('Cursor position restoration failed:', error);
          }
        }
      });
    }
    isUserTypingRef.current = false;
  }, [preserveCursor]);

  // Handle user input with optional debouncing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isUserTypingRef.current = true;
    storeCursorPosition();

    // Always call onChange immediately for UI responsiveness
    onChange(newValue);
    
    // Optional debouncing for additional processing
    if (debounceMs > 0) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        // Additional debounced processing can go here if needed
      }, debounceMs);
    }
  }, [onChange, storeCursorPosition, debounceMs]);

  // Handle focus events
  const handleFocus = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    isUserTypingRef.current = false;
    props.onFocus?.(e);
  }, [props.onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    isUserTypingRef.current = false;
    props.onBlur?.(e);
  }, [props.onBlur]);

  // Restore cursor position after value updates
  useEffect(() => {
    restoreCursorPosition();
  }, [value, restoreCursorPosition]);

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
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(className)}
    />
  );
});

FocusPreservingInput.displayName = 'FocusPreservingInput';

export default FocusPreservingInput;