import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

type LogLevel = 'log' | 'info' | 'warn' | 'error';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Logs messages with different severity levels
 * @param level The severity level of the log message
 * @param message The main message to log
 * @param data Optional additional data to log
 */
export function log(level: LogLevel, message: string, data?: unknown) {
  if (process.env.NODE_ENV === 'production') {
    // In production, only log errors and warnings
    if (level === 'error' || level === 'warn') {
      console[level](`[${level.toUpperCase()}] ${message}`, data || '');
    }
  } else {
    // In development, log everything
    console[level === 'log' ? 'log' : level](`[${level.toUpperCase()}] ${message}`, data || '');
  }
}
