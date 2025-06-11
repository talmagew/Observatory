import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">🌌</span>
              Emerald Observatory
            </h1>
            <div className="text-sm text-gray-300">
              Web Astronomical Calculator
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-auto">
        <div className="container mx-auto px-6 py-4">
          <div className="text-center text-sm text-gray-400">
            <p>
              Emerald Observatory Web - Inspired by the original Emerald Observatory iOS app
            </p>
            <p className="mt-1">
              Astronomical calculations powered by astronomy-engine
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 