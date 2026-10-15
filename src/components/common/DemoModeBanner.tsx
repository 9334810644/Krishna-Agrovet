import React, { useState } from 'react';
import { isFirebaseConfigured } from '../../lib/firebase';
import { Database, X, ExternalLink } from 'lucide-react';

export const DemoModeBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);
  const isConfigured = isFirebaseConfigured();

  if (isConfigured || dismissed) return null;

  return (
    <div className="bg-amber-900 text-amber-100 text-xs sm:text-sm px-4 py-2 border-b border-amber-700/60 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-300 shrink-0" />
          <span>
            <strong className="font-semibold text-amber-200">Interactive Demo Mode:</strong> Running with local persistent data & realistic cattle feed records. To link live Firebase, add <code className="bg-amber-950/70 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">VITE_FIREBASE_API_KEY</code> & <code className="bg-amber-950/70 px-1.5 py-0.5 rounded text-amber-200 font-mono text-xs">VITE_FIREBASE_PROJECT_ID</code> in <code className="font-mono text-xs text-amber-200">.env</code>.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1 text-amber-200 hover:text-white underline font-medium"
          >
            Open Admin Demo <ExternalLink className="w-3 h-3" />
          </a>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss banner"
            className="p-1 hover:bg-amber-800 rounded text-amber-300 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
