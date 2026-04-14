/**
 * 3D EFFECTS SHOWCASE & QUICK REFERENCE
 * All 3D features in the gamification system
 */

// ============================================================================
// INTERACTIVE 3D FEATURES CHECKLIST
// ============================================================================

const Features3DChecklist = {
  // Card Effects
  cardTilting: "✓ Mouse tracking 3D card tilt (15° rotation)",
  cardScale: "✓ Dynamic scale on hover (1.1x)",
  cardShadow: "✓ Depth shadows follow mouse position",
  
  // Badge Effects
  badgeRotation: "✓ 360° floating animation",
  badgeGlow: "✓ Neon glow with color shifting",
  badgeFlip: "✓ 3D flip animation",
  
  // Level Effects
  levelBadgeRotate: "✓ 3D rotating level badge",
  levelBadgeGlow: "✓ Animated blur shadow",
  levelBadgeDepth: "✓ Multi-layer shadow depth",
  
  // Scroll Effects
  parallaxDepth: "✓ Scroll-based depth (translateZ)",
  parallaxRotation: "✓ Rotation changes during scroll",
  reveal3D: "✓ Staggered entrance from below",
  
  // UI Effects
  glassomorphism: "✓ Frosted glass with blur effect",
  dynamicGlow: "✓ Cursor-following neon glow",
  mirrorReflection: "✓ Light reflection on elements",
  
  // Background Effects
  floatingParticles: "✓ 20 animated particles",
  gradientShift: "✓ Animated color gradients",
  shimmerEffect: "✓ Shimmer animation on progress bars",
  
  // Animation Effects
  floatAnimation: "✓ Smooth 3D floating motion",
  pulseAnimation: "✓ 3D pulse with glow",
  staggerAnimation: "✓ Staggered entrance timing",
  depthScroll: "✓ Z-axis translation on scroll",
};

// ============================================================================
// QUICK START: ADD 3D TO ANY ELEMENT
// ============================================================================

/*
EXAMPLE 1: Make a card tilt on mouse hover
HTML:
<div class="stat-card">
  <div class="stat-value">150</div>
</div>

The card automatically gets 3D tilt from Effects3D.initTiltCards()
*/

/*
EXAMPLE 2: Add floating animation
HTML:
<div class="badge animate-float-3d">
  🏆
</div>

CSS adds the animation automatically.
*/

/*
EXAMPLE 3: Create parallax depth effect
HTML:
<div data-parallax="0.5">Content</div>
<div data-parallax="0.8">Deep content</div>

Higher parallax value = more depth effect
*/

/*
EXAMPLE 4: Make text 3D
HTML:
<h2 class="text-3d">Your Learning Journey 🚀</h2>

Adds gradient text with 3D shadow depth
*/

/*
EXAMPLE 5: Glass morphism effect
HTML:
<div class="glass-3d">
  Modern frosted glass UI
</div>

Blurred background with semi-transparent overlay
*/

// ============================================================================
// ADVANCED COMBINATIONS
// ============================================================================

/*
POWERFUL COMBINATION 1: "Floaty Card"
<div class="stat-card animate-float-3d neon-glow">
  <div class="stat-value">150</div>
</div>

Effect: Card floats smoothly AND has neon glow
*/

/*
POWERFUL COMBINATION 2: "Deep Badge"
<div class="badge earned animate-flip">
  🏆
</div>

Effect: Badge flips with 3D rotation as page loads
*/

/*
POWERFUL COMBINATION 3: "Glowing Leaderboard"
<div class="leaderboard-entry" data-parallax="0.3">
  <div class="rank-badge neon-glow">1</div>
</div>

Effect: Entry has parallax depth + rank has neon glow
*/

// ============================================================================
// VISUAL EFFECT DESCRIPTIONS
// ============================================================================

const EffectDescriptions = {
  "Tilt on Hover": {
    description: "Cards rotate in 3D based on mouse position",
    intensity: "15° rotation",
    performance: "Optimal",
    example: "Any card element with mouse move listener",
  },

  "Floating Animation": {
    description: "Smooth up/down motion with 3D perspective",
    intensity: "±12px vertical, ±20px Z-depth",
    performance: "Optimal",
    example: ".badge.animate-float-3d",
  },

  "Parallax Scroll": {
    description: "Elements move at different depths while scrolling",
    intensity: "0-100% of scroll speed × depth factor",
    performance: "Good (add will-change if needed)",
    example: '<div data-parallax="0.5"></div>',
  },

  "Neon Glow": {
    description: "Dynamic color-shifting glow that follows cursor",
    intensity: "Multi-layer blur (15px, 30px, 45px)",
    performance: "Good",
    example: ".element.neon-glow",
  },

  "Glass Morphism": {
    description: "Frosted glass effect with blur backdrop",
    intensity: "12px blur with 70% opacity",
    performance: "Optimal",
    example: ".glass-3d",
  },

  "Mirror Reflection": {
    description: "Light spot follows cursor on element",
    intensity: "Radial gradient, up to 100% opacity at center",
    performance: "Good",
    example: ".badge.earned (hover effect)",
  },

  "Floating Particles": {
    description: "20 animated particles in background",
    intensity: "50-150px particles, 40px blur",
    performance: "Optimal",
    example: "Auto-initialized in background",
  },

  "3D Text": {
    description: "Gradient text with depth shadows",
    intensity: "Up to 12px text shadows",
    performance: "Optimal",
    example: ".text-3d",
  },

  "Stagger Animation": {
    description: "Sequential entrance animation for elements",
    intensity: "50-100ms delay per element",
    performance: "Optimal",
    example: "Effects3D.staggerElements('.badge', 50)",
  },

  "Reveal on Scroll": {
    description: "3D popup effect as elements enter view",
    intensity: "45° rotation → 0°, scale 0.9 → 1",
    performance: "Good",
    example: ".reveal-3d (auto-triggered)",
  },
};

// ============================================================================
// BROWSER COMPATIBILITY CHECK
// ============================================================================

const check3DSupport = () => {
  const element = document.createElement('div');
  const style = element.style;

  // Check individual transform properties
  const hasTransform = 'transform' in style || 'webkitTransform' in style;
  const hasPreserve3D = 'transformStyle' in style;
  const hasPerspective = 'perspective' in style;
  const hasFilter = 'filter' in style;

  return {
    supported: hasTransform && hasPreserve3D && hasPerspective,
    transform: hasTransform,
    preserve3D: hasPreserve3D,
    perspective: hasPerspective,
    filters: hasFilter,
    message: (hasTransform && hasPreserve3D && hasPerspective) 
      ? "✓ Full 3D support detected"
      : "⚠ Partial 3D support - some effects may be limited",
  };
};

// Run check on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('3D Effects Support:', check3DSupport());
  });
} else {
  console.log('3D Effects Support:', check3DSupport());
}

// ============================================================================
// CUSTOMIZATION PRESETS
// ============================================================================

/*
PRESET 1: "Minimal 3D" - Light effects, great performance
- Only card tilt on hover
- No floating particles
- Reduced animation durations
- Perfect for low-end devices

PRESET 2: "Standard 3D" - Balanced effects and performance
- Card tilt + parallax
- Floating particles enabled
- Moderate animation durations
- Good on most devices

PRESET 3: "Maximum 3D" - All effects enabled
- All card tilts, parallax, particles
- Dynamic glow, mirror effects
- Full animation suite
- Best on modern devices

PRESET 4: "Focus & Flow" - Effects during interaction only
- 3D only on hover/focus
- No continuous animations
- Minimal GPU usage
- Best for accessibility
*/

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

const monitor3DPerformance = {
  startMonitoring() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        });
        observer.observe({ entryTypes: ['measure'] });
      } catch (e) {
        console.log('Performance monitoring not available');
      }
    }
  },

  markStart(name) {
    if ('performance' in window) {
      performance.mark(`${name}-start`);
    }
  },

  markEnd(name) {
    if ('performance' in window) {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch (e) {
        console.log(`Could not measure ${name}`);
      }
    }
  },
};

// ============================================================================
// EFFECT TOGGLE UTILITY
// ============================================================================

const EffectToggle = {
  effects: {
    tilt: true,
    parallax: true,
    particles: true,
    glow: true,
    animations: true,
  },

  disable(effectName) {
    this.effects[effectName] = false;
    console.log(`Disabled: ${effectName}`);
  },

  enable(effectName) {
    this.effects[effectName] = true;
    console.log(`Enabled: ${effectName}`);
  },

  disableAll() {
    Object.keys(this.effects).forEach(key => {
      this.effects[key] = false;
    });
  },

  enableAll() {
    Object.keys(this.effects).forEach(key => {
      this.effects[key] = true;
    });
  },

  status() {
    console.table(this.effects);
  },
};

// ============================================================================
// QUICK VALIDATION
// ============================================================================

console.log('═══════════════════════════════════════');
console.log('3D EFFECTS MODULE - LOADED');
console.log('═══════════════════════════════════════');
console.log(check3DSupport());
console.log('Available Features:', Object.keys(Features3DChecklist).length);
console.log('\nUsage:');
console.log('• Effects3D.initAll() - Start all effects');
console.log('• monitor3DPerformance.startMonitoring() - Monitor FPS');
console.log('• EffectToggle.status() - View effect status');
