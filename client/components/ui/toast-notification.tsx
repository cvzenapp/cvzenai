import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';

export interface ToastNotificationProps {
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  isVisible: boolean;
}

const ToastNotification: React.FC<ToastNotificationProps> = ({
  type,
  title,
  message,
  duration = 4000,
  onClose,
  isVisible,
}) => {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
    
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onClose?.();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg border shadow-lg min-w-[300px] max-w-[400px]
        transform transition-all duration-300 ease-in-out
        ${show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getBackgroundColor()}
      `}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${getTextColor()}`}>
            {title}
          </h4>
          {message && (
            <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setShow(false);
            onClose?.();
          }}
          className={`flex-shrink-0 ${getTextColor()} hover:opacity-70 transition-opacity`}
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;