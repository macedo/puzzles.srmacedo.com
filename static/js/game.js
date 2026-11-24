// Utilidades compartilhadas entre os jogos: persistência, sequência de dias,
// formatação, toast, confete, estrelas e compartilhamento.
window.Game = (() => {
  const $ = (id) => document.getElementById(id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const fmtTime = (ms) => {
    const s = Math.floor(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const starStr = (n, total = 3) => '★'.repeat(n) + '☆'.repeat(total - n);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // ---------- Persistência ----------
  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

  function store(key) {
    let data;
    try {
      data = JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      data = {};
    }
    data.levels ||= {};
    data.streak ||= { count: 0, lastDay: null };

    const currentStreak = () => {
      const { count, lastDay } = data.streak;
      const y = new Date();
      y.setDate(y.getDate() - 1);
      return lastDay === dayKey(new Date()) || lastDay === dayKey(y) ? count : 0;
    };

    return {
      data,
      save: () => localStorage.setItem(key, JSON.stringify(data)),
      level: (id) => (data.levels[id] ||= { bestMoves: null, bestTime: null, stars: 0, wins: 0 }),
      currentStreak,
      bumpStreak() {
        const today = dayKey(new Date());
        if (data.streak.lastDay === today) return;
        data.streak.count = currentStreak() + 1;
        data.streak.lastDay = today;
      },
    };
  }

  function renderStreak(el, n) {
    el.textContent = n > 0 ? `🔥 ${n}` : '';
    el.title = n > 0 ? `${n} dia(s) seguido(s) com vitória` : '';
  }

  // ---------- UI ----------
  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.id);
    toast.id = setTimeout(() => (t.hidden = true), 2000);
  }

  function renderStars(el, n) {
    el.innerHTML = [0, 1, 2]
      .map((i) => `<span class="star ${i < n ? 'on' : ''}" style="--i:${i}">★</span>`)
      .join('');
  }

  async function share({ title, text, path }) {
    const url = `${location.origin}${path}`;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast('Copiado! Cole para desafiar alguém.');
      }
    } catch {
      /* usuário cancelou */
    }
  }

  // ---------- Confete ----------
  let confettiRaf = null;

  function stopConfetti() {
    cancelAnimationFrame(confettiRaf);
    const c = $('confetti');
    c.getContext('2d').clearRect(0, 0, c.width, c.height);
  }

  function confetti(stars = 3) {
    if (reduceMotion) return;
    const canvas = $('confetti');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const colors = ['#6366f1', '#a78bfa', '#22d3ee', '#facc15', '#f472b6', '#34d399'];
    const parts = Array.from({ length: 80 + stars * 50 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 120,
      y: innerHeight * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 16 - 6,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: pick(colors),
    }));
    const end = performance.now() + 4000;
    (function frame(now) {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      let alive = false;
      for (const p of parts) {
        p.vy += 0.35; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y < innerHeight + 20) alive = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.r * 2)));
        ctx.restore();
      }
      if (alive && now < end) confettiRaf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    })(performance.now());
  }

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  return {
    $, reduceMotion, fmtTime, starStr, pick, store, renderStreak, toast,
    renderStars, share, confetti, stopConfetti,
    WIN_TITLES: ['Resolvido!', 'Mandou bem!', 'Incrível!', 'Mestre do puzzle!', 'Show!'],
  };
})();
