/**
 * Era of MathAntics — New Exciting Features JS
 * Dark Mode | Math Quiz | Tip of Day | Countdown | AI Chat | Quotes | Achievements
 */
(function () {
  'use strict';

  /* ──────────────────────────────────────────
     1. DARK MODE TOGGLE
  ────────────────────────────────────────── */
  function initDarkMode() {
    const btn = document.createElement('button');
    btn.id = 'dark-mode-toggle';
    btn.title = 'Toggle Dark Mode';
    btn.textContent = '🌙';
    document.body.appendChild(btn);

    // Restore preference
    if (localStorage.getItem('ema-dark') === '1') {
      document.body.classList.add('dark-mode');
      btn.textContent = '☀️';
    }
    btn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const dark = document.body.classList.contains('dark-mode');
      btn.textContent = dark ? '☀️' : '🌙';
      localStorage.setItem('ema-dark', dark ? '1' : '0');
    });
  }

  /* ──────────────────────────────────────────
     2. MATH QUIZ WIDGET
  ────────────────────────────────────────── */
  function initMathQuiz() {
    const container = document.getElementById('quiz-widget');
    if (!container) return;

    const questions = [
      { q: 'What is 15² − 144?',             opts: ['81','100','81','225'],   ans: 0, a: ['81','100','225','169'] },
      { q: 'Solve: 3x + 7 = 22',              opts: ['5','6','4','7'],         ans: 0, a: ['5','6','4','7'] },
      { q: 'Area of circle with r = 7?',      opts: ['49π','14π','7π','154'],  ans: 0, a: ['49π','14π','7π','154'] },
      { q: 'Value of sin 90°?',               opts: ['0','1','√2/2','-1'],     ans: 1, a: ['0','1','√2/2','-1'] },
      { q: 'HCF of 24 and 36?',               opts: ['6','12','8','18'],       ans: 1, a: ['6','12','8','18'] },
      { q: 'Sum of angles in a triangle?',    opts: ['90°','360°','270°','180°'], ans: 3, a: ['90°','360°','270°','180°'] },
      { q: 'What is ∫2x dx?',                 opts: ['x²+C','2x²+C','x+C','2+C'], ans: 0, a: ['x²+C','2x²+C','x+C','2+C'] },
      { q: 'Simplify: (a+b)² − (a−b)²',      opts: ['4ab','2ab','a²−b²','0'], ans: 0, a: ['4ab','2ab','a²−b²','0'] },
      { q: 'log₁₀ 1000 = ?',                  opts: ['2','3','4','10'],        ans: 1, a: ['2','3','4','10'] },
      { q: 'Roots of x² − 5x + 6 = 0?',      opts: ['2,3','1,6','−2,−3','3,4'], ans: 0, a: ['2,3','1,6','−2,−3','3,4'] },
    ];

    let current = 0, score = 0, streak = 0, bestStreak = 0, answered = false;

    function shuffleQ() {
      return [...questions].sort(() => Math.random() - 0.5);
    }
    let pool = shuffleQ();

    function render() {
      const q = pool[current % pool.length];
      container.querySelector('.quiz-question').textContent = q.q;
      const opts = container.querySelectorAll('.quiz-opt');
      opts.forEach((btn, i) => {
        btn.textContent = q.a[i];
        btn.className = 'quiz-opt';
        btn.onclick = () => answer(i, q.ans, btn, opts);
      });
      container.querySelector('#quiz-progress-fill').style.width =
        ((current % questions.length) / questions.length * 100) + '%';
      container.querySelector('.quiz-score').textContent =
        `Score: ${score}  |  Best Streak: ${bestStreak} 🔥`;
      container.querySelector('.quiz-streak').textContent = `🔥 ×${streak}`;
      container.querySelector('#quiz-next-btn').style.display = 'none';
      answered = false;
    }

    function answer(chosen, correct, btn, opts) {
      if (answered) return;
      answered = true;
      if (chosen === correct) {
        btn.classList.add('correct');
        score++;
        streak++;
        if (streak > bestStreak) bestStreak = streak;
        if (typeof confetti === 'function' && streak >= 3) {
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 }, colors: ['#3b82f6','#10b981','#f59e0b'] });
        }
        showAchievementPopup();
      } else {
        btn.classList.add('wrong');
        opts[correct].classList.add('correct');
        streak = 0;
      }
      container.querySelector('.quiz-score').textContent =
        `Score: ${score}  |  Best Streak: ${bestStreak} 🔥`;
      container.querySelector('.quiz-streak').textContent = `🔥 ×${streak}`;
      container.querySelector('#quiz-next-btn').style.display = 'inline-block';
    }

    container.querySelector('#quiz-next-btn').addEventListener('click', () => {
      current++;
      if (current % questions.length === 0) pool = shuffleQ();
      render();
    });

    render();
  }

  /* ──────────────────────────────────────────
     3. TIP OF THE DAY
  ────────────────────────────────────────── */
  function initTipOfDay() {
    const el = document.getElementById('tip-text');
    if (!el) return;
    const tips = [
      'When stuck on a problem, try working backwards from the answer.',
      'Memorise key formulae — but always understand *why* they work.',
      'Speed in arithmetic comes from daily mental-maths practice.',
      'For geometry, draw a neat diagram before every problem.',
      'Logarithm rules: log(ab) = log a + log b. Practise daily!',
      'In trigonometry, remember SOH-CAH-TOA — it never fails.',
      'Factor polynomials first before trying to solve equations.',
      'Statistics tip: mean is sensitive to outliers; use median for skewed data.',
      'Always check your answer by substituting back into the original equation.',
      'Calculus: differentiation is the inverse of integration.',
      'BODMAS/PEMDAS saves lives — apply it without exception.',
      'For word problems, underline key values and write variables first.',
    ];
    let idx = parseInt(localStorage.getItem('ema-tip-idx') || '0');
    el.textContent = tips[idx % tips.length];
    document.getElementById('tip-refresh-btn')?.addEventListener('click', () => {
      idx = (idx + 1) % tips.length;
      localStorage.setItem('ema-tip-idx', idx);
      el.style.opacity = '0';
      setTimeout(() => {
        el.textContent = tips[idx];
        el.style.opacity = '1';
        el.style.transition = 'opacity 0.4s';
      }, 200);
    });
  }

  /* ──────────────────────────────────────────
     4. EXAM COUNTDOWN TIMER
  ────────────────────────────────────────── */
  function initCountdown() {
    const el = document.getElementById('countdown-banner');
    if (!el) return;
    // Target: next March 10 (Class 10 board exam season)
    const now = new Date();
    const year = now.getMonth() >= 2 ? now.getFullYear() + 1 : now.getFullYear();
    const target = new Date(year, 2, 10, 9, 0, 0); // March 10

    function tick() {
      const diff = target - new Date();
      if (diff <= 0) { el.querySelector('.countdown-label-main').textContent = '🎉 Exam Day!'; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      el.querySelector('#cd-days').textContent  = String(d).padStart(2,'0');
      el.querySelector('#cd-hours').textContent = String(h).padStart(2,'0');
      el.querySelector('#cd-mins').textContent  = String(m).padStart(2,'0');
      el.querySelector('#cd-secs').textContent  = String(s).padStart(2,'0');
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ──────────────────────────────────────────
     5. MINI AI CHAT ASSISTANT
  ────────────────────────────────────────── */
  function initChatBubble() {
    const bubble = document.getElementById('chat-bubble');
    if (!bubble) return;
    const btn   = bubble.querySelector('#chat-bubble-btn');
    const panel = bubble.querySelector('#chat-panel-popup');
    const msgs  = bubble.querySelector('.chat-msgs');
    const input = bubble.querySelector('.chat-input-row input');
    const send  = bubble.querySelector('.chat-input-row button');

    const responses = {
      'hello': 'Hi there! 👋 I\'m your MathAntics assistant. Ask me anything about maths!',
      'hi'   : 'Hello! Ready to solve some maths? 🧮',
      'help' : 'I can help with: arithmetic, algebra, geometry, trigonometry & more! Just ask away.',
      'formula': 'Popular formulae:\n📐 Area of circle = πr²\n📏 Pythagoras: a²+b²=c²\n📊 Quadratic: x = (−b ± √(b²−4ac)) / 2a',
      'quadratic': 'The quadratic formula: x = (−b ± √(b²−4ac)) / 2a\nUse it when ax²+bx+c=0 ✅',
      'pythagoras': 'Pythagoras theorem: a² + b² = c²\nWhere c is the hypotenuse (longest side)! 📐',
      'trigonometry': 'Key trig ratios:\n• sin θ = opposite/hypotenuse\n• cos θ = adjacent/hypotenuse\n• tan θ = opposite/adjacent\nRemember: SOH-CAH-TOA! 🎯',
      'area': 'Common area formulae:\n• Square: a²\n• Rectangle: l×b\n• Triangle: ½×b×h\n• Circle: πr²',
      'log' : 'Logarithm rules:\n• log(ab) = log a + log b\n• log(a/b) = log a − log b\n• log(aⁿ) = n·log a',
      'bye' : 'Bye! Keep solving! 🚀',
    };

    function addMsg(text, type) {
      const div = document.createElement('div');
      div.className = `chat-msg ${type}`;
      div.textContent = text;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }

    btn.addEventListener('click', () => {
      panel.classList.toggle('open');
      if (panel.classList.contains('open') && msgs.children.length === 0) {
        setTimeout(() => addMsg('👋 Hi! I\'m your MathAntics helper. Ask me anything about maths!', 'bot'), 300);
      }
    });

    function sendMsg() {
      const txt = input.value.trim();
      if (!txt) return;
      addMsg(txt, 'user');
      input.value = '';
      // Find response
      const key = Object.keys(responses).find(k => txt.toLowerCase().includes(k));
      const reply = key ? responses[key] : 'Great question! 🤔 For detailed help, check the Notes section in your dashboard or ask your teacher in class.';
      setTimeout(() => addMsg(reply, 'bot'), 600);
    }

    send.addEventListener('click', sendMsg);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

    // Close when clicking outside
    document.addEventListener('click', e => {
      if (!bubble.contains(e.target)) panel.classList.remove('open');
    });
  }

  /* ──────────────────────────────────────────
     6. MOTIVATIONAL QUOTE TOAST
  ────────────────────────────────────────── */
  function initQuoteToast() {
    const toast = document.getElementById('quote-toast');
    if (!toast) return;
    const quotes = [
      { text: 'Mathematics is the music of reason.', author: '— James Joseph Sylvester' },
      { text: 'Do not worry about your difficulties in mathematics. I assure you mine are still greater.', author: '— Albert Einstein' },
      { text: 'Pure mathematics is, in its way, the poetry of logical ideas.', author: '— Albert Einstein' },
      { text: 'Without mathematics, there\'s nothing you can do.', author: '— Shakuntala Devi' },
      { text: 'Go down deep enough into anything and you will find mathematics.', author: '— Dean Schlicter' },
      { text: 'The only way to learn mathematics is to do mathematics.', author: '— Paul Halmos' },
    ];
    const q = quotes[Math.floor(Math.random() * quotes.length)];
    toast.querySelector('.quote-text').textContent = `"${q.text}"`;
    toast.querySelector('.quote-author').textContent = q.author;

    // Show after 4 seconds, hide after 7
    setTimeout(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 7000);
    }, 4000);

    toast.addEventListener('click', () => toast.classList.remove('show'));
  }

  /* ──────────────────────────────────────────
     7. SKILL METER ANIMATION
  ────────────────────────────────────────── */
  function initSkillMeters() {
    const fills = document.querySelectorAll('.skill-fill[data-pct]');
    if (!fills.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.width = e.target.dataset.pct + '%';
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.3 });
    fills.forEach(f => io.observe(f));
  }

  /* ──────────────────────────────────────────
     8. ACHIEVEMENT POPUP
  ────────────────────────────────────────── */
  let achTimer = null;
  function showAchievementPopup() {
    const pop = document.getElementById('achievement-popup');
    if (!pop) return;
    const achievements = [
      { icon:'⭐', title:'Correct Answer!', sub:'Keep it up!', badge:'Nice Work' },
      { icon:'🔥', title:'On Fire!', sub:'3+ in a row', badge:'Streak' },
      { icon:'🏆', title:'Math Wizard!', sub:'You\'re on a roll!', badge:'Legendary' },
    ];
    const a = achievements[Math.floor(Math.random() * achievements.length)];
    pop.querySelector('.achievement-icon').textContent = a.icon;
    pop.querySelector('.achievement-text strong').textContent = a.title;
    pop.querySelector('.achievement-text span').textContent = a.sub;
    pop.querySelector('.achievement-badge-label').textContent = a.badge;
    pop.style.display = 'block';
    clearTimeout(achTimer);
    achTimer = setTimeout(() => { pop.style.display = 'none'; }, 3000);
  }
  window.showAchievementPopup = showAchievementPopup;

  /* ──────────────────────────────────────────
     9. FORMULA TICKER
  ────────────────────────────────────────── */
  function initFormulaTicker() {
    const el = document.getElementById('formula-ticker');
    if (!el) return;
    const formulas = [
      ['Quadratic Formula', 'x = (−b ± √(b²−4ac)) / 2a'],
      ['Pythagoras', 'a² + b² = c²'],
      ['Area of Circle', 'A = πr²'],
      ['Binomial Theorem', '(a+b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ'],
      ['Euler\'s Identity', 'e^(iπ) + 1 = 0'],
      ['Sine Rule', 'a/sinA = b/sinB = c/sinC'],
      ['Compound Interest', 'A = P(1 + r/n)^(nt)'],
      ['Standard Deviation', 'σ = √(Σ(x−μ)²/N)'],
      ['Derivative of xⁿ', 'd/dx(xⁿ) = nxⁿ⁻¹'],
      ['Integration', '∫xⁿdx = xⁿ⁺¹/(n+1) + C'],
      ['Law of Cosines', 'c² = a² + b² − 2ab·cosC'],
      ['Volume of Sphere', 'V = (4/3)πr³'],
    ];
    const track = el.querySelector('.formula-track');
    if (!track) return;
    // Build two identical sets for seamless loop
    [0,1].forEach(() => {
      formulas.forEach(([name, f]) => {
        const span = document.createElement('span');
        span.className = 'formula-item';
        span.innerHTML = `<span>${name}:</span><span class="formula-math">${f}</span>`;
        track.appendChild(span);
      });
    });
  }

  /* ──────────────────────────────────────────
     INIT ALL
  ────────────────────────────────────────── */
  function init() {
    try { initDarkMode();      } catch(e) { console.warn('DarkMode:', e); }
    try { initMathQuiz();      } catch(e) { console.warn('Quiz:', e); }
    try { initTipOfDay();      } catch(e) { console.warn('Tip:', e); }
    try { initCountdown();     } catch(e) { console.warn('Countdown:', e); }
    try { initChatBubble();    } catch(e) { console.warn('Chat:', e); }
    try { initQuoteToast();    } catch(e) { console.warn('Quote:', e); }
    try { initSkillMeters();   } catch(e) { console.warn('Skill:', e); }
    try { initFormulaTicker(); } catch(e) { console.warn('Ticker:', e); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
