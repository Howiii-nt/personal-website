/* ---------- element refs ---------- */

const stage = document.getElementById('stage');
const cardTilt = document.getElementById('cardTilt');
const cardFlip = document.getElementById('cardFlip');
const cardShadow = document.getElementById('cardShadow');
const flipControl = document.getElementById('flipControl');

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- idle auto-rotation that settles to "front" on select ---------- */
/*
  The card spins gently on its own. Hovering the stage pauses the spin (so
  reading the front content, including the two action buttons, never fights
  with the animation). Clicking the card locks it: rotation eases to the
  nearest front-facing rest angle and stops there. Deselecting resumes the
  spin from wherever it stopped.
*/

let angle = 0; // current rotateY, in degrees, unbounded (can exceed 360)
let wobble = 0; // small rotateX drift for a floating feel
let stopTarget = null; // rest angle the card eases toward once selected
let isHovering = false;
let selected = false;
let lastTimestamp = null;

const SPIN_SPEED = 34; // degrees per second while idle
const REST_EASE = prefersReducedMotion ? 1 : 0.07;

function animate(timestamp) {
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.1);
  lastTimestamp = timestamp;

  if (selected) {
    if (stopTarget === null) {
      const mod = ((angle % 360) + 360) % 360;
      stopTarget = mod <= 180 ? angle - mod : angle + (360 - mod);
    }
    angle += (stopTarget - angle) * REST_EASE;
    wobble += (0 - wobble) * REST_EASE;
    if (Math.abs(stopTarget - angle) < 0.05) {
      angle = stopTarget;
      wobble = 0;
    }
  } else {
    stopTarget = null;
    if (!isHovering && !prefersReducedMotion) {
      angle += SPIN_SPEED * dt;
    }
    wobble = prefersReducedMotion ? 0 : Math.sin(timestamp / 1400) * 4;
  }

  cardTilt.style.transform = `rotateY(${angle}deg) rotateX(${wobble}deg)`;

  const facing = Math.abs(Math.cos((angle * Math.PI) / 180));
  cardShadow.style.opacity = String(0.4 + facing * 0.3);
  cardShadow.style.transform = `scaleX(${0.85 + facing * 0.15})`;

  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

stage.addEventListener('mouseenter', () => {
  isHovering = true;
});

stage.addEventListener('mouseleave', () => {
  isHovering = false;
});

/* ---------- select / lock-to-front ---------- */

function isInteractive(el) {
  return el.closest('button, input, a');
}

function setSelected(next) {
  selected = next;
  cardTilt.classList.toggle('is-selected', selected);
  flipControl.classList.toggle('is-visible', selected);

  if (!selected) {
    setFlipped(false);
  }
}

cardTilt.addEventListener('click', (event) => {
  if (isInteractive(event.target)) return;
  setSelected(!selected);
});

document.addEventListener('click', (event) => {
  if (!selected) return;
  if (stage.contains(event.target)) return;
  setSelected(false);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && selected) {
    setSelected(false);
  }
});

/* ---------- flip to back ---------- */

let flipped = false;

function setFlipped(next) {
  flipped = next;
  cardFlip.classList.toggle('is-flipped', flipped);
  flipControl.classList.toggle('is-flipped', flipped);
  flipControl.setAttribute(
    'aria-label',
    flipped ? 'Flip card to see the front' : 'Flip card to see the back'
  );
}

flipControl.addEventListener('click', (event) => {
  event.stopPropagation();
  setFlipped(!flipped);
});

/* ---------- photo upload (stored locally in the browser) ---------- */

const photoFrame = document.getElementById('photoFrame');
const photoInput = document.getElementById('photoInput');
const photoPreview = document.getElementById('photoPreview');
const photoRemove = document.getElementById('photoRemove');

function applyPhoto(dataUrl) {
  if (!dataUrl) return;
  photoPreview.src = dataUrl;
  photoFrame.classList.add('has-photo');
}

photoFrame.addEventListener('click', (event) => {
  if (event.target === photoRemove) return;
  photoInput.click();
});

photoInput.addEventListener('change', () => {
  const file = photoInput.files && photoInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result;
    applyPhoto(dataUrl);
    try {
      localStorage.setItem('card-photo', dataUrl);
    } catch (err) {
      /* storage full or unavailable, ignore silently */
    }
  };
  reader.readAsDataURL(file);
});

photoRemove.addEventListener('click', (event) => {
  event.stopPropagation();
  photoPreview.removeAttribute('src');
  photoFrame.classList.remove('has-photo');
  photoInput.value = '';
  try {
    localStorage.removeItem('card-photo');
  } catch (err) {
    /* ignore */
  }
});

/* ---------- theme picker (stored locally in the browser) ---------- */

const themeSwatches = document.querySelectorAll('.swatch');

function applyTheme(theme) {
  cardTilt.setAttribute('data-theme', theme);
  themeSwatches.forEach((swatch) => {
    swatch.classList.toggle('is-active', swatch.dataset.theme === theme);
  });
}

themeSwatches.forEach((swatch) => {
  swatch.addEventListener('click', (event) => {
    event.stopPropagation();
    const theme = swatch.dataset.theme;
    applyTheme(theme);
    try {
      localStorage.setItem('card-theme', theme);
    } catch (err) {
      /* ignore */
    }
  });
});

/* ---------- restore saved photo/theme ---------- */

try {
  const savedPhoto = localStorage.getItem('card-photo');
  if (savedPhoto) applyPhoto(savedPhoto);

  const savedTheme = localStorage.getItem('card-theme');
  if (savedTheme) applyTheme(savedTheme);
} catch (err) {
  /* storage unavailable, fall back to defaults */
}

/* ---------- modals (bio content) ---------- */

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
}

function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

document.querySelectorAll('.face-btn').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();
    openModal(button.dataset.modalTarget);
  });
});

document.querySelectorAll('.modal-overlay').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal(modal);
  });
});

document.querySelectorAll('.modal-close').forEach((button) => {
  button.addEventListener('click', () => {
    closeModal(button.closest('.modal-overlay'));
  });
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(closeModal);
  }
});

/* ---------- connect button ---------- */

const connectBtn = document.getElementById('connectBtn');
if (connectBtn) {
  connectBtn.addEventListener('click', (event) => {
    event.stopPropagation();
    window.open(
      'https://www.linkedin.com/in/howard-rincon-3205a52aa/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BukNT2dD0Rj2Oy00lVup0KQ%3D%3D',
      '_blank',
      'noopener,noreferrer'
    );
  });
}
