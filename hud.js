/* ============================================================
   ASTRA HUD RENDERER
   Binds health data to DOM, draws heartbeat waveform,
   handles toast / scan overlay.
   ============================================================ */

export const HUD = (() => {
  let heartCtx = null, heartCanvas = null;
  let waveData = new Array(60).fill(0);
  let waveIndex = 0;

  function init() {
    heartCanvas = document.getElementById('heartWave');
    if (heartCanvas) heartCtx = heartCanvas.getContext('2d');
  }

  function fmtClock(sec) {
    const h = String(Math.floor(sec / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function updateClocks(metSeconds) {
    setText('metClock', fmtClock(metSeconds));
    const now = new Date();
    setText('utcClock', now.toISOString().slice(11, 19));
  }

  function updateVitals(v) {
    setText('tPressure', `${v.suitPressure.toFixed(1)} psi`);
    setText('tTemp', `${v.cabinTemp.toFixed(1)} °C`);
    setText('tO2', `${v.o2.toFixed(1)} %`);
    setText('tCO2', `${v.co2.toFixed(2)} %`);
    setText('tRad', `${v.radiation.toFixed(2)} mSv`);
    setText('tHR', `${Math.round(v.hr)} bpm`);
    setText('tSpO2', `${Math.round(v.spo2)} %`);
    setText('tRR', `${Math.round(v.rr)} /min`);
    setText('tBody', `${v.temp.toFixed(1)} °C`);
  }

  function drawHeartbeat() {
    if (!heartCtx) return;
    const W = heartCanvas.width, H = heartCanvas.height;
    // push sample — simulate ECG-ish waveform
    waveIndex++;
    const phase = (waveIndex % 30) / 30;
    let val = 0;
    if (phase < 0.05) val = 1;              // QRS spike
    else if (phase < 0.12) val = -0.3;
    else if (phase < 0.2) val = 0.5;
    else if (phase < 0.5) val = 0.1 * Math.sin(phase * 40);
    else val = 0;
    waveData.shift();
    waveData.push(val);

    heartCtx.clearRect(0, 0, W, H);
    heartCtx.strokeStyle = '#1de9ff';
    heartCtx.lineWidth = 1.5;
    heartCtx.shadowColor = '#1de9ff';
    heartCtx.shadowBlur = 6;
    heartCtx.beginPath();
    const step = W / (waveData.length - 1);
    waveData.forEach((v, i) => {
      const x = i * step;
      const y = H / 2 - v * (H / 2 - 3);
      i === 0 ? heartCtx.moveTo(x, y) : heartCtx.lineTo(x, y);
    });
    heartCtx.stroke();
    heartCtx.shadowBlur = 0;
  }

  function renderAlerts(analysis) {
    const box = document.getElementById('aiAlerts');
    if (!box) return;
    box.innerHTML = '';
    analysis.alerts.forEach(a => {
      const div = document.createElement('div');
      div.className = `alert-item ${a.level === 'ok' ? 'ok' : a.level === 'warn' ? 'warn' : 'crit'}`;
      div.textContent = a.text;
      box.appendChild(div);
    });
    setText('aiRec', `Recommendation: ${analysis.recommendation}`);
    highlightSystems(analysis.systems);
  }

  function highlightSystems(systems) {
    document.querySelectorAll('.body-part, .sys-item').forEach(el => {
      const sys = el.dataset.sys;
      el.classList.toggle('active', systems?.[sys] === 'elevated' || systems?.[sys] === 'watch');
    });
  }

  function updateComms(delay) {
    const online = delay < 5;
    setText('commsState', online ? 'ONLINE' : 'DELAYED');
    setText('signalDelay', `${delay.toFixed(1)} s`);
    const dot = document.querySelector('.comms-status .dot');
    if (dot) dot.classList.toggle('online', online);
  }

  function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }

  function toast(msg, ms = 2200) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), ms);
  }

  function showScanOverlay(show, text) {
    const o = document.getElementById('scanOverlay');
    if (!o) return;
    o.classList.toggle('hidden', !show);
    if (text) setText('scanText', text);
  }

  function applyBrightness(pct) {
    const v = document.getElementById('visionView');
    if (v) v.style.filter = `brightness(${pct / 100})`;
  }

  return {
    init, updateClocks, updateVitals, drawHeartbeat,
    renderAlerts, updateComms, toast,
    showScanOverlay, applyBrightness, setText
  };
})();
