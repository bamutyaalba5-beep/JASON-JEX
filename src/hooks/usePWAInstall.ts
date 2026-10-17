import { useEffect, useState, useCallback } from 'react';
import { isContactsApiSupported } from '../utils/security';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall(onAppInstalledCallback?: () => void) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [supportsContacts, setSupportsContacts] = useState(false);

  useEffect(() => {
    // Detect standalone mode (already installed as PWA or Home Screen app)
    const isStandalone =
      typeof window !== 'undefined' &&
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://'));

    setIsInstalled(isStandalone);

    // Detect mobile phone / tablet devices
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    const isMobileDevice =
      /android|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/.test(ua) ||
      (typeof window !== 'undefined' && window.innerWidth <= 1024);

    setIsIOS(isIOSDevice);
    setIsMobile(isMobileDevice);
    setSupportsContacts(isContactsApiSupported());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      if (onAppInstalledCallback) {
        onAppInstalledCallback();
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [onAppInstalledCallback]);

  const install = useCallback(async () => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        if (onAppInstalledCallback) {
          onAppInstalledCallback();
        }
        return true;
      }
    } catch (err) {
      console.warn('Install prompt error:', err);
    }
    return false;
  }, [deferredPrompt, onAppInstalledCallback]);

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isMobile,
    supportsContacts,
    install,
  };
}
