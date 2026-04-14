/**
 * Gamification Module for Era of MathAntics
 * Comprehensive system for points, badges, levels, and leaderboards
 */

const GamificationSystem = (() => {
  // Configuration
  const config = {
    storageKey: 'mathantics_gamification',
    leaderboardKey: 'mathantics_leaderboard',
    basePath: 'Students', // Firebase path
  };

  // Points system configuration
  const points = {
    completedLesson: 50,
    perfectScore: 100,
    quizAttempt: 10,
    dailyStreak: 25,
    helpingPeer: 75,
    firstTimeAchievement: 200,
  };

  // Level tiers
  const levels = [
    { level: 1, minPoints: 0, title: 'Math Novice', color: '#94a3b8' },
    { level: 2, minPoints: 500, title: 'Math Explorer', color: '#3b82f6' },
    { level: 3, minPoints: 1500, title: 'Math Scholar', color: '#8b5cf6' },
    { level: 4, minPoints: 3000, title: 'Math Sage', color: '#ec4899' },
    { level: 5, minPoints: 5000, title: 'Math Master', color: '#f59e0b' },
    { level: 6, minPoints: 8000, title: 'Legendary Mathematician', color: '#ef4444' },
  ];

  // Badge definitions
  const badges = {
    // Milestone badges
    first_lesson: {
      id: 'first_lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: '🎓',
      pointReward: 50,
      rarity: 'common',
    },
    perfect_score: {
      id: 'perfect_score',
      name: 'Perfect Mathematician',
      description: 'Score 100% on a quiz',
      icon: '⭐',
      pointReward: 100,
      rarity: 'rare',
    },
    streak_7: {
      id: 'streak_7',
      name: 'Week Warrior',
      description: 'Maintain 7-day learning streak',
      icon: '🔥',
      pointReward: 150,
      rarity: 'epic',
    },
    streak_30: {
      id: 'streak_30',
      name: 'Legendary Learner',
      description: 'Maintain 30-day learning streak',
      icon: '👑',
      pointReward: 300,
      rarity: 'legendary',
    },
    // Subject mastery badges
    arithmetic_master: {
      id: 'arithmetic_master',
      name: 'Arithmetic Master',
      description: 'Complete all arithmetic lessons',
      icon: '🔢',
      pointReward: 200,
      rarity: 'rare',
    },
    algebra_master: {
      id: 'algebra_master',
      name: 'Algebra Master',
      description: 'Complete all algebra lessons',
      icon: '📐',
      pointReward: 200,
      rarity: 'rare',
    },
    geometry_master: {
      id: 'geometry_master',
      name: 'Geometry Master',
      description: 'Complete all geometry lessons',
      icon: '🟠',
      pointReward: 200,
      rarity: 'rare',
    },
    // Performance badges
    speed_demon: {
      id: 'speed_demon',
      name: 'Speed Demon',
      description: 'Complete 5 quizzes in one day',
      icon: '⚡',
      pointReward: 120,
      rarity: 'rare',
    },
    accuracy_ace: {
      id: 'accuracy_ace',
      name: 'Accuracy Ace',
      description: 'Maintain 90%+ average on 10 consecutive quizzes',
      icon: '🎯',
      pointReward: 180,
      rarity: 'epic',
    },
    // Social badges
    helper: {
      id: 'helper',
      name: 'Helper',
      description: 'Help 5 peers with problems',
      icon: '🤝',
      pointReward: 100,
      rarity: 'common',
    },
    community_star: {
      id: 'community_star',
      name: 'Community Star',
      description: 'Help 25 peers and receive positive reviews',
      icon: '⭐💫',
      pointReward: 250,
      rarity: 'epic',
    },
  };

  /**
   * Get or initialize user profile
   */
  const getUserProfile = (userId) => {
    const stored = localStorage.getItem(`${config.storageKey}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }

    const newProfile = {
      userId,
      totalPoints: 0,
      currentLevel: 1,
      badges: [],
      achievementProgress: {},
      streakDays: 0,
      lastActivityDate: new Date().toISOString().split('T')[0],
      joinDate: new Date().toISOString(),
      lessonsCompleted: 0,
      quizzesAttempted: 0,
      perfectScores: 0,
      helpingCount: 0,
    };

    saveUserProfile(userId, newProfile);
    return newProfile;
  };

  /**
   * Save user profile to localStorage
   */
  const saveUserProfile = (userId, profile) => {
    localStorage.setItem(`${config.storageKey}_${userId}`, JSON.stringify(profile));
  };

  /**
   * Add points to user and trigger badge checks
   */
  const addPoints = (userId, pointsAmount, action = 'activity') => {
    const profile = getUserProfile(userId);
    const oldLevel = profile.currentLevel;

    profile.totalPoints += pointsAmount;
    const newLevel = calculateLevel(profile.totalPoints);
    profile.currentLevel = newLevel;

    saveUserProfile(userId, profile);

    // Return level-up notification if applicable
    if (newLevel > oldLevel) {
      return {
        leveledUp: true,
        newLevel,
        levelTitle: levels.find(l => l.level === newLevel).title,
        totalPoints: profile.totalPoints,
      };
    }

    return {
      leveledUp: false,
      pointsAdded: pointsAmount,
      totalPoints: profile.totalPoints,
      currentLevel: profile.currentLevel,
    };
  };

  /**
   * Calculate level based on points
   */
  const calculateLevel = (totalPoints) => {
    let currentLevel = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].minPoints) {
        currentLevel = levels[i].level;
        break;
      }
    }
    return currentLevel;
  };

  /**
   * Award badge to user
   */
  const awardBadge = (userId, badgeId) => {
    const profile = getUserProfile(userId);

    // Check if badge already awarded
    if (profile.badges.find(b => b.badgeId === badgeId)) {
      return { awarded: false, reason: 'Badge already earned' };
    }

    const badge = badges[badgeId];
    if (!badge) {
      return { awarded: false, reason: 'Badge not found' };
    }

    profile.badges.push({
      badgeId,
      ...badge,
      awardedDate: new Date().toISOString(),
    });

    // Add bonus points
    const result = addPoints(userId, badge.pointReward, 'badge_reward');

    saveUserProfile(userId, profile);

    return {
      awarded: true,
      badge,
      pointsRewarded: badge.pointReward,
      newTotal: result.totalPoints,
    };
  };

  /**
   * Update daily streak
   */
  const updateDailyStreak = (userId) => {
    const profile = getUserProfile(userId);
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = profile.lastActivityDate;

    // Same day - no change
    if (lastActivity === today) {
      return { streakUpdated: false, currentStreak: profile.streakDays };
    }

    const lastDate = new Date(lastActivity);
    const currentDate = new Date(today);
    const daysDiff = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    // Consecutive day - increment streak
    if (daysDiff === 1) {
      profile.streakDays += 1;
      profile.lastActivityDate = today;

      // Award streak badges and points
      addPoints(userId, points.dailyStreak, 'daily_streak');

      // Check for milestone badges
      if (profile.streakDays === 7) {
        awardBadge(userId, 'streak_7');
      }
      if (profile.streakDays === 30) {
        awardBadge(userId, 'streak_30');
      }

      saveUserProfile(userId, profile);
      return { streakUpdated: true, currentStreak: profile.streakDays };
    }

    // Broken streak - reset
    profile.streakDays = 1;
    profile.lastActivityDate = today;
    saveUserProfile(userId, profile);
    return { streakUpdated: false, streakReset: true, currentStreak: 1 };
  };

  /**
   * Record lesson completion
   */
  const lessonCompleted = (userId, lessonName) => {
    const profile = getUserProfile(userId);
    profile.lessonsCompleted += 1;

    const result = addPoints(userId, points.completedLesson, 'lesson_completion');
    saveUserProfile(userId, profile);

    // Award first lesson badge
    if (profile.lessonsCompleted === 1) {
      awardBadge(userId, 'first_lesson');
    }

    return result;
  };

  /**
   * Record quiz attempt with score
   */
  const quizAttempted = (userId, score, maxScore) => {
    const profile = getUserProfile(userId);
    profile.quizzesAttempted += 1;

    const pointsToAdd = points.quizAttempt;
    let results = addPoints(userId, pointsToAdd, 'quiz_attempt');

    // Perfect score bonus
    if (score === maxScore) {
      profile.perfectScores += 1;
      const perfectBonus = addPoints(userId, points.perfectScore, 'perfect_score');
      results.perfectScoreBonus = points.perfectScore;
      results.totalPoints = perfectBonus.totalPoints;

      // Award perfect score badge on first
      if (profile.perfectScores === 1) {
        awardBadge(userId, 'perfect_score');
      }
    }

    saveUserProfile(userId, profile);
    return results;
  };

  /**
   * Get user progress towards badges
   */
  const getBadgeProgress = (userId) => {
    const profile = getUserProfile(userId);
    const progress = {};

    for (const [key, badge] of Object.entries(badges)) {
      if (profile.badges.find(b => b.badgeId === badge.id)) {
        progress[key] = { earned: true, awardedDate: profile.badges.find(b => b.badgeId === badge.id).awardedDate };
      } else {
        progress[key] = { earned: false, progress: calculateBadgeProgress(userId, badge.id) };
      }
    }

    return progress;
  };

  /**
   * Calculate progress towards specific badge
   */
  const calculateBadgeProgress = (userId, badgeId) => {
    const profile = getUserProfile(userId);

    switch (badgeId) {
      case 'streak_7':
        return { current: profile.streakDays, target: 7 };
      case 'streak_30':
        return { current: profile.streakDays, target: 30 };
      case 'speed_demon':
        return { current: profile.quizzesAttempted % 5, target: 5 };
      default:
        return { current: 0, target: 0 };
    }
  };

  /**
   * Get top leaderboard entries
   */
  const getLeaderboard = (limit = 10) => {
    const leaderboardData = JSON.parse(localStorage.getItem(config.leaderboardKey) || '[]');
    return leaderboardData
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit);
  };

  /**
   * Update leaderboard with user data
   */
  const updateLeaderboard = (userId, userProfile) => {
    let leaderboard = JSON.parse(localStorage.getItem(config.leaderboardKey) || '[]');

    const existingIndex = leaderboard.findIndex(e => e.userId === userId);
    const entry = {
      userId,
      username: userProfile.username || `Student_${userId.slice(0, 8)}`,
      totalPoints: userProfile.totalPoints,
      currentLevel: userProfile.currentLevel,
      badgeCount: userProfile.badges.length,
      streakDays: userProfile.streakDays,
      lastUpdated: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      leaderboard[existingIndex] = entry;
    } else {
      leaderboard.push(entry);
    }

    localStorage.setItem(config.leaderboardKey, JSON.stringify(leaderboard));
  };

  /**
   * Get user's rank on leaderboard
   */
  const getUserRank = (userId) => {
    const leaderboard = getLeaderboard(1000);
    const rank = leaderboard.findIndex(e => e.userId === userId);
    return rank >= 0 ? rank + 1 : null;
  };

  /**
   * Get statistics summary
   */
  const getStatistics = (userId) => {
    const profile = getUserProfile(userId);
    const rank = getUserRank(userId);

    return {
      userId,
      totalPoints: profile.totalPoints,
      currentLevel: profile.currentLevel,
      levelTitle: levels.find(l => l.level === profile.currentLevel).title,
      badgesEarned: profile.badges.length,
      streakDays: profile.streakDays,
      lessonsCompleted: profile.lessonsCompleted,
      quizzesAttempted: profile.quizzesAttempted,
      perfectScores: profile.perfectScores,
      leaderboardRank: rank,
      progress: {
        toNextLevel: calculateProgressToNextLevel(profile.totalPoints),
      },
    };
  };

  /**
   * Calculate progress to next level
   */
  const calculateProgressToNextLevel = (currentPoints) => {
    let currentLevel = calculateLevel(currentPoints);
    let nextLevel = currentLevel + 1;

    const currentLevelMin = levels.find(l => l.level === currentLevel)?.minPoints || 0;
    const nextLevelMin = levels.find(l => l.level === nextLevel)?.minPoints || currentLevelMin + 2500;

    const pointsInCurrentLevel = currentPoints - currentLevelMin;
    const pointsNeededForNextLevel = nextLevelMin - currentLevelMin;
    const percentage = Math.round((pointsInCurrentLevel / pointsNeededForNextLevel) * 100);

    return {
      currentLevel,
      nextLevel,
      currentPoints,
      pointsNeeded: Math.max(0, nextLevelMin - currentPoints),
      percentage: Math.min(100, percentage),
    };
  };

  /**
   * Public API
   */
  return {
    // User management
    getUserProfile,
    saveUserProfile,
    getStatistics,

    // Points and levels
    addPoints,
    calculateLevel,
    levels,

    // Badges
    badges,
    awardBadge,
    getBadgeProgress,

    // Streaks
    updateDailyStreak,

    // Activity tracking
    lessonCompleted,
    quizAttempted,

    // Leaderboard
    getLeaderboard,
    updateLeaderboard,
    getUserRank,

    // Utilities
    points,
  };
})();
