/**
 * FirstVisitorCelebration Module
 * Detects first-time visitors and triggers a celebration with confetti and welcome toast
 * 
 * Requires: canvas-confetti library
 * Usage: FirstVisitorCelebration.init()
 */

const FirstVisitorCelebration = (() => {
  // Configuration
  const config = {
    storageKey: 'maths_visitor_visited',
    toastDuration: 5000, // 5 seconds
    initialDelay: 1000, // 1 second - allows page to load before celebration
    confettiDuration: 3000, // 3 seconds of confetti
  };

  // State
  let isInitialized = false;
  let toastElement = null;

  /**
   * Check if user is a first-time visitor
   */
  const isFirstTimeVisitor = () => {
    try {
      const visited = localStorage.getItem(config.storageKey);
      return !visited;
    } catch (error) {
      console.warn('localStorage access failed:', error);
      return false; // Fallback: don't trigger if localStorage unavailable
    }
  };

  /**
   * Mark user as visited
   */
  const markAsVisited = () => {
    try {
      localStorage.setItem(config.storageKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        version: '1.0',
      }));
    } catch (error) {
      console.warn('Failed to save visitor flag:', error);
    }
  };

  /**
   * Create and display welcome toast
   */
  const showWelcomeToast = () => {
    return new Promise((resolve) => {
      // Create toast container
      toastElement = document.createElement('div');
      toastElement.className = 'welcome-toast';
      toastElement.setAttribute('role', 'alert');
      toastElement.setAttribute('aria-live', 'polite');
      toastElement.innerHTML = `
        <div class="toast-content">
          <h2>Welcome to the Community!</h2>
          <p>We're excited to have you here.</p>
        </div>
      `;

      // Add to DOM
      document.body.appendChild(toastElement);

      // Trigger animation
      requestAnimationFrame(() => {
        toastElement.classList.add('show');
      });

      // Remove after specified duration
      setTimeout(() => {
        toastElement.classList.remove('show');
        
        // Remove from DOM after fade out animation
        setTimeout(() => {
          if (toastElement && toastElement.parentNode) {
            toastElement.parentNode.removeChild(toastElement);
          }
          toastElement = null;
          resolve();
        }, 300); // Match CSS transition duration
      }, config.toastDuration);
    });
  };

  /**
   * Trigger confetti celebration using canvas-confetti
   */
  const triggerConfetti = () => {
    return new Promise((resolve) => {
      // Check if confetti library is available
      if (typeof confetti !== 'function') {
        console.warn('canvas-confetti library not loaded');
        resolve();
        return;
      }

      // Initial burst
      confetti({
        particleCount: 100,
        spread: 360,
        duration: config.confettiDuration,
      });

      // Left side burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 60,
          spread: 45,
          origin: { x: 0, y: 0.8 },
          duration: config.confettiDuration,
        });
      }, 150);

      // Right side burst
      setTimeout(() => {
        confetti({
          particleCount: 60,
          angle: 120,
          spread: 45,
          origin: { x: 1, y: 0.8 },
          duration: config.confettiDuration,
        });
      }, 300);

      // Resolve after confetti animation completes
      setTimeout(resolve, config.confettiDuration + 500);
    });
  };

  /**
   * Main initialization function
   * Detects first-time visitor and triggers celebration
   */
  const init = () => {
    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Check if first-time visitor
    if (!isFirstTimeVisitor()) {
      return;
    }

    // Mark as visited immediately
    markAsVisited();

    // Delay celebration to avoid interfering with page load
    const triggerCelebration = async () => {
      try {
        // Run confetti and toast in parallel for better UX
        await Promise.all([
          triggerConfetti(),
          showWelcomeToast(),
        ]);
      } catch (error) {
        console.error('Error during celebration:', error);
      }
    };

    // Use window.onload as primary trigger, with fallback delay
    if (document.readyState === 'loading') {
      window.addEventListener('load', triggerCelebration);
    } else {
      // Page already loaded, use setTimeout fallback
      setTimeout(triggerCelebration, config.initialDelay);
    }
  };

  /**
   * Public API - allow resetting for testing/development
   */
  const reset = () => {
    try {
      localStorage.removeItem(config.storageKey);
      isInitialized = false;
      console.log('Visitor flag reset. Celebration will trigger on next visit.');
    } catch (error) {
      console.warn('Failed to reset visitor flag:', error);
    }
  };

  /**
   * Expose public methods
   */
  return {
    init,
    reset,
    isFirstTimeVisitor, // Expose for debugging
  };
})();

// Auto-initialize when module loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => FirstVisitorCelebration.init());
} else {
  FirstVisitorCelebration.init();
}
