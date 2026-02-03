'use client';

import { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  details?: string[];
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function Toast({
  show,
  type,
  title,
  message,
  details,
  onClose,
  autoClose = true,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (show && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose, duration, onClose]);

  if (!show) return null;

  const styles = {
    success: {
      border: 'border-green-500',
      bg: 'bg-green-100',
      icon: '✓',
    },
    error: {
      border: 'border-red-500',
      bg: 'bg-red-100',
      icon: '✕',
    },
    info: {
      border: 'border-blue-500',
      bg: 'bg-blue-100',
      icon: 'ℹ️',
    },
  };

  const style = styles[type];

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50 animate-slide-up">
      <div className={`bg-white border-l-4 ${style.border} rounded-lg shadow-2xl p-4`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full ${style.bg} flex items-center justify-center font-semibold`}
          >
            {style.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
            <p className="text-sm text-gray-600 whitespace-pre-line">{message}</p>

            {/* Details */}
            {details && details.length > 0 && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                  상세 오류 ({details.length}건)
                </summary>
                <ul className="mt-1 ml-3 space-y-0.5 text-gray-400 max-h-32 overflow-y-auto">
                  {details.map((detail, i) => (
                    <li key={i}>• {detail}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
