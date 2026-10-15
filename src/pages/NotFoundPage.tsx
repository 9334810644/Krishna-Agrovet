import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="py-24 bg-stone-50 min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl border border-stone-200 p-8 sm:p-12 text-center max-w-md w-full shadow-sm space-y-4">
        <div className="text-6xl font-extrabold text-emerald-800 font-heading">
          404
        </div>
        <h1 className="text-xl font-bold text-stone-900 font-heading">
          Page Not Found
        </h1>
        <p className="text-xs text-stone-500">
          The cattle feed page or order link you are looking for does not exist or may have been moved.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Return to Cattle Feed Storefront</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
