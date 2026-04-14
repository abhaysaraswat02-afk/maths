/**
 * INTEGRATION GUIDE: First Visitor Celebration
 * 
 * This module provides a clean, modular solution for detecting first-time visitors
 * and triggering a confetti celebration with a welcome toast notification.
 */

// ============================================================================
// STEP 1: Include Dependencies in Your HTML
// ============================================================================
/*
Add these lines to your HTML <head> section:

<!-- Canvas Confetti Library -->
<script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.0/dist/confetti.browser.min.js"></script>

<!-- First Visitor Celebration CSS -->
<link rel="stylesheet" href="firstVisitorCelebration.css">

<!-- First Visitor Celebration Module (place before closing </body> tag) -->
<script src="firstVisitorCelebration.js" defer></script>
*/

// ============================================================================
// STEP 2: How It Works
// ============================================================================
/*
1. The module auto-initializes on page load
2. It checks localStorage for a 'maths_visitor_visited' flag
3. On first visit:
   - Mark the user as visited
   - Wait 1 second for page to load
   - Trigger confetti animations
   - Show welcome toast (then fade out after 5 seconds)
4. On subsequent visits: Nothing happens (user already marked as visited)
*/

// ============================================================================
// STEP 3: Optional: Manual Initialization
// ============================================================================
/*
If you need to initialize manually or restart it:

// Initialize the celebration
FirstVisitorCelebration.init();

// Check if current user is first-time visitor
if (FirstVisitorCelebration.isFirstTimeVisitor()) {
  console.log('New visitor detected');
}

// Reset for testing/development (removes localStorage flag)
FirstVisitorCelebration.reset();
// After reset, refresh the page to see the celebration again
*/

// ============================================================================
// STEP 4: Customization
// ============================================================================
/*
To customize timing or behavior, edit the 'config' object in firstVisitorCelebration.js:

const config = {
  storageKey: 'maths_visitor_visited',     // Change if needed
  toastDuration: 5000,                     // Toast display time (ms)
  initialDelay: 1000,                      // Delay before celebration (ms)
  confettiDuration: 3000,                  // Confetti animation length (ms)
};
*/

// ============================================================================
// STEP 5: Features
// ============================================================================
/*
✓ Modular IIFE pattern - clean namespace, no global variables
✓ Error handling - graceful fallback if localStorage unavailable
✓ Non-blocking - celebration starts after page load completes
✓ Cursor-free confetti rendering - doesn't interfere with user interaction
✓ Performance optimized - runs celebration async, doesn't block DOM
✓ Accessibility - ARIA attributes, respects prefers-reduced-motion
✓ Responsive - looks good on mobile and desktop
✓ Reusable - one-time initialization per page
✓ Testable - includes reset() method for development
*/

// ============================================================================
// STEP 6: Troubleshooting
// ============================================================================
/*
Issue: Confetti not showing
- Verify canvas-confetti CDN is loaded: check browser console
- Ensure JavaScript is enabled
- Check browser console for errors

Issue: Toast not appearing
- Check CSS file is loaded: inspect styles in DevTools
- Verify no CSS conflicts with .welcome-toast class
- Check box-shadow and backdrop-filter support

Issue: Celebration triggers on every visit
- Reset localStorage: FirstVisitorCelebration.reset()
- Check storage quota: localStorage might be full
- Verify storageKey matches across pages

Issue: Performance lag on slow devices
- Increase initialDelay value
- Reduce confettiDuration
- Consider disabling on low-end devices using device detection
*/

// ============================================================================
// STEP 7: Browser Support
// ============================================================================
/*
Modern browsers (all features):
- Chrome 76+
- Firefox 68+
- Safari 12+
- Edge 79+

Graceful degradation:
- Older browsers: catches confetti library load errors
- LocalStorage unavailable: celebration skips (doesn't error)
- CSS backdrop-filter not supported: displays solid background
*/

// ============================================================================
// EXAMPLE: Full HTML Integration
// ============================================================================
/*
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome</title>
  
  <!-- First Visitor Celebration CSS -->
  <link rel="stylesheet" href="firstVisitorCelebration.css">
  
  <!-- Other CSS files -->
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Your page content here -->
  
  <!-- Canvas Confetti Library -->
  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.0/dist/confetti.browser.min.js"></script>
  
  <!-- First Visitor Celebration Module -->
  <script src="firstVisitorCelebration.js" defer></script>
  
  <!-- Other scripts -->
  <script src="app.js" defer></script>
</body>
</html>
*/
