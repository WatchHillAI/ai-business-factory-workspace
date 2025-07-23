import React, { useEffect } from 'react';
import { BMCCanvas } from '@/components/bmc/BMCCanvas';
import { initializeDatabase } from '@/lib/database';
import { Toaster } from '@/components/ui/toaster';
import { PWAInstall } from '@/components/ui/pwa-install';
import { useRegisterSW } from 'virtual:pwa-register/react';
import './styles/globals.css';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = React.useState(false);
  const [installPromptEvent, setInstallPromptEvent] = React.useState<BeforeInstallPromptEvent | null>(null);
  
  // Register service worker only in production
  const swConfig = import.meta.env.PROD ? useRegisterSW({
    onRegistered(r: any) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error: any) {
      console.log('SW registration error', error);
    },
  }) : {
    needRefresh: [false, () => {}],
    offlineReady: [false],
    updateServiceWorker: () => {},
  };

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady],
    updateServiceWorker,
  } = swConfig;

  // Initialize app
  useEffect(() => {
    const initApp = async () => {
      try {
        // In development mode, unregister any existing service workers and clear cache
        if (import.meta.env.DEV && 'serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log('Unregistered service worker:', registration);
          }
          
          // Clear all caches
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            for (const cacheName of cacheNames) {
              await caches.delete(cacheName);
              console.log('Deleted cache:', cacheName);
            }
          }
        }
        
        // Initialize database
        await initializeDatabase();
        
        // Any other initialization logic
        console.log('App initialized successfully');
      } catch (err) {
        console.error('Failed to initialize app:', err);
        setError('Failed to initialize app. Please refresh the page.');
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Handle service worker updates
  useEffect(() => {
    if (needRefresh && import.meta.env.PROD) {
      // Show update notification only in production
      const shouldUpdate = confirm('A new version is available. Update now?');
      if (shouldUpdate) {
        updateServiceWorker(true);
      }
    }
  }, [needRefresh, updateServiceWorker]);

  // Handle offline ready
  useEffect(() => {
    if (offlineReady && import.meta.env.PROD) {
      console.log('App is ready to work offline');
      // Show offline ready notification only in production
    }
  }, [offlineReady]);

  // Handle PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;

    installPromptEvent.prompt();
    const { outcome } = await installPromptEvent.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setShowInstallPrompt(false);
    setInstallPromptEvent(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Business Model Canvas
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Setting up your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <BMCCanvas />
      <PWAInstall />
      <Toaster />
      
      {/* PWA Update Notification - Only show in production */}
      {needRefresh && import.meta.env.PROD && (
        <div className="fixed bottom-4 left-4 right-4 bg-primary text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:w-80">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Update Available</p>
              <p className="text-sm opacity-90">A new version is ready to install</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateServiceWorker(true)}
                className="bg-white text-primary px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => typeof setNeedRefresh === 'function' && setNeedRefresh(false)}
                className="text-white/80 hover:text-white px-2 py-1 rounded text-sm"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PWA Install Notification */}
      {showInstallPrompt && (
        <div className="fixed top-4 left-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:w-80">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="font-medium">Install BMC Factory</p>
                <p className="text-sm opacity-90">Add to your home screen for quick access</p>
              </div>
            </div>
            <div className="flex gap-2 ml-2">
              <button
                onClick={handleInstallApp}
                className="bg-white text-blue-600 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-white/80 hover:text-white px-2 py-1 rounded text-sm"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offline Ready Notification - Only show in production */}
      {offlineReady && import.meta.env.PROD && (
        <div className="fixed top-4 left-4 right-4 bg-green-600 text-white p-3 rounded-lg shadow-lg z-50 md:left-auto md:right-4 md:w-80">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-medium">Ready to work offline</p>
              <p className="text-sm opacity-90">Your canvases are saved locally</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;