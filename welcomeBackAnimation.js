/**
 * WelcomeBack Animation Module
 * Detects returning visitors and triggers an animated welcome-back notification
 * Tracks visit count and shows personalized welcome messages
 * 
 * Usage: WelcomeBackAnimation.init()
 */

const WelcomeBackAnimation = (() => {
  // Configuration
  const config = {
    storageKey: 'maths_visit_tracking',
    toastDuration: 4000, // 4 seconds
    initialDelay: 800, // 0.8 seconds - allows page to load before animation
    animationDuration: 0.6,
  };

  // State
  let isInitialized = false;
  let toastElement = null;
  let visitData = null;

  /**
   * Get or create visit tracking data
   */
  const getVisitData = () => {
    try {
      const stored = localStorage.getItem(config.storageKey);
      if (!stored) {
        const newData = {
          visits: 1,
          lastVisit: new Date().toISOString(),
          firstVisit: new Date().toISOString(),
        };
        localStorage.setItem(config.storageKey, JSON.stringify(newData));
        return newData;
      }
      return JSON.parse(stored);
    } catch (error) {
      console.warn('localStorage access failed:', error);
      return null;
    }
  };

  /**
   * Update visit tracking data
   */
  const updateVisitData = () => {
    try {
      visitData = getVisitData();
      if (visitData && visitData.visits === 1) {
        // Don't show welcome-back on first visit, already handled by FirstVisitorCelebration
        return false;
      }
      
      if (visitData) {
        visitData.visits += 1;
        visitData.lastVisit = new Date().toISOString();
        localStorage.setItem(config.storageKey, JSON.stringify(visitData));
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Failed to update visit data:', error);
      return false;
    }
  };

  /**
   * Get welcome message based on visit count
   */
  const getWelcomeMessage = () => {
    if (!visitData || !visitData.visits) return { title: 'Welcome!', message: 'Great to see you here!' };

    const visits = visitData.visits;
    const messages = [
      { title: 'Welcome Back!', message: 'Ready to learn more math?' },
      { title: '👋 Welcome Back!', message: 'You\'re on a roll!' },
      { title: '🌟 Welcome Back!', message: 'You\'ve visited us ' + visits + ' times. Keep it up!' },
      { title: '💪 Welcome Back!', message: 'You\'re a regular now! Let\'s solve more problems.' },
      { title: '🏆 Welcome Back!', message: 'Visit #' + visits + '! You\'re a dedicated learner!' },
      { title: '🎯 Welcome Back!', message: 'We love seeing you return. Keep learning!' },
      { title: '⭐ Superb Return!', message: 'This is your #' + visits + ' visit. Amazing dedication!' },
    ];

    // Select message based on visit count
    const index = Math.min(visits - 2, messages.length - 1);
    return messages[Math.max(0, index)];
  };

  /**
   * Get animation intensity based on visit count
   */
  const getAnimationIntensity = () => {
    if (!visitData || !visitData.visits) return 'low';
    const visits = visitData.visits;
    if (visits <= 3) return 'low';
    if (visits <= 7) return 'medium';
    return 'high';
  };

  /**
   * Create and display welcome-back toast
   */
  const showWelcomeBackToast = (title, message, intensity) => {
    return new Promise((resolve) => {
      // Create toast container
      toastElement = document.createElement('div');
      toastElement.className = `welcome-back-toast welcome-back-${intensity}`;
      toastElement.setAttribute('role', 'alert');
      toastElement.setAttribute('aria-live', 'polite');
      toastElement.setAttribute('aria-label', title);
      
      toastElement.innerHTML = `
        <div class="welcome-back-content">
          <div class="welcome-back-title">${title}</div>
          <div class="welcome-back-message">${message}</div>
          <div class="welcome-back-progress">
            <div class="progress-bar"></div>
          </div>
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
        }, 300);
      }, config.toastDuration);
    });
  };

  /**
   * Create sparkle particles for celebration
   */
  const createSparkles = () => {
    const container = document.createElement('div');
    container.className = 'sparkle-container';
    document.body.appendChild(container);

    for (let i = 0; i < 12; i++) {
      const sparkle = document.createElement('div');
      sparkle.className = 'sparkle';
      sparkle.style.setProperty('--delay', `${i * 50}ms`);
      sparkle.style.setProperty('--duration', `${800 + Math.random() * 400}ms`);
      sparkle.style.left = Math.random() * 100 + '%';
      sparkle.style.top = Math.random() * 100 + '%';
      container.appendChild(sparkle);
    }

    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 1500);
  };

  /**
   * Trigger float animation for high intensity
   */
  const triggerFloatingHearts = () => {
    const container = document.createElement('div');
    container.className = 'hearts-container';
    document.body.appendChild(container);

    const hearts = ['❤️', '💙', '💚', '💛'];
    for (let i = 0; i < 8; i++) {
      const heart = document.createElement('div');
      heart.className = 'floating-heart';
      heart.textContent = hearts[i % hearts.length];
      heart.style.setProperty('--delay', `${i * 100}ms`);
      heart.style.left = Math.random() * 100 + '%';
      container.appendChild(heart);
    }

    setTimeout(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }, 2500);
  };

  /**
   * Main initialization function
   * Detects returning visitors and triggers welcome-back animation
   */
  const init = () => {
    // Prevent multiple initializations
    if (isInitialized) {
      return;
    }
    isInitialized = true;

    // Update visit tracking
    if (!updateVisitData()) {
      return;
    }

    // Delay animation to allow page load
    setTimeout(() => {
      const { title, message } = getWelcomeMessage();
      const intensity = getAnimationIntensity();

      // Show welcome-back toast
      showWelcomeBackToast(title, message, intensity).then(() => {
        // Trigger extra effects based on intensity
        if (intensity === 'medium') {
          createSparkles();
        } else if (intensity === 'high') {
          triggerFloatingHearts();
        }
      });
    }, config.initialDelay);
  };

  /**
   * Get visit count (useful for other features)
   */
  const getVisitCount = () => {
    const data = getVisitData();
    return data ? data.visits : 0;
  };

  /**
   * Get last visit date
   */
  const getLastVisitDate = () => {
    const data = getVisitData();
    return data ? new Date(data.lastVisit) : null;
  };

  // Public API
  return {
    init,
    getVisitCount,
    getLastVisitDate,
    getVisitData: () => visitData,
  };
})();

// Auto-initialize on page load if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', WelcomeBackAnimation.init);
} else {
  WelcomeBackAnimation.init();
}
