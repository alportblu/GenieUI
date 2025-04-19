'use client';

import { useEffect } from 'react';

// Add TypeScript declaration for the window property
declare global {
  interface Window {
    _hydrationErrorsDisabled?: boolean;
  }
}

export default function DisableHydrationErrors() {
  useEffect(() => {
    // Function to completely disable hydration errors
    const disableHydrationErrors = () => {
      // Target and hide the hydration error overlay elements
      const errorElements = document.querySelectorAll('[data-nextjs-dialog], [data-nextjs-error-overlay]');
      errorElements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.display = 'none';
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.pointerEvents = 'none';
          el.style.position = 'absolute';
          el.style.top = '-9999px';
          try {
            el.parentNode?.removeChild(el);
          } catch (e) {
            // Fallback if direct removal fails
          }
        }
      });

      // Suppress console error messages related to hydration
      if (!window._hydrationErrorsDisabled) {
        const originalConsoleError = console.error;
        console.error = (...args) => {
          if (args[0] && typeof args[0] === 'string') {
            if (args[0].includes('Hydration') || 
                args[0].includes('Content does not match') ||
                args[0].includes('Text content did not match') ||
                args[0].includes('Expected server HTML')) {
              return;
            }
          }
          originalConsoleError(...args);
        };
        window._hydrationErrorsDisabled = true;
      }
    };

    // Run immediately and periodically check for errors
    disableHydrationErrors();
    const interval = setInterval(disableHydrationErrors, 200);

    // Set up a MutationObserver to catch new error elements as they're added to the DOM
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(() => {
        disableHydrationErrors();
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  return null;
} 