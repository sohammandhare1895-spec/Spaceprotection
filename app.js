/* ============================================================
   ASTRA MAIN APP CONTROLLER
   Wires router, camera, health, HUD, panels, controls.
   ============================================================ */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const $ = id => document.getElementById(id);
  const dashboard = $('dashboard');
  const permissionView = $('permissionView');
  const visionView = $('visionView');
  const video = $('cameraFeed');
  const demoCanvas = $('demoCanvas');

  /* ---------- State ---------- */
  const state = {
    view: 'dashboard',
    metStart: Date.now(),
    soundOn: true,
    metTimer: null,
    healthTimer: null,
    commsTimer: null,
    metSeconds: 0,
    commsDelay: 1.3
  };

  /* ---------- Router ---------- */
  function showView(name) {
    [dashboard, permissionView, visionView].forEach(v => v.classList.remove('active'));
    if (name === 'dashboard') dashboard.classList.add('active');
    if (name === 'permission') permissionView.classList.add('active');
    if (name === 'vision') visionView.classList.add('active');
    state.view = name;
  }

  /* ---------- Init ---------- */
  Camera.init(video, demoCanvas);
  HUD.init();

  /* ---------- Dashboard → Permission ---------- */
  $('enterVisionBtn').addEventListener('click', () => {
    showView('permission');
    $('permMessage').innerHTML =
      'ASTRA uses your device\'s rear camera to render the first-person astronaut visor view. ' +
      'Your camera feed is processed <strong>only on this device</strong> and is never uploaded.';
  });
  $('backFromPermBtn').addEventListener('click', () => showView('dashboard'));

  /* ---------- Permission flow ---------- */
  $('grantCamBtn').addEventListener('click', async () => {
    $('grantCamBtn').textContent = 'REQUESTING…';
    try {
      await Camera.start('environment');
      enterVision(false);
    } catch (err) {
      $('grantCamBtn').textContent = 'GRANT CAMERA ACCESS';
      $('permMessage').innerHTML =
        `<strong style="color:#ff6b8a;">Camera access denied or unavailable.</strong><br><br>` +
        `Please enable camera permission in your browser, or use Demo Mode to explore the HUD.<br>` +
        `<small>Error: ${err.name || err.message}</small>`;
    }
  });

  $('demoModeBtn').addEventListener('click', () => {
    Camera.startDemo();
    enterVision(true);
  });

  /* ---------- Enter Vision ---------- */
  function enterVision(isDemo) {
    showView('vision');
    HUD.toast(isDemo ? 'Demo Mode — simulated environment' : 'Astronaut Vision Active');
    startTimers();
    // Prime first render
    HUD.updateVitals(Health.update());
    HUD.renderAlerts(Health.analyze());
    HUD.updateComms(state.commsDelay);
  }

  /* ---------- Timers ---------- */
  function startTimers() {
    stopTimers();
    state.metStart = Date.now() - state.metSeconds * 1000;
    state.metTimer = setInterval(() => {
      state.metSeconds = (Date.now() - state.metStart) / 1000;
      HUD.updateClocks(state.metSeconds);
    }, 1000);

    state.healthTimer = setInterval(() => {
      const v = Health.update();
      HUD.updateVitals(v);
      HUD.drawHeartbeat();
      if (Math.random() < 0.15) HUD.renderAlerts(Health.analyze());
    }, 1000);

    state.commsTimer = setInterval(() => {
      state.commsDelay = Math.max(0.4, Math.min(4.8,
        state.commsDelay + (Math.random() - 0.5) * 0.6));
      HUD.updateComms(state.commsDelay);
    }, 4000);

    HUD.updateClocks(state.metSeconds);
    HUD.drawHeartbeat();
  }

  function stopTimers() {
    clearInterval(state.metTimer);
    clearInterval(state.healthTimer);
    clearInterval(state.commsTimer);
    state.metTimer = state.healthTimer = state.commsTimer = null;
  }

  /* ---------- Exit Vision ---------- */
  function exitVision() {
    stopTimers();
    Camera.stop();
    showView('dashboard');
    HUD.toast('Camera stream stopped');
  }
  $('exitCtrl').addEventListener('click', exitVision);

  /* ---------- Controls ---------- */
  $('camSwitchCtrl').addEventListener('click', async () => {
    const res = await Camera.switchCamera();
    if (res.demo) { HUD.toast('Demo Mode — camera switching disabled'); return; }
    if (res.ok) HUD.toast(`Camera: ${res.facing === 'user' ? 'FRONT' : 'REAR'}`);
    else HUD.toast('Camera switch failed');
  });

  $('camToggleCtrl').addEventListener('click', () => {
    const s = Camera.getState();
    Camera.toggle(!s.isOn);
    HUD.toast(!s.isOn ? 'Camera ON' : 'Camera OFF');
  });

  $('fsCtrl').addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        HUD.toast('Fullscreen ON');
      } else {
        await document.exitFullscreen();
        HUD.toast('Fullscreen OFF');
      }
    } catch {
      HUD.toast('Fullscreen unavailable');
    }
  });

  /* ---------- Health Scan ---------- */
  async function runScan() {
    HUD.showScanOverlay(true, 'INITIALIZING…');
    HUD.toast('Health scan started');
    const analysis = await Health.runScan((text) => {
      HUD.showScanOverlay(true, text);
    });
    HUD.showScanOverlay(false);
    HUD.renderAlerts(analysis);
    HUD.toast('Scan complete — results updated');
  }
  $('scanCtrl').addEventListener('click', runScan);
  $('runScanBtn').addEventListener('click', runScan);

  /* ---------- AI Copilot ---------- */
  $('aiCtrl').addEventListener('click', () => {
    $('copilotPanel').classList.remove('hidden');
    $('chatInput').focus();
  });

  function addMsg(text, who) {
    const log = $('chatLog');
    const div = document.createElement('div');
    div.className = `msg ${who}`;
    div.textContent = text;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
  }

  function sendChat(text) {
    const input = $('chatInput');
    const q = (text ?? input.value).trim();
    if (!q) return;
    addMsg(q, 'user');
    input.value = '';
    setTimeout(() => {
      addMsg(Health.copilotReply(q), 'bot');
    }, 500);
  }
  $('chatSend').addEventListener('click', () => sendChat());
  $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
  document.querySelectorAll('.quick-prompts button').forEach(btn => {
    btn.addEventListener('click', () => sendChat(btn.dataset.prompt));
  });

  /* ---------- Emergency ---------- */
  $('emergCtrl').addEventListener('click', () => {
    $('emergencyPanel').classList.remove('hidden');
  });
  $('recordIncidentBtn').addEventListener('click', () => {
    const text = $('incidentLog').value.trim();
    if (!text) { HUD.toast('Enter incident details first'); return; }
    try {
      const key = 'astra_incident_log';
      const logs = JSON.parse(localStorage.getItem(key) || '[]');
      logs.push({ text, ts: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(logs));
      $('incidentSaved').classList.remove('hidden');
      HUD.toast('Incident recorded locally');
      $('incidentLog').value = '';
    } catch {
      HUD.toast('Storage unavailable');
    }
  });

  /* ---------- Panel close buttons ---------- */
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      $(btn.dataset.close).classList.add('hidden');
    });
  });

  /* ---------- Brightness / Sound ---------- */
  $('brightness').addEventListener('input', e => {
    HUD.applyBrightness(e.target.value);
  });
  $('soundCtrl').addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    $('soundCtrl').textContent = state.soundOn ? '🔊' : '🔇';
    HUD.toast(state.soundOn ? 'Sound ON' : 'Sound OFF (silent UI)');
  });

  /* ---------- Clock tick independent of vision (UTC always live) ---------- */
  setInterval(() => {
    if (state.view !== 'vision') {
      HUD.updateClocks(0);
    }
  }, 1000);

  /* ---------- Visibility / cleanup ---------- */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.view === 'vision') {
      // pause drawing while hidden to save CPU
      stopTimers();
    } else if (!document.hidden && state.view === 'vision') {
      startTimers();
    }
  });

  /* ---------- Global error safety ---------- */
  window.addEventListener('error', e => {
    console.error('ASTRA error:', e.message);
  });

  // Initial UTC render
  HUD.updateClocks(0);
})();
