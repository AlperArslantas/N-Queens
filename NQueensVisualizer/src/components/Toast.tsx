import React, { useEffect } from 'react';

interface ToastProps {
  show: boolean;
  message: string;
  durationMs?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ show, message, durationMs = 2500, onClose }) => {
  useEffect(() => {
    if (!show) return;
    const t = window.setTimeout(onClose, durationMs);
    return () => window.clearTimeout(t);
  }, [show, durationMs, onClose]);

  if (!show) return null;
  return (
    <div className="toast">
      {message}
    </div>
  );
};

export default Toast;
