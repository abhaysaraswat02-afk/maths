/**
 * Gamification System - Alpine.js Integration Component
 * Ready-to-use dashboard component for displaying gamification features
 */

// Alpine.js data function for gamification dashboard
function gamificationDashboard(userId) {
  return {
    userId,
    stats: null,
    badges: [],
    leaderboard: [],
    selectedBadge: null,
    showBadgeDetail: false,
    streakDays: 0,
    animatePoints: false,

    /**
     * Initialize gamification data
     */
    init() {
      this.loadUserStats();
      this.loadBadges();
      this.loadLeaderboard();
    },

    /**
     * Load user statistics
     */
    loadUserStats() {
      this.stats = GamificationSystem.getStatistics(this.userId);
      this.streakDays = this.stats.streakDays;
    },

    /**
     * Load and display badges
     */
    loadBadges() {
      const progress = GamificationSystem.getBadgeProgress(this.userId);
      this.badges = Object.entries(progress).map(([key, data]) => ({
        key,
        ...GamificationSystem.badges[key],
        earned: data.earned,
        progress: data.progress,
        awardedDate: data.awardedDate,
      }));
    },

    /**
     * Load leaderboard
     */
    loadLeaderboard() {
      this.leaderboard = GamificationSystem.getLeaderboard(10);
    },

    /**
     * Record quiz completion and update stats
     */
    completeQuiz(score, maxScore) {
      const result = GamificationSystem.quizAttempted(this.userId, score, maxScore);
      
      if (result.leveledUp) {
        this.notifyLevelUp(result);
      }

      this.animatePoints = true;
      setTimeout(() => {
        this.animatePoints = false;
        this.loadUserStats();
      }, 1000);

      return result;
    },

    /**
     * Record lesson completion
     */
    completeLesson(lessonName) {
      const result = GamificationSystem.lessonCompleted(this.userId, lessonName);
      
      if (result.leveledUp) {
        this.notifyLevelUp(result);
      }

      this.loadUserStats();
      this.loadBadges();
      return result;
    },

    /**
     * Show level-up notification
     */
    notifyLevelUp(result) {
      const notification = document.createElement('div');
      notification.className = 'level-up-notification';
      notification.innerHTML = `
        <div class="level-up-content">
          <h3>🎉 Level Up!</h3>
          <p>You've reached <strong>${result.levelTitle}</strong></p>
          <p>Total Points: <strong>${result.totalPoints}</strong></p>
        </div>
      `;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.classList.add('show');
      }, 100);

      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },

    /**
     * Show badge detail modal
     */
    selectBadge(badgeKey) {
      this.selectedBadge = this.badges.find(b => b.key === badgeKey);
      this.showBadgeDetail = true;
    },

    /**
     * Close badge detail modal
     */
    closeBadgeDetail() {
      this.showBadgeDetail = false;
      this.selectedBadge = null;
    },

    /**
     * Get level color based on level number
     */
    getLevelColor(level) {
      const levelData = GamificationSystem.levels.find(l => l.level === level);
      return levelData ? levelData.color : '#94a3b8';
    },

    /**
     * Format large numbers
     */
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
      if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
      return num.toString();
    },

    /**
     * Get progress percentage to next level
     */
    getProgressPercentage() {
      return this.stats?.progress.toNextLevel.percentage || 0;
    },

    /**
     * Get user's leaderboard rank with styling
     */
    getUserRankClass(rank) {
      if (rank === 1) return 'rank-1';
      if (rank === 2) return 'rank-2';
      if (rank === 3) return 'rank-3';
      return 'default';
    },
  };
}

/**
 * HTML Template for Gamification Dashboard
 * Use this in your student.html or dashboard page
 */
const gamificationDashboardHTML = `
<!-- Gamification Dashboard Section -->
<section class="py-12 bg-gradient-to-br from-blue-50 to-slate-50" x-data="gamificationDashboard(authUser.uid)" @init.window="init()" x-cloak>
  <div class="max-w-6xl mx-auto px-6">
    <!-- Main Header -->
    <div class="mb-12">
      <h1 class="text-4xl font-bold text-slate-900 mb-2">Your Learning Journey 🚀</h1>
      <p class="text-slate-600 text-lg">Complete lessons, earn badges, climb the leaderboard!</p>
    </div>

    <!-- Top Stats Row -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12" x-show="stats">
      <!-- Level Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 text-center">
        <div class="level-badge" :class="'level-' + stats.currentLevel" :style="'background: linear-gradient(135deg, ' + getLevelColor(stats.currentLevel) + ', ' + getLevelColor(stats.currentLevel) + ');'">
          <span x-text="stats.currentLevel"></span>
        </div>
        <p class="level-title" x-text="stats.levelTitle" style="margin-top: 1rem;"></p>
        <p class="text-sm text-slate-500 mt-2">Current Level</p>
      </div>

      <!-- Points Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 text-center">
        <div class="points-display" :class="{'animate-pulse': animatePoints}" x-text="formatNumber(stats.totalPoints)"></div>
        <p class="text-sm font-semibold text-slate-600">Total Points</p>
        <p class="text-xs text-slate-400 mt-2">Keep learning to earn more!</p>
      </div>

      <!-- Badges Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 text-center">
        <div class="text-4xl font-bold text-blue-600" x-text="stats.badgesEarned"></div>
        <p class="text-sm font-semibold text-slate-600">Badges Earned</p>
        <p class="text-xs text-slate-400 mt-2" x-text="'of ' + Object.keys(GamificationSystem.badges).length + ' available'"></p>
      </div>

      <!-- Leaderboard Rank -->
      <div class="bg-white rounded-xl shadow-lg p-6 text-center">
        <div class="text-4xl font-bold text-amber-600" x-text="stats.leaderboardRank || '-'"></div>
        <p class="text-sm font-semibold text-slate-600">Leaderboard Rank</p>
        <p class="text-xs text-slate-400 mt-2">Among all students</p>
      </div>
    </div>

    <!-- Level Progress Section -->
    <div class="bg-white rounded-xl shadow-lg p-8 mb-12" x-show="stats">
      <h2 class="text-2xl font-bold text-slate-900 mb-6">Progress to Next Level</h2>
      <div class="flex items-center gap-6">
        <div class="flex-1">
          <div class="level-progress">
            <div class="level-progress-fill" :style="'width: ' + getProgressPercentage() + '%'"></div>
          </div>
          <p class="text-sm text-slate-600 mt-3">
            <span x-text="stats.progress.toNextLevel.pointsNeeded"></span> points needed for 
            <strong x-text="'Level ' + stats.progress.toNextLevel.nextLevel"></strong>
          </p>
        </div>
        <div class="text-right">
          <p class="text-3xl font-bold text-blue-600" x-text="getProgressPercentage() + '%'"></p>
          <p class="text-sm text-slate-500">to next level</p>
        </div>
      </div>
    </div>

    <!-- Streak Section -->
    <div class="mb-12" x-show="stats && stats.streakDays > 0">
      <div class="streak-counter">
        <div class="streak-icon">🔥</div>
        <div class="streak-info">
          <h3>Learning Streak</h3>
          <div class="flex items-center gap-2 mt-2">
            <span class="streak-count" x-text="stats.streakDays"></span>
            <span class="text-sm text-yellow-800">Days in a row!</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Statistics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
      <div class="stat-card">
        <div class="stat-value" x-text="stats.lessonsCompleted"></div>
        <div class="stat-label">Lessons Completed</div>
      </div>
      <div class="stat-card" style="border-top-color: #8b5cf6;">
        <div class="stat-value" x-text="stats.quizzesAttempted"></div>
        <div class="stat-label">Quizzes Attempted</div>
      </div>
      <div class="stat-card" style="border-top-color: #ec4899;">
        <div class="stat-value" x-text="stats.perfectScores"></div>
        <div class="stat-label">Perfect Scores</div>
      </div>
      <div class="stat-card" style="border-top-color: #f59e0b;">
        <div class="stat-value" x-text="formatNumber(stats.totalPoints)"></div>
        <div class="stat-label">Total Points</div>
      </div>
    </div>

    <!-- Badges Section -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-slate-900 mb-6">Achievements & Badges</h2>
      <div class="badge-container">
        <template x-for="badge in badges" :key="badge.id">
          <div class="badge" :class="{'earned': badge.earned, 'locked': !badge.earned}" @click="selectBadge(badge.key)" style="cursor: pointer;">
            <div class="badge-icon" x-text="badge.icon"></div>
            <div class="badge-name" x-text="badge.name"></div>
            <div class="badge-rarity" :class="badge.rarity.toLowerCase()" x-text="badge.rarity"></div>
          </div>
        </template>
      </div>
    </div>

    <!-- Leaderboard Section -->
    <div class="mb-12">
      <h2 class="text-2xl font-bold text-slate-900 mb-6">Top Students Leaderboard</h2>
      <div class="leaderboard">
        <div class="leaderboard-header">
          <div>Rank</div>
          <div>Name</div>
          <div>Level</div>
          <div>Points</div>
          <div>Badges</div>
        </div>
        <div class="leaderboard-entries">
          <template x-for="(entry, index) in leaderboard" :key="entry.userId">
            <div class="leaderboard-entry">
              <div class="rank-badge" :class="'rank-' + (index + 1)" x-text="index + 1"></div>
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

  <!-- Badge Detail Modal -->
  <div x-show="showBadgeDetail" x-transition class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeBadgeDetail()">
    <div class="bg-white rounded-xl shadow-2xl p-8 max-w-md" @click.stop x-show="selectedBadge">
      <div class="text-center mb-6">
        <div style="font-size: 4rem;" x-text="selectedBadge.icon"></div>
        <h3 class="text-2xl font-bold text-slate-900 mt-4" x-text="selectedBadge.name"></h3>
        <p class="text-slate-600 mt-2" x-text="selectedBadge.description"></p>
      </div>
      <div class="flex items-center justify-between mb-6 p-4 bg-blue-50 rounded-lg">
        <span class="text-sm font-semibold text-slate-700">Points Reward:</span>
        <span class="text-xl font-bold text-blue-600" x-text="selectedBadge.pointReward"></span>
      </div>
      <div class="flex gap-3">
        <button @click="closeBadgeDetail()" class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold py-2 px-4 rounded-lg transition">Close</button>
      </div>
    </div>
  </div>
</section>

<!-- Level-up Notification Styles -->
<style>
  .level-up-notification {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.8);
    opacity: 0;
    z-index: 9999;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .level-up-notification.show {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }

  .level-up-content {
    background: linear-gradient(135deg, #3b82f6, #8b5cf6);
    color: white;
    padding: 2rem 3rem;
    border-radius: 16px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    border: 2px solid rgba(255, 255, 255, 0.2);
    animation: popIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .level-up-content h3 {
    margin: 0 0 1rem 0;
    font-size: 2rem;
  }

  .level-up-content p {
    margin: 0.5rem 0;
    font-size: 1.1rem;
  }

  @keyframes popIn {
    0% { transform: scale(0) rotate(-180deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
</style>
`;

/**
 * Quick Integration Example
 * 
 * 1. Add to your student.html (in the Head):
 *    <link rel="stylesheet" href="gamification.css">
 *    <script src="gamification.js" defer></script>
 * 
 * 2. Add the dashboard HTML component to student.html body:
 *    <!-- Add after your student content section -->
 *    <!-- Paste the HTML template above here -->
 * 
 * 3. Initialize in your main Alpine.js application:
 *    Use the gamificationDashboard() function with user ID
 * 
 * 4. Track user activity in your quiz/lesson code:
 *    GamificationSystem.completeQuiz(score, maxScore);
 *    GamificationSystem.lessonCompleted(userId, 'Arithmetic Basics');
 */
