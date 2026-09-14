// ---------- Fond de particules façon "étoiles / réseau" en 3D léger ----------
const canvas = document.getElementById('bg');
const ctx = canvas.getContext('2d');
let w, h, particles;

function resize() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const PARTICLE_COUNT = 90;

function initParticles() {
  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    z: Math.random() * 1 + 0.2, // depth factor for parallax + size
    vx: (Math.random() - 0.5) * 0.15,
    vy: (Math.random() - 0.5) * 0.15,
  }));
}
initParticles();

function draw() {
  ctx.clearRect(0, 0, w, h);

  // subtle radial gradient background glow
  const grad = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.3, Math.max(w, h) * 0.7);
  grad.addColorStop(0, 'rgba(125,211,252,0.05)');
  grad.addColorStop(1, 'rgba(6,7,13,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
    if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;

    const size = p.z * 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 220, 255, ${0.25 + p.z * 0.4})`;
    ctx.fill();
  }

  // connect nearby particles with faint lines (network effect)
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 130) {
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(150, 180, 255, ${0.08 * (1 - dist / 130)})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }
  }

  requestAnimationFrame(draw);
}
draw();

// ---------- Effet tilt 3D sur les cartes glass au survol de la souris ----------
document.querySelectorAll('.tilt').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y / rect.height) - 0.5) * -10;
    const rotateY = ((x / rect.width) - 0.5) * 10;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
  });
});


// ---------- Carrousel 3D de projets (effet coverflow) ----------
const track = document.querySelector('.carousel-track');
const cards = document.querySelectorAll('.project-card');
const dotsWrap = document.querySelector('.carousel-dots');
let current = 0;

cards.forEach((_, i) => {
  const dot = document.createElement('div');
  dot.className = 'dot' + (i === 0 ? ' active' : '');
  dot.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(dot);
});
const dots = document.querySelectorAll('.dot');

function renderCarousel() {
  cards.forEach((card, i) => {
    const offset = i - current;
    const abs = Math.abs(offset);

    let x = offset * 230;
    let z = -abs * 260;
    let rotY = offset * -35;
    let opacity = 1;
    let blur = 0;

    if (abs > 2) {
      opacity = 0;
    } else if (abs === 2) {
      opacity = 0.35;
      blur = 2;
    }

    card.style.transform = `translate(-50%, -50%) translateX(${x}px) translateZ(${z}px) rotateY(${rotY}deg)`;
    card.style.opacity = opacity;
    card.style.filter = blur ? `blur(${blur}px)` : 'none';
    card.style.zIndex = 100 - abs;
    card.style.pointerEvents = abs === 0 ? 'auto' : (abs <= 2 ? 'auto' : 'none');
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === current));
}

function goTo(i) {
  current = (i + cards.length) % cards.length;
  renderCarousel();
}

document.querySelector('.carousel-btn.prev').addEventListener('click', () => goTo(current - 1));
document.querySelector('.carousel-btn.next').addEventListener('click', () => goTo(current + 1));

cards.forEach((card, i) => {
  card.addEventListener('click', () => {
    if (i !== current) goTo(i);
  });
});

renderCarousel();

// swipe support on touch devices
let touchStartX = 0;
document.querySelector('.carousel-stage').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.querySelector('.carousel-stage').addEventListener('touchend', (e) => {
  const diff = e.changedTouches[0].clientX - touchStartX;
  if (diff > 50) goTo(current - 1);
  else if (diff < -50) goTo(current + 1);
}, { passive: true });

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = 1;
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section, .card').forEach(el => {
  el.style.opacity = 0;
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.7s ease, transform 0.7s ease';
  observer.observe(el);
});
