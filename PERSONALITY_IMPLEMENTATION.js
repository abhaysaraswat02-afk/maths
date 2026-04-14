/**
 * PRACTICAL PERSONALITY IMPLEMENTATION
 * Copy-paste solutions to make your website look handcrafted, not AI-made
 */

// ============================================================================
// SECTION 1: ADD TO YOUR MAIN CSS FILE (style.css or <style> tag)
// ============================================================================

// Paste this CSS into your main stylesheet to add personality to the entire site:

const css_personality_overrides = `
/* ===== TYPOGRAPHY WITH PERSONALITY ===== */

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: linear-gradient(135deg, #f0f4ff 0%, #ffe0f0 100%);
}

h1, h2, h3 {
  font-weight: 900 !important;
  letter-spacing: 1px;
}

h1 {
  transform: rotate(-2deg);
  background: linear-gradient(135deg, #FF6B35, #B300FF, #00FF41);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: clamp(2rem, 8vw, 4.5rem);
  margin-bottom: 1.5rem;
}

h2 {
  transform: rotate(-1deg);
  position: relative;
  display: inline-block;
  color: #1a1a1a;
}

h2::before {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, #FF6B35, #B300FF, #00FF41);
  border-radius: 2px;
  transform: scaleX(1.1);
}

h3 {
  color: #0066FF;
  text-shadow: 2px 2px 0px rgba(255, 107, 53, 0.1);
}

/* ===== BUTTON PERSONALITY ===== */

button, .btn, [role="button"] {
  border: none;
  border-radius: 25px;
  font-weight: 900;
  font-size: 1rem;
  padding: 0.75rem 2rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

button:hover, .btn:hover {
  transform: translateY(-4px) rotate(1deg);
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.25);
}

button:active, .btn:active {
  transform: translateY(-2px) rotate(0deg);
}

.btn-primary {
  background: linear-gradient(135deg, #FF6B35, #FF006E);
  color: white;
}

.btn-secondary {
  background: linear-gradient(135deg, #0066FF, #B300FF);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #00FF41, #FF9500);
  color: #1a1a1a;
  font-weight: 900;
}

/* ===== CARD PERSONALITY ===== */

.card, [class*="card"], article {
  border: 3px dashed rgba(0, 102, 255, 0.5);
  border-radius: 20px;
  padding: 2rem;
  background: white;
  box-shadow: 
    -4px 4px 0px rgba(255, 107, 53, 0.15),
    -8px 8px 0px rgba(179, 0, 255, 0.1),
    0 20px 40px rgba(0, 0, 0, 0.08);
  transform: rotate(-0.5deg);
  transition: all 0.3s ease;
}

.card:hover, [class*="card"]:hover {
  transform: rotate(0.5deg) translateY(-8px);
  box-shadow: 
    -6px 6px 0px rgba(255, 107, 53, 0.2),
    -12px 12px 0px rgba(179, 0, 255, 0.15),
    0 25px 50px rgba(0, 0, 0, 0.12);
}

/* ===== TEXT HIGHLIGHTS ===== */

.text-bold {
  font-weight: 900;
  color: #FF6B35;
}

.text-highlight {
  background: linear-gradient(135deg, #FFEB3B, #FF9500);
  padding: 0.2em 0.4em;
  border-radius: 5px;
  font-weight: 700;
}

.text-gradient {
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

/* ===== DIVIDERS & SEPARATORS ===== */

hr {
  border: none;
  height: 4px;
  background: linear-gradient(90deg, transparent, #FF6B35, #B300FF, #00FF41, transparent);
  margin: 3rem 0;
  border-radius: 2px;
}

.divider-with-emoji::before,
.divider-with-emoji::after {
  content: '✨';
  display: inline-block;
  margin: 0 0.5rem;
  opacity: 0.5;
  font-size: 1.5rem;
}

.section-divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
  color: #666;
}

.section-divider::before,
.section-divider::after {
  content: '';
  flex: 1;
  height: 3px;
  background: linear-gradient(90deg, transparent, #B300FF, transparent);
}

/* ===== DECORATIVE ELEMENTS ===== */

.emoji-bounce {
  display: inline-block;
  animation: emoji-bounce 2s ease-in-out infinite;
}

@keyframes emoji-bounce {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-10px) rotate(-5deg); }
}

.emoji-spin {
  display: inline-block;
  animation: emoji-spin 3s linear infinite;
}

@keyframes emoji-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.emoji-pulse {
  animation: emoji-pulse 2s ease-in-out infinite;
}

@keyframes emoji-pulse {
  0%, 100% { transform: scale(1) opacity(1); }
  50% { transform: scale(1.1) opacity(0.8); }
}

/* ===== PERSONALITY BADGES ===== */

.badge, [class*="badge"] {
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 50px;
  font-weight: 900;
  font-size: 0.85rem;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.15);
  transform: rotate(-1deg);
}

.badge-success {
  background: linear-gradient(135deg, #00FF41, #FF9500);
  color: #1a1a1a;
}

.badge-primary {
  background: linear-gradient(135deg, #FF6B35, #FF006E);
  color: white;
}

.badge-info {
  background: linear-gradient(135deg, #0066FF, #B300FF);
  color: white;
}

.badge:nth-child(2n) {
  transform: rotate(1deg);
}

/* ===== SECTION STYLING ===== */

section {
  position: relative;
  padding: 4rem 2rem;
}

section::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 10%;
  font-size: 3rem;
  opacity: 0.2;
  pointer-events: none;
}

.section-title {
  position: relative;
  margin-bottom: 3rem;
}

.section-title::after {
  content: '';
  display: block;
  width: 80px;
  height: 6px;
  background: linear-gradient(90deg, #FF6B35, #B300FF);
  margin-top: 1rem;
  border-radius: 3px;
}

/* ===== INPUT PERSONALITY ===== */

input, textarea, select {
  border: 3px solid #F0F0F0;
  border-radius: 15px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

input:focus, textarea:focus, select:focus {
  outline: none;
  border-color: #FF6B35;
  box-shadow: 
    0 0 0 3px rgba(255, 107, 53, 0.1),
    0 8px 20px rgba(255, 107, 53, 0.2);
  transform: scale(1.02);
}

/* ===== ALERT BOXES ===== */

.alert, [class*="alert"] {
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  border-left: 5px solid;
  transform: rotate(-0.5deg);
}

.alert-success {
  background: #E8F5E9;
  border-color: #00FF41;
  color: #1b5e20;
}

.alert-warning {
  background: #FFF3E0;
  border-color: #FF9500;
  color: #e65100;
}

.alert-danger {
  background: #FFEBEE;
  border-color: #FF006E;
  color: #c62828;
}

.alert-info {
  background: #E3F2FD;
  border-color: #0066FF;
  color: #0d47a1;
}

/* ===== GENERAL PERSONALITY ===== */

.text-center {
  text-align: center;
}

.text-bold {
  font-weight: 900;
}

.text-italic {
  font-style: italic;
}

.shadow-handcrafted {
  box-shadow: 
    -4px 4px 0px rgba(255, 107, 53, 0.3),
    -8px 8px 0px rgba(179, 0, 255, 0.2),
    0 20px 40px rgba(0, 0, 0, 0.1);
}

.rotate-left {
  transform: rotate(-1deg);
}

.rotate-right {
  transform: rotate(1deg);
}

.rotate-left:hover {
  transform: rotate(-2deg);
}

.rotate-right:hover {
  transform: rotate(2deg);
}

/* ===== LOADING & INTERACTION STATES ===== */

@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}

.shimmer {
  animation: shimmer 2s infinite;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  background-size: 1000px 100%;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 5px rgba(255, 107, 53, 0.5); }
  50% { box-shadow: 0 0 15px rgba(255, 107, 53, 0.8); }
}

.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
`;

// ============================================================================
// SECTION 2: UPDATE YOUR HTML - PRACTICAL EXAMPLES
// ============================================================================

const html_personality_examples = `
<!-- EXAMPLE 1: BOLD PAGE TITLE -->

<!-- BEFORE (AI-like, boring):
<h1 class="text-4xl font-bold text-gray-900">Welcome to Math Learning</h1>
-->

<!-- AFTER (Personality-driven):
<h1 class="emoji-bounce">
  🎯 Welcome to <span class="text-gradient">Math Learning</span> 🚀
</h1>
-->

<!-- EXAMPLE 2: COLORFUL BUTTON -->

<!-- BEFORE (generic):
<button class="bg-blue-600 text-white px-6 py-2 rounded">Continue</button>
-->

<!-- AFTER (personality):
<button class="btn btn-primary emoji-bounce">
  ✨ Let's Learn! 🚀
</button>
-->

<!-- EXAMPLE 3: DASHBOARD CARD -->

<!-- BEFORE (sterile):
<div class="bg-white rounded-lg shadow p-6">
  <h3 class="text-xl font-bold">Your Progress</h3>
  <p>You have completed 5 lessons</p>
</div>
-->

<!-- AFTER (personality):
<div class="card shadow-handcrafted">
  <h3 class="emoji-spin">📊 Your Progress</h3>
  <p class="text-lg">
    You've crushed <span class="text-bold" style="color: #FF6B35;">5 lessons</span>! 🔥
  </p>
  <div class="mt-4">
    <div class="text-4xl emoji-bounce">⭐⭐⭐⭐⭐</div>
  </div>
</div>
-->

<!-- EXAMPLE 4: SECTION WITH DECORATIVE ELEMENTS -->

<!-- BEFORE (boring layout):
<section>
  <h2>Learning Section</h2>
  <p>Some content here</p>
</section>
-->

<!-- AFTER (personality):
<section class="relative">
  <!-- Floating decorative emoji -->
  <div class="absolute -top-8 left-10 text-4xl emoji-bounce opacity-50">⭐</div>
  <div class="absolute -bottom-8 right-10 text-4xl emoji-pulse opacity-50">✨</div>
  
  <div class="section-title">
    <h2>📚 Learning Section</h2>
    <p class="text-gradient mt-2">Master mathematics with personality!</p>
  </div>
  
  <div class="my-6">Your content here</div>
  
  <!-- Divider with emoji -->
  <hr class="divider-with-emoji" />
</section>
-->

<!-- EXAMPLE 5: PROGRESS BAR WITH PERSONALITY -->

<!-- BEFORE (bland):
<div class="w-full bg-gray-200 rounded h-2">
  <div class="bg-blue-600 h-2 rounded w-1/2"></div>
</div>
-->

<!-- AFTER (personality):
<div class="mb-4">
  <div class="flex justify-between mb-2">
    <span class="font-bold text-gradient">Progress</span>
    <span class="text-bold" style="color: #FF6B35;">50%</span>
  </div>
  <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-lg">
    <div style="width: 50%; background: linear-gradient(90deg, #FF6B35, #B300FF); 
                height: 100%; border-radius: 2px; animation: shimmer 2s infinite;"></div>
  </div>
  <div class="mt-2 text-sm text-gray-600 emoji-bounce">
    🎯 Keep going! Almost there!
  </div>
</div>
-->

<!-- EXAMPLE 6: BADGE ROW -->

<!-- BEFORE (generic):
<div class="flex gap-2">
  <span class="bg-yellow-400 text-black px-3 py-1 rounded-full">Level 1</span>
  <span class="bg-blue-400 text-white px-3 py-1 rounded-full">Points</span>
</div>
-->

<!-- AFTER (personality):
<div class="flex gap-3 flex-wrap">
  <span class="badge badge-success emoji-bounce" style="animation-delay: 0s;">
    ⭐ Level 1
  </span>
  <span class="badge badge-primary emoji-bounce" style="animation-delay: 0.2s;">
    🏆 Points
  </span>
  <span class="badge badge-info emoji-bounce" style="animation-delay: 0.4s;">
    🔥 Streak
  </span>
</div>
-->

<!-- EXAMPLE 7: SUCCESS ALERT -->

<!-- BEFORE (plain):
<div class="bg-green-100 border-l-4 border-green-500 p-4">
  <p>Quiz completed successfully!</p>
</div>
-->

<!-- AFTER (personality):
<div class="alert alert-success">
  <div class="flex items-center gap-3">
    <span class="text-3xl emoji-spin">✨</span>
    <div>
      <p class="font-bold text-lg">Amazing! Quiz Complete! 🎉</p>
      <p>You nailed it! Keep up the momentum!</p>
    </div>
  </div>
</div>
-->

<!-- EXAMPLE 8: LEADERBOARD Entry -->

<!-- BEFORE (corporate):
<div class="flex justify-between items-center p-4 bg-gray-100">
  <span>John Doe</span>
  <span>1500 points</span>
</div>
-->

<!-- AFTER (personality):
<div class="card rotate-left mb-3 hover:scale-105 transition-all">
  <div class="flex justify-between items-center">
    <div class="flex items-center gap-3">
      <span class="text-3xl">🏆</span>
      <div>
        <p class="font-bold" style="color: #0066FF;">John Doe</p>
        <p class="text-sm text-gray-600">Math Master</p>
      </div>
    </div>
    <div style="background: linear-gradient(135deg, #FF6B35, #B300FF); 
                padding: 0.75rem 1.5rem; border-radius: 50px; 
                color: white; font-weight: 900; box-shadow: 0 6px 15px rgba(255, 107, 53, 0.3);">
      🔥 1500 PTS
    </div>
  </div>
</div>
-->
`;

// ============================================================================
// SECTION 3: COMPLETE PERSONALITY HTML TEMPLATE
// ============================================================================

const html_complete_example = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Math Learning Platform - Personality Version</title>
  
  <!-- Main Styles -->
  <link rel="stylesheet" href="style.css">
  <!-- IMPORTANT: Load personality CSS AFTER main CSS for overrides! -->
  <link rel="stylesheet" href="gamification.css">
  <link rel="stylesheet" href="gamification-personality.css">
</head>
<body>
  
  <!-- ===== HEADER WITH PERSONALITY ===== -->
  <header class="py-8 px-4 border-b-4" style="border-color: #FF6B35;">
    <div class="max-w-6xl mx-auto">
      <h1 class="text-5xl font-black emoji-bounce mb-2">
        🚀 Era of <span class="text-gradient">MathAntics</span> 🎯
      </h1>
      <p class="text-xl text-gray-700 ml-4">
        Learn math like never before <span class="text-bold" style="color: #B300FF;">with personality!</span>
      </p>
    </div>
  </header>

  <!-- ===== MAIN CONTENT ===== -->
  <main class="py-8">
    
    <!-- ===== WELCOME SECTION ===== -->
    <section class="max-w-6xl mx-auto px-4 relative mb-12">
      <div class="absolute -top-10 left-20 text-4xl emoji-bounce opacity-30">⭐</div>
      <div class="absolute -bottom-10 right-20 text-4xl emoji-pulse opacity-30">✨</div>
      
      <div class="section-title mb-8">
        <h2 class="text-4xl font-black">📚 Your Learning Journey</h2>
        <p class="text-gray-600 mt-4 text-lg">Pick a lesson and start learning!</p>
      </div>
      
      <hr class="divider-with-emoji my-8" />
    </section>

    <!-- ===== LESSONS GRID ===== -->
    <section class="max-w-6xl mx-auto px-4 mb-12">
      <div class="grid md:grid-cols-3 gap-6">
        
        <!-- Lesson Card 1 -->
        <div class="card shadow-handcrafted hover:scale-105 transition-all">
          <div class="text-5xl mb-4 emoji-bounce">➕</div>
          <h3 class="text-2xl font-black mb-2" style="color: #FF6B35;">Addition Basics</h3>
          <p class="text-gray-700 mb-4">Master the fundamentals of addition</p>
          <div class="flex gap-2 items-center mb-4">
            <span class="badge badge-success">⭐ Beginner</span>
            <span class="text-bold" style="color: #0066FF;">12 lessons</span>
          </div>
          <button class="btn btn-primary w-full">
            ✨ Start Learning
          </button>
        </div>

        <!-- Lesson Card 2 -->
        <div class="card shadow-handcrafted rotate-right hover:scale-105 transition-all">
          <div class="text-5xl mb-4 emoji-spin">➖</div>
          <h3 class="text-2xl font-black mb-2" style="color: #B300FF;">Subtraction</h3>
          <p class="text-gray-700 mb-4">Learn to subtract with confidence</p>
          <div class="flex gap-2 items-center mb-4">
            <span class="badge badge-primary">🏆 Intermediate</span>
            <span class="text-bold" style="color: #0066FF;">15 lessons</span>
          </div>
          <button class="btn btn-secondary w-full">
            🚀 Start Learning
          </button>
        </div>

        <!-- Lesson Card 3 -->
        <div class="card shadow-handcrafted hover:scale-105 transition-all">
          <div class="text-5xl mb-4 emoji-bounce">✖️</div>
          <h3 class="text-2xl font-black mb-2" style="color: #FF006E;">Multiplication</h3>
          <p class="text-gray-700 mb-4">Multiply like a pro</p>
          <div class="flex gap-2 items-center mb-4">
            <span class="badge badge-info">🔥 Advanced</span>
            <span class="text-bold" style="color: #0066FF;">18 lessons</span>
          </div>
          <button class="btn btn-success w-full">
            🎯 Start Learning
          </button>
        </div>

      </div>
    </section>

    <!-- ===== SUCCESS ALERT ===== -->
    <section class="max-w-6xl mx-auto px-4 mb-12">
      <div class="alert alert-success">
        <div class="flex items-center gap-3">
          <span class="text-3xl emoji-spin">✨</span>
          <div>
            <p class="font-bold text-lg">Congratulations! 🎉</p>
            <p>You just completed your first lesson! Keep the momentum going!</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== STATS SECTION ===== -->
    <section class="max-w-6xl mx-auto px-4">
      <div class="section-title mb-8">
        <h2 class="text-4xl font-black">📊 Your Progress</h2>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div class="card text-center shadow-handcrafted">
          <div class="text-5xl emoji-pulse mb-4">🎯</div>
          <p class="text-gray-600 text-sm font-bold uppercase tracking-widest">Total Points</p>
          <p class="text-4xl font-black" style="color: #FF6B35;">1,250 PTS</p>
        </div>

        <div class="card text-center shadow-handcrafted rotate-right">
          <div class="text-5xl emoji-spin mb-4">🔥</div>
          <p class="text-gray-600 text-sm font-bold uppercase tracking-widest">Current Streak</p>
          <p class="text-4xl font-black" style="color: #B300FF;">12 Days</p>
        </div>

        <div class="card text-center shadow-handcrafted">
          <div class="text-5xl emoji-bounce mb-4">⭐</div>
          <p class="text-gray-600 text-sm font-bold uppercase tracking-widest">Badges Earned</p>
          <p class="text-4xl font-black" style="color: #0066FF;">8</p>
        </div>
      </div>
    </section>

  </main>

  <!-- Include personality CSS files -->
  <script src="gamification.js"></script>
  <script src="effects-3d.js"></script>
  <script src="gamification-component.js"></script>

</body>
</html>
`;

console.log("PERSONALITY EXAMPLES READY TO USE!");
console.log("1. Copy the CSS from css_personality_overrides into your style.css");
console.log("2. Update your HTML using the examples in html_personality_examples");
console.log("3. Use the complete template in html_complete_example as a reference");
