/**
 * GAMIFICATION SYSTEM - INTEGRATION GUIDE
 * Complete implementation guide for Era of MathAntics
 */

// ============================================================================
// OVERVIEW
// ============================================================================
/*
The Gamification System includes:
✓ Points & Levels (6 levels from Novice to Legendary Mathematician)
✓ 10+ Badges (Achievements with rarity tiers)
✓ Daily Streaks (With automatic tracking and milestones)
✓ Leaderboard (Global rankings by points)
✓ Progress Tracking (Visual indicators and statistics)
✓ Alpine.js Dashboard Component (Ready-to-use UI)
*/

// ============================================================================
// STEP 1: HTML SETUP
// ============================================================================
/*
In your index.html or student.html <head> section, add:

<link rel="stylesheet" href="gamification.css">
<script src="gamification.js" defer></script>
<script src="gamification-component.js" defer></script>
*/

// ============================================================================
// STEP 2: BASIC USAGE
// ============================================================================
/*
After page loads, initialize with a user ID:

// Initialize with current user
const userId = firebase.auth().currentUser.uid;
const profile = GamificationSystem.getUserProfile(userId);

// Track quiz completion
GamificationSystem.quizAttempted(userId, 95, 100);

// Track lesson completion
GamificationSystem.lessonCompleted(userId, 'Algebra Basics');

// Get user statistics
const stats = GamificationSystem.getStatistics(userId);
console.log(stats.currentLevel, stats.totalPoints, stats.badgesEarned);

// Get leaderboard
const leaderboard = GamificationSystem.getLeaderboard(10);
*/

// ============================================================================
// STEP 3: POINTS SYSTEM
// ============================================================================
/*
Default Point Rewards:
- Completed Lesson: 50 points
- Perfect Score (100%): 100 points
- Quiz Attempt: 10 points
- Daily Streak: 25 points
- Helping Peer: 75 points
- First Achievement: 200 points

To customize, edit gamification.js:
const points = {
  completedLesson: 50,      // Modify these values
  perfectScore: 100,
  quizAttempt: 10,
  // ... etc
};
*/

// ============================================================================
// STEP 4: LEVEL SYSTEM
// ============================================================================
/*
6 Levels Available:
1. Math Novice (0 pts)        - Gray
2. Math Explorer (500 pts)    - Blue
3. Math Scholar (1,500 pts)   - Purple
4. Math Sage (3,000 pts)      - Pink
5. Math Master (5,000 pts)    - Amber
6. Legendary Mathematician (8,000 pts) - Red

Users automatically level up as they earn points.
Progress bar shows advancement toward next level.
*/

// ============================================================================
// STEP 5: BADGES SYSTEM
// ============================================================================
/*
Available Badges (10 total):

MILESTONE BADGES:
- First Steps: Complete your first lesson (50 pts)
- Perfect Mathematician: Score 100% on a quiz (100 pts)
- Week Warrior: Maintain 7-day streak (150 pts)
- Legendary Learner: Maintain 30-day streak (300 pts)

SUBJECT MASTERY:
- Arithmetic Master, Algebra Master, Geometry Master (200 pts each)

PERFORMANCE:
- Speed Demon: Complete 5 quizzes in one day (120 pts)
- Accuracy Ace: 90%+ average on 10 quizzes (180 pts)

SOCIAL:
- Helper: Help 5 peers (100 pts)
- Community Star: Help 25 peers + positive reviews (250 pts)

To award a badge programmatically:
GamificationSystem.awardBadge(userId, 'perfect_score');
*/

// ============================================================================
// STEP 6: DAILY STREAK TRACKING
// ============================================================================
/*
Streaks are automatically updated each day:

// Update streak (call once per day per user)
const streakResult = GamificationSystem.updateDailyStreak(userId);

// Returns:
{
  streakUpdated: true/false,
  currentStreak: 7,
  // Auto-awards badges at 7 and 30 days
}

Streak resets if user misses a day.
Consecutive days award points and badges.
*/

// ============================================================================
// STEP 7: DASHBOARD COMPONENT INTEGRATION
// ============================================================================
/*
In student.html, add after your content section:

<div x-data="gamificationDashboard('USER_ID_HERE')" 
     @init.window="init()" 
     x-cloak>
     
  <!-- Gamification Dashboard Component -->
  [Paste the HTML from gamification-component.js here]
  
</div>

The dashboard includes:
- Level badge with title
- Points display
- Badge progress
- Streak counter
- Statistics grid
- Badge showcase with details
- Global leaderboard
- Achievement progress
*/

// ============================================================================
// STEP 8: TRACKING USER ACTIVITY
// ============================================================================
/*
In your quiz/lesson code, add tracking:

// When quiz is completed
function submitQuiz(answers) {
  const score = calculateScore(answers);
  const result = GamificationSystem.quizAttempted(
    userId,
    score,
    100  // maxScore
  );
  
  if (result.leveledUp) {
    console.log('User leveled up to:', result.newLevel);
  }
}

// When lesson completes
function completeLessonClick() {
  GamificationSystem.lessonCompleted(userId, 'Arithmetic Basics');
}

// Update daily streak on each login
window.addEventListener('load', () => {
  GamificationSystem.updateDailyStreak(userId);
});
*/

// ============================================================================
// STEP 9: LEADERBOARD MANAGEMENT
// ============================================================================
/*
// Get top 10 students
const topStudents = GamificationSystem.getLeaderboard(10);

// Get user's rank
const userRank = GamificationSystem.getUserRank(userId);

// Update leaderboard after activity
const profile = GamificationSystem.getUserProfile(userId);
GamificationSystem.updateLeaderboard(userId, profile);

// Display leaderboard
topStudents.forEach((entry, index) => {
  console.log(
    `${index + 1}. ${entry.username} - 
     ${entry.totalPoints} pts (Level ${entry.currentLevel})`
  );
});
*/

// ============================================================================
// STEP 10: PERSISTENCE & STORAGE
// ============================================================================
/*
Data is stored in localStorage with keys:
- mathantics_gamification_[userId] - User profile
- mathantics_leaderboard - Leaderboard data

Storage structure:
{
  userId: "123",
  totalPoints: 1500,
  currentLevel: 3,
  badges: ["first_lesson", "perfect_score"],
  streakDays: 7,
  lastActivityDate: "2026-04-14",
  joinDate: "2026-03-01",
  lessonsCompleted: 5,
  quizzesAttempted: 15,
  perfectScores: 3,
  helpingCount: 0
}

To reset a user's progress:
localStorage.removeItem('mathantics_gamification_[userId]');

To export data:
const profile = JSON.stringify(GamificationSystem.getUserProfile(userId));
console.log(profile);
*/

// ============================================================================
// STEP 11: TESTING & DEVELOPMENT
// ============================================================================
/*
// Test badge awards
GamificationSystem.awardBadge('test-user', 'first_lesson');

// Simulate user activity
for (let i = 0; i < 5; i++) {
  GamificationSystem.quizAttempted('test-user', 90 + Math.random() * 10, 100);
}

// Simulate streak
for (let i = 0; i < 7; i++) {
  GamificationSystem.updateDailyStreak('test-user');
  // Advance date in localStorage to simulate days
}

// View user stats
console.log(GamificationSystem.getStatistics('test-user'));

// View leaderboard
console.log(GamificationSystem.getLeaderboard(5));

// Reset for testing
localStorage.clear(); // ⚠️ Resets all data
*/

// ============================================================================
// STEP 12: CUSTOMIZATION
// ============================================================================
/*
1. Modify Points Values
   Edit gamification.js > config.points object

2. Add New Badges
   Edit gamification.js > badges object:
   
   new_badge: {
     id: 'new_badge',
     name: 'Badge Name',
     description: 'What it rewards',
     icon: '🎯',
     pointReward: 100,
     rarity: 'rare',
   }

3. Adjust Level Thresholds
   Edit gamification.js > levels array:
   
   { level: 1, minPoints: 0, title: 'Title', color: '#color' }

4. Modify Dashboard UI
   Edit gamification-component.js > HTML template

5. Change Styling
   Edit gamification.css
*/

// ============================================================================
// STEP 13: API REFERENCE
// ============================================================================
/*
Core Methods:

GamificationSystem.getUserProfile(userId)
- Returns: Full user profile object

GamificationSystem.addPoints(userId, points, action)
- Returns: {leveledUp, newLevel, totalPoints, currentLevel}

GamificationSystem.awardBadge(userId, badgeId)
- Returns: {awarded, badge, pointsRewarded, newTotal}

GamificationSystem.lessonCompleted(userId, lessonName)
- Returns: Point result object

GamificationSystem.quizAttempted(userId, score, maxScore)
- Returns: {leveledUp?, perfectScoreBonus?, totalPoints}

GamificationSystem.updateDailyStreak(userId)
- Returns: {streakUpdated, currentStreak}

GamificationSystem.getBadgeProgress(userId)
- Returns: Object with all badges and progress

GamificationSystem.getLeaderboard(limit)
- Returns: Array of top students

GamificationSystem.getUserRank(userId)
- Returns: User's rank number (1-based)

GamificationSystem.getStatistics(userId)
- Returns: Complete stats including all metrics
*/

// ============================================================================
// STEP 14: TROUBLESHOOTING
// ============================================================================
/*
Issue: Points not saving
→ Check localStorage is enabled
→ Verify userId is correct
→ Check browser's Storage capacity

Issue: Badges not appearing
→ Verify badge ID exists in badges object
→ Check awardBadge() is being called
→ View localStorage to confirm save

Issue: Leaderboard not updating
→ Call updateLeaderboard() after user activity
→ Verify leaderboard storage key is correct
→ Check sort order (descending by points)

Issue: Streak not tracking
→ Call updateDailyStreak() on user login
→ Verify lastActivityDate is updating
→ Check date logic handles day boundaries

Issue: Performance issues
→ Consider pagination for large leaderboards
→ Limit badge checks after quiz completion
→ Cache leaderboard data if accessed frequently
*/

// ============================================================================
// COMPLETE EXAMPLE: Full Integration
// ============================================================================
/*

In student.html:

<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="gamification.css">
  <script src="gamification.js" defer></script>
  <script src="gamification-component.js" defer></script>
</head>
<body x-data="alpineApp()" @init.window="init()">

  <!-- Student Content -->
  <section>
    <h1>Quiz: Algebra Basics</h1>
    <form @submit.prevent="submitQuiz">
      <!-- Quiz questions -->
      <button type="submit">Submit Quiz</button>
    </form>
  </section>

  <!-- Gamification Dashboard -->
  <div x-data="gamificationDashboard(authUser.uid)" 
       @init.window="init()" 
       x-cloak>
    <!-- Dashboard HTML here -->
  </div>

  <script>
    const authUser = { uid: 'current-user-id' };
    
    function alpineApp() {
      return {
        auth User,
        submitQuiz() {
          const score = 95;
          GamificationSystem.quizAttempted(authUser.uid, score, 100);
          GamificationSystem.lessonCompleted(authUser.uid, 'Algebra Basics');
          GamificationSystem.updateDailyStreak(authUser.uid);
        }
      };
    }
  </script>
</body>
</html>
*/
