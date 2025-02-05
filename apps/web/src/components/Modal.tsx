import { type FC, useEffect, type PropsWithChildren } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
}

export const Modal: FC<PropsWithChildren<ModalProps>> = ({
  open,
  onClose,
  title,
  children
}) => {
  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleEsc);
    }

    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div
          className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center border-b px-4 py-3">
            <h2 className="text-lg font-medium">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-col max-h-[80vh]">
            <div className="overflow-y-auto p-4 flex-1">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};