/**
 * Focus-Preserving Textarea Component
 * Maintains cursor position and focus during re-renders and auto-save operations
 */

import React, { useRef, useEffect, useCallback, forwardRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface FocusPreservingTextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  preserveCursor?: boolean;
  debounceMs?: number;
}

export const FocusPreservingTextarea = forwardRef<HTMLTextAreaElement, FocusPreservingTextareaProps>(({
  value,
  onChange,
  preserveCursor = true,
  debounceMs = 0,
  className,
  ...props
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPositionRef = useRef<number>(0);
  const isUserTypingRef = useRef(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout>();

  // Combine refs
  const combinedRef = useCallback((node: HTMLTextAreaElement) => {
    textareaRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Store cursor position before re-render
  const storeCursorPosition = useCallback(() => {
    if (textareaRef.current && document.activeElement === textareaRef.current) {
      cursorPositionRef.current = textareaRef.current.selectionStart || 0;
    }
  }, []);

  // Restore cursor position after re-render
  const restoreCursorPosition = useCallback(() => {
    if (
      preserveCursor &&
      textareaRef.current &&
      document.activeElement === textareaRef.current &&
      isUserTypingRef.current
    ) {
      const position = cursorPositionRef.current;
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(position, position);
        }
      });
    }
    isUserTypingRef.current = false;
  }, [preserveCursor]);

  // Handle user input with optional debouncing
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    isUserTypingRef.current = true;
    storeCursorPosition();

    if (debounceMs > 0) {
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      // Set new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    } else {
      onChange(newValue);
    }
  }, [onChange, storeCursorPosition, debounceMs]);

  // Handle focus events
  const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
    isUserTypingRef.current = false;
    props.onFocus?.(e);
  }, [props.onFocus]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
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
    <Textarea
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

FocusPreservingTextarea.displayName = 'FocusPreservingTextarea';

export default FocusPreservingTextarea;