import { Link } from 'react-router-dom';

// Shown when a guest tries to do something that requires login
// (add to cart, add to wishlist, place order).
// Instead of redirecting away, we show this modal so they
// don't lose their place on the page.
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export default function LoginModal({
  isOpen,
  onClose,
  message = 'Please login to continue',
}: LoginModalProps) {
  if (!isOpen) return null;

  return (
    // Backdrop — clicking outside closes the modal
    <div
      className="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal box — stop click from bubbling to backdrop */}
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-7 h-7 text-indigo-600"
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Login required
        </h3>
        <p className="text-sm text-gray-500 mb-6">{message}</p>

        <div className="flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
            onClick={onClose}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="w-full border border-gray-300 text-gray-700 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors text-center"
            onClick={onClose}
          >
            Create account
          </Link>
          <button
            onClick={onClose}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Continue browsing
          </button>
        </div>
      </div>
    </div>
  );
}