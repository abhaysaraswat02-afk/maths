/**
 * 3D GAMIFICATION DASHBOARD - HTML TEMPLATE
 * Ready-to-use examples with all 3D effects
 */

const gamificationDashboardHTML3D = `
<!-- ================================================================
     3D GAMIFICATION DASHBOARD WITH ADVANCED EFFECTS
     ================================================================ -->
<section class="py-16 bg-gradient-to-br from-blue-50 via-purple-50 to-slate-50 relative overflow-hidden" 
         x-data="gamificationDashboard(authUser.uid)" 
         @init.window="init()" 
         x-cloak>
  
  <!-- Floating Particles Background -->
  <div id="particles-bg" class="absolute inset-0 pointer-events-none"></div>

  <div class="max-w-6xl mx-auto px-6 relative z-10">
    
    <!-- Hero Header with 3D Text -->
    <div class="mb-16 text-center">
      <h1 class="text-5xl font-black text-3d mb-4" style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);">
        Your Learning Journey 🚀
      </h1>
      <p class="text-xl text-slate-600" style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 100ms both;">
        Complete lessons, earn badges, climb the leaderboard!
      </p>
    </div>

    <!-- Level Card - 3D Enhanced -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
      <div class="lg:col-span-1 bg-white rounded-3xl shadow-2xl p-8 glass-3d neon-glow reveal-3d" 
           style="border: 1px solid rgba(255, 255, 255, 0.5); animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 200ms both;">
        <div class="text-center">
          <div class="level-badge animate-float-3d" 
               :class="'level-' + stats.currentLevel" 
               :style="'background: linear-gradient(135deg, ' + getLevelColor(stats.currentLevel) + ', ' + getLevelColor(stats.currentLevel) + ');'">
            <span x-text="stats.currentLevel"></span>
          </div>
          <p class="level-title text-2xl mt-6" x-text="stats.levelTitle"></p>
          <p class="text-sm text-slate-500 mt-2 font-semibold">Current Level</p>
        </div>
      </div>

      <!-- Points & Progress - 3D Glass Card -->
      <div class="lg:col-span-2 bg-white rounded-3xl shadow-2xl p-8 glass-3d reveal-3d"
           style="border: 1px solid rgba(255, 255, 255, 0.5); animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 300ms both;">
        <div class="flex justify-between items-center mb-6">
          <div>
            <p class="text-sm font-semibold text-slate-600 uppercase tracking-wider">Total Points</p>
            <div class="points-display text-4xl mt-2 animate-pulse-3d" x-text="formatNumber(stats.totalPoints)"></div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-slate-600 uppercase tracking-wider">Progress</p>
            <p class="text-3xl font-bold text-blue-600 mt-2" x-text="getProgressPercentage() + '%'"></p>
          </div>
        </div>
        <div class="level-progress">
          <div class="level-progress-fill" :style="'width: ' + getProgressPercentage() + '%'"></div>
        </div>
        <p class="text-xs text-slate-500 mt-3">
          <span x-text="stats.progress.toNextLevel.pointsNeeded"></span> points needed for 
          <strong x-text="'Level ' + stats.progress.toNextLevel.nextLevel"></strong>
        </p>
      </div>
    </div>

    <!-- Streak Counter - 3D Animated -->
    <div class="mb-16" x-show="stats && stats.streakDays > 0" 
         style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 400ms both;">
      <div class="streak-counter animate-pulse-3d neon-glow">
        <div class="streak-icon">🔥</div>
        <div class="streak-info flex-1">
          <h3>Learning Streak</h3>
          <div class="flex items-center gap-3 mt-3">
            <span class="streak-count" x-text="stats.streakDays"></span>
            <span class="text-sm text-yellow-800 font-semibold">Days in a row!</span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-sm font-bold text-yellow-900">Keep it going! 💪</p>
        </div>
      </div>
    </div>

    <!-- Statistics Grid - 3D Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      <div class="stat-card glass-3d animate-pulse-3d reveal-3d" 
           style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 500ms both;">
        <div class="stat-value" x-text="stats.lessonsCompleted"></div>
        <div class="stat-label">Lessons Completed</div>
      </div>
      <div class="stat-card glass-3d animate-pulse-3d reveal-3d" 
           style="border-top-color: #8b5cf6; animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 550ms both;">
        <div class="stat-value" x-text="stats.quizzesAttempted"></div>
        <div class="stat-label">Quizzes Attempted</div>
      </div>
      <div class="stat-card glass-3d animate-pulse-3d reveal-3d" 
           style="border-top-color: #ec4899; animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 600ms both;">
        <div class="stat-value" x-text="stats.perfectScores"></div>
        <div class="stat-label">Perfect Scores</div>
      </div>
      <div class="stat-card glass-3d animate-pulse-3d reveal-3d" 
           style="border-top-color: #f59e0b; animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 650ms both;">
        <div class="stat-value" x-text="stats.leaderboardRank || '-'"></div>
        <div class="stat-label">Leaderboard Rank</div>
      </div>
    </div>

    <!-- Badges Section - 3D Showcase -->
    <div class="mb-16">
      <h2 class="text-3xl font-bold text-slate-900 mb-8 text-3d" 
          style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 700ms both;">
        Achievements & Badges ✨
      </h2>
      <div class="badge-container">
        <template x-for="(badge, index) in badges" :key="badge.id">
          <div class="badge glass-3d neon-glow" 
               :class="{'earned': badge.earned, 'locked': !badge.earned}"
               @click="selectBadge(badge.key)" 
               :style="'animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ' + (750 + index * 30) + 'ms both;'">
            <div class="badge-icon" :x-text="badge.icon"></div>
            <div class="badge-name" x-text="badge.name"></div>
            <div class="badge-rarity" :class="badge.rarity.toLowerCase()" x-text="badge.rarity"></div>
          </div>
        </template>
      </div>
    </div>

    <!-- Leaderboard Section - 3D Enhanced -->
    <div class="mb-16">
      <h2 class="text-3xl font-bold text-slate-900 mb-8 text-3d"
          style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 800ms both;">
        🏆 Top Students Leaderboard
      </h2>
      <div class="leaderboard glass-3d reveal-3d"
           style="animation: stagger-in-3d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 850ms both;">
        <div class="leaderboard-header">
          <div>Rank</div>
          <div>Name</div>
          <div>Level</div>
          <div>Points</div>
          <div>Badges</div>
        </div>
        <div class="leaderboard-entries">
          <template x-for="(entry, index) in leaderboard" :key="entry.userId">
            <div class="leaderboard-entry" :data-parallax="0.3 + index * 0.05">
              <div class="rank-badge neon-glow" :class="'rank-' + (index + 1)" x-text="index + 1"></div>
              <div class="leaderboard-name" x-text="entry.username"></div>
              <div class="leaderboard-level">
                <div class="leaderboard-level-dot" :style="'background: ' + getLevelColor(entry.currentLevel)"></div>
                <span x-text="'Lvl ' + entry.currentLevel"></span>
              </div>
              <div class="leaderboard-points" x-text="formatNumber(entry.totalPoints)"></div>
              <div class="leaderboard-badges">
                <strong x-text="entry.badgeCount"></strong>
                <span>🏅</span>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

  </div>

  <!-- Badge Detail Modal - 3D Glass Effect -->
  <div x-show="showBadgeDetail" x-transition:enter="transition ease-out duration-300" 
       x-transition:enter-start="opacity-0 scale-90" x-transition:enter-end="opacity-100 scale-100"
       x-transition:leave="transition ease-in duration-300" x-transition:leave-start="opacity-100 scale-100"
       x-transition:leave-end="opacity-0 scale-90"
       class="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50" 
       @click="closeBadgeDetail()">
    <div class="bg-white rounded-3xl shadow-2xl p-12 max-w-md glass-3d neon-glow" 
         @click.stop 
         x-show="selectedBadge"
         x-transition:enter="transition ease-out duration-300" 
         x-transition:enter-start="opacity-0 scale-75 rotateX(45deg)" 
         x-transition:enter-end="opacity-100 scale-100 rotateX(0deg)">
      <div class="text-center mb-8">
        <div style="font-size: 5rem; margin-bottom: 1rem;" x-text="selectedBadge.icon"></div>
        <h3 class="text-3xl font-bold text-slate-900" x-text="selectedBadge.name"></h3>
        <p class="text-slate-600 mt-3 text-lg" x-text="selectedBadge.description"></p>
      </div>
      <div class="flex items-center justify-between mb-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl" 
           style="border: 1px solid rgba(59, 130, 246, 0.2);">
        <span class="text-sm font-bold text-slate-700 uppercase tracking-wider">Points Reward:</span>
        <span class="text-3xl font-black" style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent;" 
              x-text="selectedBadge.pointReward"></span>
      </div>
      <button @click="closeBadgeDetail()" class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 hover:shadow-lg">
        Close
      </button>
    </div>
  </div>

</section>

<!-- Level-up Notification 3D Style -->
<style>
  .level-up-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: perspective(1200px) translate(-50%, -50%) scale(0.6) rotateX(45deg);
    opacity: 0;
    z-index: 9999;
    transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-style: preserve-3d;
  }

  .level-up-notification.show {
    opacity: 1;
    transform: perspective(1200px) translate(-50%, -50%) scale(1) rotateX(0deg);
  }

  .level-up-content {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
    color: white;
    padding: 3rem 4rem;
    border-radius: 20px;
    text-align: center;
    box-shadow: 
      0 30px 80px rgba(0, 0, 0, 0.4),
      0 0 40px rgba(59, 130, 246, 0.5),
      inset 0 1px 2px rgba(255, 255, 255, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(10px);
    animation: level-up-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .level-up-content h3 {
    margin: 0 0 1rem 0;
    font-size: 2.5rem;
    font-weight: 900;
    letter-spacing: -1px;
  }

  .level-up-content p {
    margin: 0.75rem 0;
    font-size: 1.25rem;
    font-weight: 500;
  }

  @keyframes level-up-pop {
    0% { 
      transform: perspective(1200px) translate(-50%, -50%) scale(0.3) rotateX(180deg) rotateY(180deg);
      opacity: 0;
    }
    100% { 
      transform: perspective(1200px) translate(-50%, -50%) scale(1) rotateX(0) rotateY(0);
      opacity: 1;
    }
  }
</style>
`;

/**
 * USAGE IN student.html:
 * 
 * 1. Add to <head>:
 *    <link rel="stylesheet" href="gamification.css">
 *    <script src="gamification.js" defer></script>
 *    <script src="gamification-component.js" defer></script>
 *    <script src="effects-3d.js" defer></script>
 * 
 * 2. Add to <body> where you want the dashboard:
 *    Reference: Use gamificationDashboardHTML3D above in an Alpine.js div
 * 
 * 3. Initialize with:
 *    - Effects3D initializes automatically
 *    - Gamification dashboard renders with all 3D effects
 *    - Floating particles appear in background
 *    - Parallax scrolling active on leaderboard
 *    - Mouse tracking active on all cards
 */
