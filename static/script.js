// ============ СЛАЙД-ШОУ ============
const slide = document.getElementById('slide');
const dots = document.querySelectorAll('.dot');
let currentIdx = 0;

if (slide && window.PHOTOS && window.PHOTOS.length > 1) {
  setInterval(() => {
    slide.classList.add('fade');
    setTimeout(() => {
      currentIdx = (currentIdx + 1) % window.PHOTOS.length;
      slide.src = window.PHOTOS[currentIdx];
      dots.forEach((d, i) => d.classList.toggle('active', i === currentIdx));
      slide.classList.remove('fade');
    }, 500);
  }, window.SLIDE_INTERVAL || 4000);
}

// ============ МУЗЫКА ============
const audio = document.getElementById('audio');
const musicBtn = document.getElementById('musicBtn');
let musicPlaying = false;

if (musicBtn && audio) {
  musicBtn.addEventListener('click', () => {
    if (musicPlaying) {
      audio.pause();
      musicBtn.textContent = '▶ Включить музыку';
    } else {
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Autoplay blocked:', e));
      musicBtn.textContent = '⏸ Пауза';
    }
    musicPlaying = !musicPlaying;
  });

  // Автозапуск после первого клика в любом месте
  document.addEventListener('click', function autoStart() {
    if (!musicPlaying) {
      audio.volume = 0.5;
      audio.play().then(() => {
        musicPlaying = true;
        musicBtn.textContent = '⏸ Пауза';
      }).catch(() => {});
    }
    document.removeEventListener('click', autoStart);
  }, { once: true });
}

// ============ КОНФЕТТИ ============
function launchConfetti() {
  const colors = ['#e94e77','#b06ab3','#ffd700','#ff6b9d','#a8e6cf','#fbc2eb'];
  for (let i = 0; i < 80; i++) {
    setTimeout(() => {
      const c = document.createElement('div');
      c.className = 'confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      const size = Math.random() * 8 + 6;
      c.style.width = c.style.height = size + 'px';
      document.body.appendChild(c);

      const duration = Math.random() * 3000 + 2000;
      const drift = (Math.random() - 0.5) * 300;
      c.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${drift}px, ${window.innerHeight + 50}px) rotate(${Math.random()*720}deg)`, opacity: 0 }
      ], { duration, easing: 'ease-out' });

      setTimeout(() => c.remove(), duration);
    }, i * 25);
  }
}

document.getElementById('confettiBtn')?.addEventListener('click', launchConfetti);

// ============ СЕРДЕЧКИ ПРИ КЛИКЕ ============
document.addEventListener('click', (e) => {
  const hearts = ['💖','💕','🌸','✨','💗','🎈'];
  const h = document.createElement('div');
  h.className = 'heart-pop';
  h.textContent = hearts[Math.floor(Math.random() * hearts.length)];
  h.style.left = e.clientX + 'px';
  h.style.top = e.clientY + 'px';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 1000);
});

// ============ ПОЖЕЛАНИЯ ============
const wishList = document.getElementById('wishList');
const wishSend = document.getElementById('wishSend');

function renderWishes(wishes) {
  if (!wishList) return;
  if (!wishes.length) {
    wishList.innerHTML = '<p style="text-align:center;color:#b08a9a;font-size:0.9rem;">Пока пожеланий нет — будь первым! 💌</p>';
    return;
  }
  wishList.innerHTML = wishes.slice().reverse().map(w => `
    <div class="wish-card">
      <div class="author">${escapeHtml(w.author)}<span class="date">${w.date}</span></div>
      <div class="text">${escapeHtml(w.text)}</div>
    </div>
  `).join('');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

async function loadWishes() {
  try {
    const r = await fetch('/api/wishes');
    const data = await r.json();
    renderWishes(data.wishes || []);
  } catch (e) { console.warn(e); }
}

wishSend?.addEventListener('click', async () => {
  const author = document.getElementById('wishAuthor').value.trim() || 'Гость';
  const text = document.getElementById('wishText').value.trim();
  if (!text) return alert('Напиши пожелание 💌');

  wishSend.disabled = true;
  try {
    const r = await fetch('/api/wishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, text })
    });
    const data = await r.json();
    if (data.ok) {
      document.getElementById('wishText').value = '';
      renderWishes(data.wishes);
      launchConfetti();
    } else {
      alert(data.error || 'Ошибка');
    }
  } catch (e) {
    alert('Не удалось отправить');
  } finally {
    wishSend.disabled = false;
  }
});

loadWishes();

// ============ АВТО-КОНФЕТТИ ПРИ ЗАГРУЗКЕ ============
window.addEventListener('load', () => setTimeout(launchConfetti, 800));