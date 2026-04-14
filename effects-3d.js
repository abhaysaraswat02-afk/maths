/**
 * 3D Effects Module - Interactive 3D Mouse Tracking
 * Adds dynamic 3D card tilting, parallax effects, and advanced animations
 */

const Effects3D = (() => {
  /**
   * Initialize 3D tilt effect on cards
   * Tilts based on mouse position
   */
  const initTiltCards = (selector = '.badge, .stat-card, .achievement-card') => {
    const cards = document.querySelectorAll(selector);
    
    cards.forEach(card => {
      card.addEventListener('mousemove', handleMouseMove);
      card.addEventListener('mouseleave', handleMouseLeave);
    });
  };

  /**
   * Handle mouse move for 3D tilt effect
   */
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const mouseX = e.clientX - rect.left - centerX;
    const mouseY = e.clientY - rect.top - centerY;

    const rotationX = (mouseY / centerY) * 15;
    const rotationY = (mouseX / centerX) * 15;

    card.style.transform = `
      perspective(1000px) 
      rotateX(${-rotationX}deg) 
      rotateY(${rotationY}deg) 
      scale(1.08)
      translateZ(20px)
    `;

    card.style.boxShadow = `
      ${-mouseX / 5}px ${-mouseY / 5}px 60px rgba(59, 130, 246, 0.3),
      ${-mouseX / 10}px ${-mouseY / 10}px 30px rgba(139, 92, 246, 0.2)
    `;
  };

  /**
   * Reset card on mouse leave
   */
  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = `
      perspective(1000px) 
      rotateX(0) 
      rotateY(0) 
      scale(1)
      translateZ(0)
    `;
    card.style.boxShadow = '';
  };

  /**
   * Parallax scroll effect
   * Creates depth as user scrolls
   */
  const initParallax = (selector = '[data-parallax]') => {
    const elements = document.querySelectorAll(selector);
    
    if (elements.length === 0) return;

    window.addEventListener('scroll', () => {
      elements.forEach(el => {
        const depth = parseFloat(el.dataset.parallax) || 0.5;
        const yScroll = window.scrollY;
        el.style.transform = `perspective(1500px) translateZ(${yScroll * depth}px) translateY(${yScroll * depth * 0.5}px)`;
      });
    });
  };

  /**
   * Intersection Observer for reveal 3D animations
   * Animates elements as they come into view
   */
  const initReveal3D = (selector = '.reveal-3d') => {
    const elements = document.querySelectorAll(selector);
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  };

  /**
   * Add parallax depth to leaderboard entries
   */
  const initLeaderboardParallax = () => {
    const entries = document.querySelectorAll('.leaderboard-entry');
    
    entries.forEach((entry, index) => {
      entry.addEventListener('mousemove', (e) => {
        const depth = (index + 1) * 2;
        const rect = entry.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const x = (mouseX / rect.width - 0.5) * depth;
        const y = (mouseY / rect.height - 0.5) * depth;
        
        entry.style.transform = `
          perspective(1000px) 
          rotateX(${y}deg) 
          rotateY(${-x}deg) 
          translateZ(${depth}px)
        `;
      });

      entry.addEventListener('mouseleave', () => {
        entry.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  };

  /**
   * Create floating particles effect in background
   */
  const initFloatingParticles = (containerId = 'particles-bg') => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const particleCount = 20;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      particle.style.cssText = `
        position: fixed;
        width: ${Math.random() * 100 + 50}px;
        height: ${Math.random() * 100 + 50}px;
        background: radial-gradient(circle at 30% 30%, rgba(59, 130, 246, 0.3), rgba(139, 92, 246, 0.1));
        border-radius: 50%;
        pointer-events: none;
        z-index: -1;
        opacity: ${Math.random() * 0.5 + 0.1};
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        filter: blur(40px);
        animation: float-particle ${10 + Math.random() * 20}s infinite ease-in-out;
        transform-style: preserve-3d;
      `;
      fragment.appendChild(particle);
    }

    container.appendChild(fragment);

    // Add animation keyframes
    if (!document.getElementById('particle-animations')) {
      const style = document.createElement('style');
      style.id = 'particle-animations';
      style.textContent = `
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0) translateX(0) translateZ(0);
          }
          25% {
            transform: translateY(-100px) translateX(100px) translateZ(50px);
          }
          50% {
            transform: translateY(-200px) translateX(0) translateZ(100px);
          }
          75% {
            transform: translateY(-100px) translateX(-100px) translateZ(50px);
          }
        }
      `;
      document.head.appendChild(style);
    }
  };

  /**
   * Create mirror reflection effect on cards
   */
  const initMirrorEffect = (selector = '.badge.earned, .rank-badge.rank-1') => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const lightX = (x / rect.width) * 100;
        const lightY = (y / rect.height) * 100;

        el.style.backgroundImage = `
          radial-gradient(circle at ${lightX}% ${lightY}%, 
            rgba(255, 255, 255, 0.4), 
            transparent 50%)
        `;
      });

      el.addEventListener('mouseleave', () => {
        el.style.backgroundImage = '';
      });
    });
  };

  /**
   * Stagger animation for multiple elements
   */
  const staggerElements = (selector, delay = 50) => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach((el, index) => {
      el.style.animationDelay = `${index * delay}ms`;
      el.classList.add('stagger-in');
    });
  };

  /**
   * Create dynamic glow effect
   */
  const initDynamicGlow = (selector = '.neon-glow') => {
    const elements = document.querySelectorAll(selector);
    
    elements.forEach(el => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const intensity = Math.sqrt(x * x + y * y) / 100;
        const hue = (Math.atan2(y, x) * 180 / Math.PI + 180) % 360;

        el.style.boxShadow = `
          0 0 ${20 + intensity * 10}px hsl(${hue}, 100%, 50%, 0.5),
          0 0 ${40 + intensity * 20}px hsl(${hue + 60}, 100%, 50%, 0.3),
          inset 0 0 ${20 + intensity * 10}px rgba(255, 255, 255, 0.2)
        `;
      });

      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = `
          0 0 10px rgba(59, 130, 246, 0.5),
          0 0 20px rgba(139, 92, 246, 0.3),
          0 0 30px rgba(236, 72, 153, 0.2)
        `;
      });
    });
  };

  /**
   * Initialize all 3D effects
   */
  const initAll = () => {
    initTiltCards();
    initParallax();
    initReveal3D();
    initLeaderboardParallax();
    initMirrorEffect();
    initDynamicGlow();
    staggerElements('.badge');
  };

  /**
   * Public API
   */
  return {
    initTiltCards,
    initParallax,
    initReveal3D,
    initLeaderboardParallax,
    initFloatingParticles,
    initMirrorEffect,
    staggerElements,
    initDynamicGlow,
    initAll,
  };
})();

/**
 * Auto-initialize on page load
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    Effects3D.initAll();
  });
} else {
  Effects3D.initAll();
}
