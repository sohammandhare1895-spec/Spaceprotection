/* ============================================================
   ASTRA CAMERA MODULE
   Handles getUserMedia, camera switching, demo fallback,
   and proper stream cleanup.
   ============================================================ */

export const Camera = (() => {
  let stream = null;
  let videoEl = null;
  let demoCanvas = null;
  let currentFacing = 'environment';
  let isDemo = false;
  let demoTimer = null;
  let isOn = true;

  function init(video, canvas) {
    videoEl = video;
    demoCanvas = canvas;
    videoEl.setAttribute('playsinline', '');
    videoEl.setAttribute('muted', '');
  }

  async function start(facing = 'environment') {
    stop();
    isOn = true;
    isDemo = false;
    currentFacing = facing;
    try {
      const constraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      await videoEl.play().catch(() => {});
      demoCanvas.classList.add('hidden');
      videoEl.classList.remove('hidden');
      return { ok: true, facing };
    } catch (err) {
      console.warn('Camera start failed:', err.name, err.message);
      throw err;
    }
  }

  async function switchCamera() {
    if (isDemo) return { ok: false, demo: true };
    const next = currentFacing === 'environment' ? 'user' : 'environment';
    try {
      await start(next);
      return { ok: true, facing: next };
    } catch (err) {
      // try to restore previous
      try { await start(currentFacing); } catch {}
      return { ok: false, error: err };
    }
  }

  function toggle(on) {
    isOn = on;
    if (on) {
      if (isDemo) { startDemo(); return; }
      start(currentFacing).catch(() => startDemo());
    } else {
      stop();
      videoEl.classList.add('hidden');
      videoEl.style.visibility = 'hidden';
    }
  }

  function stop() {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      stream = null;
    }
    if (videoEl) videoEl.srcObject = null;
    if (demoTimer) { clearInterval(demoTimer); demoTimer = null; }
  }

  /* ---------- Demo Mode (fake starfield / nebula) ---------- */
  function startDemo() {
    isDemo = true;
    isOn = true;
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    videoEl.classList.add('hidden');
    demoCanvas.classList.remove('hidden');
    renderDemo();
    return { ok: true, demo: true };
  }

  function renderDemo() {
    const ctx = demoCanvas.getContext('2d');
    const W = demoCanvas.width = window.innerWidth;
    const H = demoCanvas.height = window.innerHeight;
    const stars = Array.from({ length: 220 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: Math.random() * 1.6 + 0.2,
      v: Math.random() * 0.3 + 0.05
    }));
    const nebula = [
      { x: W * 0.3, y: H * 0.4, r: 220, c: 'rgba(29,233,255,0.10)' },
      { x: W * 0.7, y: H * 0.6, r: 260, c: 'rgba(120,80,255,0.10)' },
      { x: W * 0.5, y: H * 0.3, r: 180, c: 'rgba(255,120,180,0.07)' }
    ];
    let t = 0;
    if (demoTimer) clearInterval(demoTimer);
    demoTimer = setInterval(() => {
      ctx.fillStyle = '#000814';
      ctx.fillRect(0, 0, W, H);
      // nebula glow
      nebula.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r);
        g.addColorStop(0, n.c);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });
      // stars
      stars.forEach(s => {
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,240,255,${0.4 + Math.sin(t * s.v) * 0.3})`;
        ctx.fill();
      });
      t += 0.05;
    }, 66);
  }

  function getState() {
    return { isDemo, isOn, facing: currentFacing, hasStream: !!stream };
  }

  window.addEventListener('pagehide', stop);
  window.addEventListener('beforeunload', stop);

  return { init, start, switchCamera, toggle, stop, startDemo, getState };
})();
