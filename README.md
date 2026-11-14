# ASTRA — Immersive Astronaut Vision System

A NASA Space Apps-style astronaut health monitoring experience built with vanilla HTML/CSS/JS.
Click **ENTER ASTRONAUT VISION**, grant camera access, and see the world through a futuristic
helmet HUD with live telemetry, simulated vitals, AI health copilot, and emergency mode.

## ✨ Features

- **Real WebRTC camera** via `navigator.mediaDevices.getUserMedia()`
- Rear camera by default on mobile, front/rear switching
- Full-screen live feed behind a curved helmet HUD
- Camera ON/OFF, Fullscreen, Demo fallback
- Simulated vitals (HR, SpO₂, RR, Temp, Suit, Env) — clearly labeled **SIM**
- Animated ECG heartbeat waveform
- Health Scan animation with AI analysis
- AI Medical Copilot chat panel with quick prompts
- Emergency medical panel + incident log (saved to `localStorage`)
- Body-system visualization (Cardio / Resp / Immune / Musculo / Neuro)
- Mission clock (MET), UTC clock, comms delay simulation
- Responsive: mobile, tablet, desktop
- **Proper stream cleanup** on exit (all tracks stopped)

## 🚨 Important Notes

- A browser camera **cannot** measure SpO₂, blood pressure, radiation, or bone density.
  All such readings in this app are **explicitly labeled as simulated demo data**.
  Real integrations would require onboard medical hardware/APIs.
- This is **decision-support**, **not medical diagnosis**.
- Camera feed is processed **100% locally** — nothing is uploaded.

## 🛠 Running Locally

Camera requires a **secure context**: `localhost` or `https://`.

### Option A — Python HTTP server (quickest)
```bash
python3 -m http.server 5173
# open http://localhost:5173
