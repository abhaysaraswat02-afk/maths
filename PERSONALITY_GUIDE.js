/**
 * PERSONALITY ENHANCEMENT GUIDE
 * Make Era of MathAntics feel HUMAN, not AI-generated!
 */

// ============================================================================
// STEP 1: UPDATE HTML TO USE PERSONALITY CSS
// ============================================================================
/*
In your index.html and student.html, update the <head>:

BEFORE (AI-lookinng):
<link rel="stylesheet" href="gamification.css">

AFTER (With Personality):
<link rel="stylesheet" href="gamification.css">
<link rel="stylesheet" href="gamification-personality.css">

The personality CSS overrides generic styles with BOLD colors and quirkiness!
*/

// ============================================================================
// KEY PERSONALITY FEATURES ADDED
// ============================================================================
/*
1. BOLD COLORS instead of muted pastels:
   - Electric Blue #0066FF
   - Neon Purple #B300FF
   - Hot Pink #FF006E
   - Sunset Orange #FF9500
   - Vibrant Red #FF6B35
   - Electric Lime #00FF41

2. QUIRKY SHAPES:
   - Irregular borders (border-radius: 25% 75% 8% 92%)
   - Dashed borders (instead of solid)
   - Slightly rotated elements (-1deg to 1deg)

3. PLAYFUL ANIMATIONS:
   - Bouncing effects
   - Spinning icons
   - Pulsing glows
   - Wild fire animation

4. HANDCRAFTED FEEL:
   - Offset shadows (not directly below)
   - Rotated text and elements
   - Asymmetrical layouts
   - Imperfect spacing

5. PERSONALITY TOUCHES:
   - Emojis and symbols
   - Fun hover effects
   - Gradient text
   - Drop shadows for depth
*/

// ============================================================================
// RECOMMENDED CHANGES TO HTML
// ============================================================================
/*
1. Update section headers to use bold colors:

BEFORE:
<h2 class="text-3xl font-bold text-slate-900 mb-8">Your Learning Journey 🚀</h2>

AFTER:
<h2 class="text-4xl font-black mb-8" style="background: linear-gradient(135deg, #FF6B35, #B300FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent; transform: rotate(-2deg);">
  🚀 Your Learning Journey 🚀
</h2>

2. Add decorative elements with emojis:

<div class="relative py-12">
  <div class="absolute -top-8 left-10 text-4xl opacity-30 animate-bounce">⭐</div>
  <div class="absolute -bottom-8 right-10 text-4xl opacity-30 animate-bounce" style="animation-delay: 0.3s;">✨</div>
  <!-- Your content here -->
</div>

3. Use colorful badges instead of generic text:

BEFORE:
<span class="bg-slate-900 text-white px-4 py-2 rounded">Badge</span>

AFTER:
<span style="background: linear-gradient(135deg, #FF6B35, #FF006E); color: white; padding: 0.75rem 1.5rem; border-radius: 50px; font-weight: 900; box-shadow: 0 6px 20px rgba(255, 107, 53, 0.4);">
  🏆 Amazing Badge!
</span>
*/

// ============================================================================
// CSS PERSONALITY SNIPPETS FOR ENTIRE WEBSITE
// ============================================================================
/*
Add these to your main style.css to make the whole site feel less AI-like:

1. BOLD HEADER STYLING:
h1, h2, h3 { 
  font-weight: 900 !important;
  letter-spacing: 1px;
  transform: rotate(-0.5deg);
}

h1 {
  background: linear-gradient(135deg, #FF6B35, #B300FF, #00FF41);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 3.5rem;
}

h2 {
  transform: rotate(-1deg);
  text-shadow: 3px 3px 0px rgba(0, 0, 0, 0.1);
}

2. COLORFUL BUTTONS:
.btn, button {
  border-radius: 20px;
  font-weight: 900;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  transform: rotate(-1deg);
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35, #FF006E);
}

.btn-primary:hover {
  transform: rotate(1deg) translateY(-4px);
  box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
}

3. QUIRKY CARDS:
.card {
  border: 3px dashed #00FF41;
  border-radius: 20px;
  box-shadow: -4px 4px 0px rgba(179, 0, 255, 0.2);
  transform: rotate(-0.5deg);
}

.card:hover {
  transform: rotate(0.5deg) translateY(-8px);
  box-shadow: -8px 8px 0px rgba(255, 107, 53, 0.3);
}

4. FUN GRADIENTS:
.gradient-text {
  background: linear-gradient(135deg, #FF6B35, #0066FF, #B300FF, #00FF41);
  background-size: 200% 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradient-shift 8s ease infinite;
}

@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

5. PLAYFUL EMOJI ANIMATIONS:
.emoji-bounce {
  display: inline-block;
  animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.emoji-spin {
  display: inline-block;
  animation: spin 3s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.emoji-pulse {
  animation: emoji-pulse 2s ease-in-out infinite;
}

@keyframes emoji-pulse {
  0%, 100% { font-size: 1rem; opacity: 1; }
  50% { font-size: 1.2rem; opacity: 0.8; }
}

6. ASYMMETRICAL LAYOUT:
.section-decorative {
  position: relative;
}

.section-decorative::before {
  content: '✨';
  position: absolute;
  top: -30px;
  left: 20%;
  font-size: 3rem;
  opacity: 0.3;
  animation: float 4s ease-in-out infinite;
}

.section-decorative::after {
  content: '🎯';
  position: absolute;
  bottom: -30px;
  right: 15%;
  font-size: 3rem;
  opacity: 0.3;
  animation: float 4s ease-in-out infinite 0.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(5deg); }
}

7. OFFSETS FOR HANDCRAFTED FEEL:
.handcrafted-shadow {
  box-shadow: 
    -4px 4px 0px rgba(255, 107, 53, 0.3),
    -8px 8px 0px rgba(179, 0, 255, 0.2),
    0 20px 40px rgba(0, 0, 0, 0.1);
}

8. BOLD DIVIDERS:
hr {
  border: none;
  height: 4px;
  background: linear-gradient(90deg, transparent, #FF6B35, #B300FF, #00FF41, transparent);
  margin: 2rem 0;
  border-radius: 2px;
}

.divider-fun::before,
.divider-fun::after {
  content: '✨';
  display: inline-block;
  margin: 0 0.5rem;
  opacity: 0.5;
}
*/

// ============================================================================
// PERSONALITY CHECKLIST FOR ENTIRE SITE
// ============================================================================
/*
Go through these and apply personality:

☐ Headers: Bold, colorful, slightly rotated
☐ Buttons: Gradient backgrounds, shadow offsets, smooth hover
☐ Cards: Dashed borders, quirky shapes, playful shadows
☐ Text: Some bold, some italic, some gradient
☐ Colors: Bold, vibrant (not muted pastels)
☐ Emojis: Add personality and visual interest
☐ Spacing: Asymmetrical (left-leaning where appropriate)
☐ Animations: Playful bounces, spins, floating
☐ Shadows: Offset (not directly below)
☐ Overall feel: Handmade, not corporate
☐ Typography: Mix fonts, bold headlines, varied sizes
☐ Hover effects: Interactions feel responsive and fun

PERSONALITY SCORE:
AI-like (0) ────────── Handcrafted (10)
0: Muted colors, perfect symmetry, sterile feel
10: Bold colors, quirky shapes, playful animations
*/

// ============================================================================
// QUICK PERSONALITY WINS
// ============================================================================
/*
Easy changes that make HUGE impact:

1. Add gradient text to h1/h2:
background: linear-gradient(135deg, #FF6B35, #B300FF);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;

2. Rotate elements slightly:
transform: rotate(-1deg);

3. Use offset shadows:
box-shadow: -4px 4px 0px rgba(255, 107, 53, 0.3);

4. Add dashed borders:
border: 3px dashed #00FF41;

5. Include playful emojis:
"🚀 Your Learning Journey 🎯"

6. Use bold weights:
font-weight: 900;

7. Add hover animations:
transition: all 0.3s ease;
transform: rotate(1deg) translateY(-4px);

8. Bold, UPPERCASE text:
text-transform: uppercase;
letter-spacing: 2px;

9. Colorful gradients over solid colors

10. Handcrafted shadows:
box-shadow: 
  -4px 4px 0px rgba(255, 107, 53, 0.3),
  -8px 8px 0px rgba(179, 0, 255, 0.2),
  0 20px 40px rgba(0, 0, 0, 0.1);
*/

// ============================================================================
// TYPOGRAPHY PERSONALITY
// ============================================================================
/*
Make text feel more human and less robotic:

Body text:
font-family: 'Inter', 'Segoe UI', sans-serif;
font-size: 1.05rem;
line-height: 1.7;
letter-spacing: 0.5px;

Headlines:
font-weight: 900;
letter-spacing: 1px;
margin-bottom: 1.5rem;

Accent text (use for emphasis):
font-weight: 700;
text-transform: uppercase;
letter-spacing: 2px;

Labels:
font-weight: 600;
font-size: 0.8rem;
text-transform: uppercase;
letter-spacing: 1.5px;

Mix variations for personality:
- Bold (900)
- Semi-bold (700)
- Regular (400)
- Different sizes (1rem, 1.25rem, 1.75rem, 2.5rem)
- Varied spacing
*/

// ============================================================================
// COLOR PALETTE FOR PERSONALITY
// ============================================================================
/*
Use these bold, vibrant colors instead of muted ones:

Primary Colors (use liberally):
--vibrant-red: #FF6B35 (warm, exciting)
--electric-blue: #0066FF (bold, energetic)
--neon-purple: #B300FF (mysterious, bold)

Accent Colors (use for highlights):
--hot-pink: #FF006E (electric, attention-grabbing)
--electric-lime: #00FF41 (fresh, energetic)
--sunset-orange: #FF9500 (warm, welcoming)

Neutral backdrop:
--deep-purple: #5A189A (for dark backgrounds)

Avoid:
- Gray (#94a3b8) - too corporate
- Muted blue (#3b82f6) - too generic
- Pale colors - too sterile

Use INSTEAD:
- Bold reds, blues, purples
- Neon greens and pinks  
- Warm oranges
- Deep purples for contrast
*/

// ============================================================================
// FINAL TIPS FOR NON-AI LOOK
// ============================================================================
/*
1. ASYMMETRY IS KEY
   - Don't center everything
   - Offset elements
   - Stagger layouts

2. CELEBRATE IMPERFECTION
   - Slightly rotated text (-1deg to 1deg)
   - Irregular shapes
   - Uneven spacing

3. ADD PERSONALITY
   - Use emojis liberally
   - Add quirky labels
   - Include fun copy

4. BOLD > SUBTLE
   - Bold colors, not pastels
   - Big fonts, not tiny
   - Clear hierarchy

5. HANDMADE VIBES
   - Dashed instead of solid borders
   - Offset shadows (not centered)
   - Text shadows with depth
   - Playful font weights

6. FUN INTERACTIONS
   - Responsive hover effects
   - Bouncy animations
   - Color changes on interaction
   - Satisfying feedback

7. MIX STYLES
   - Don't be perfectly consistent
   - Vary border styles, shadows, colors
   - Different cards look slightly different
   - Feels more authentic

Result: Website feels HANDCRAFTED, not AI-generated!
*/
