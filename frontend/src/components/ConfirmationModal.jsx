import { useState, useEffect, useRef } from 'react';

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'default' // 'default' | 'danger'
}) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in confirm:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isDanger = type === 'danger';
  const bgColor = isDanger ? 'bg-rose-500' : 'bg-primary';
  const hoverShadow = isDanger 
    ? 'hover:shadow-[0_0_20px_rgba(244,63,94,0.3)]' 
    : 'hover:shadow-[0_0_20px_rgba(19,236,106,0.3)]';
  const borderColor = isDanger ? 'border-rose-500/30' : 'border-primary/30';
  const iconBg = isDanger ? 'bg-rose-500/10' : 'bg-primary/10';
  const iconColor = isDanger ? 'text-rose-400' : 'text-primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-morphism rounded-xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-center w-16 mx-auto mb-4 rounded-full ${iconBg}`}>
          {isDanger ? (
            <span className={`material-symbols-outlined ${iconColor} text-3xl`}>warning</span>
          ) : (
            <span className={`material-symbols-outlined ${iconColor} text-3xl`}>help</span>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-center mb-2">{title}</h3>
        <p className="text-slate-400 text-center text-sm mb-6">
          {message}
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-3 rounded-lg border border-slate-700 text-slate-400 font-bold hover:bg-white/5 transition-all disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-lg ${bgColor} text-background-dark font-bold ${hoverShadow} transition-all disabled:opacity-50 flex items-center justify-center`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-background-dark border-t-transparent"></div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
