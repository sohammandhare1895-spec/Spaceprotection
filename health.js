/* ============================================================
   ASTRA HEALTH INTELLIGENCE
   Simulated vitals, baseline comparison, risk engine,
   health scan, AI Copilot logic.
   ============================================================ */

export const Health = (() => {
  // Simulated personal baseline (per astronaut)
  const baseline = {
    hr: 68, spo2: 98, rr: 14, temp: 36.6, pressure: 120
  };

  // Current vitals (drift over time)
  let vitals = {
    hr: 72, spo2: 98, rr: 14, temp: 36.7,
    suitPressure: 4.3, cabinTemp: 22.1, o2: 98.2, co2: 0.4, radiation: 0.12
  };

  let tick = 0;

  function update() {
    tick++;
    // Gentle random-walk within physiological ranges
    vitals.hr = clamp(vitals.hr + rand(-2, 2), 58, 96);
    vitals.spo2 = clamp(vitals.spo2 + rand(-0.4, 0.4), 94, 100);
    vitals.rr = clamp(vitals.rr + rand(-0.6, 0.6), 10, 22);
    vitals.temp = clamp(vitals.temp + rand(-0.05, 0.05), 36.0, 37.8);
    vitals.suitPressure = clamp(vitals.suitPressure + rand(-0.02, 0.02), 4.0, 4.6);
    vitals.cabinTemp = clamp(vitals.cabinTemp + rand(-0.1, 0.1), 20, 24);
    vitals.o2 = clamp(vitals.o2 + rand(-0.1, 0.1), 96, 100);
    vitals.co2 = clamp(vitals.co2 + rand(-0.01, 0.01), 0.2, 0.8);
    vitals.radiation = clamp(vitals.radiation + rand(-0.005, 0.005), 0.05, 0.3);
    return vitals;
  }

  function getVitals() { return { ...vitals }; }
  function getBaseline() { return { ...baseline }; }

  // Risk analysis — decision support, NOT diagnosis
  function analyze() {
    const alerts = [];
    const hrDev = Math.abs(vitals.hr - baseline.hr);
    const spo2Dev = baseline.spo2 - vitals.spo2;
    const tempDev = Math.abs(vitals.temp - baseline.temp);

    if (spo2Dev >= 2.5) alerts.push({ level: 'crit', text: `SpO₂ drop ${spo2Dev.toFixed(1)}% below baseline` });
    else if (spo2Dev >= 1.2) alerts.push({ level: 'warn', text: `SpO₂ trending low (−${spo2Dev.toFixed(1)}%)` });

    if (hrDev >= 18) alerts.push({ level: 'crit', text: `Heart rate deviation ${hrDev.toFixed(0)} bpm` });
    else if (hrDev >= 10) alerts.push({ level: 'warn', text: `Heart rate above baseline (+${hrDev.toFixed(0)})` });

    if (tempDev >= 0.8) alerts.push({ level: 'warn', text: `Body temp deviation ${tempDev.toFixed(1)}°C` });

    if (vitals.radiation > 0.22) alerts.push({ level: 'warn', text: `Radiation dose trending high` });
    if (vitals.co2 > 0.6) alerts.push({ level: 'warn', text: `Cabin CO₂ elevated (${vitals.co2.toFixed(2)}%)` });

    if (alerts.length === 0) alerts.push({ level: 'ok', text: 'All vitals within personal baseline' });

    // Body-system status
    const systems = {
      cardio: hrDev < 12 && vitals.spo2 > 95 ? 'nominal' : 'elevated',
      resp: vitals.spo2 > 95 && vitals.rr < 20 ? 'nominal' : 'watch',
      immune: vitals.temp < 37.5 ? 'nominal' : 'watch',
      musculo: 'nominal', // would need bone density sensors
      neuro: 'nominal'
    };

    // Recommendation
    let rec = 'Maintain hydration. Continue monitoring.';
    if (alerts.some(a => a.level === 'crit')) rec = 'Recommend resting, contacting flight surgeon, and re-scanning in 5 minutes.';
    else if (alerts.some(a => a.level === 'warn')) rec = 'Recommend reducing exertion and repeating health scan in 10 minutes.';

    return { alerts, systems, recommendation: rec };
  }

  // Health scan sequence
  async function runScan(onProgress) {
    const steps = [
      'CALIBRATING SENSORS…',
      'SAMPLING VITALS…',
      'COMPARING BASELINE…',
      'ANALYZING CARDIO…',
      'ANALYZING RESPIRATORY…',
      'EVALUATING RISK MODEL…',
      'SCAN COMPLETE'
    ];
    for (let i = 0; i < steps.length; i++) {
      onProgress?.(steps[i], i / (steps.length - 1));
      await new Promise(r => setTimeout(r, 500));
    }
    return analyze();
  }

  // Future health simulator (7-day projection)
  function simulate7Days() {
    let hr = vitals.hr, spo2 = vitals.spo2, temp = vitals.temp;
    const days = [];
    for (let d = 1; d <= 7; d++) {
      hr = clamp(hr + rand(-3, 3) + 0.5, 58, 100);
      spo2 = clamp(spo2 + rand(-0.5, 0.3), 93, 100);
      temp = clamp(temp + rand(-0.1, 0.1), 36, 38);
      days.push({ day: d, hr: Math.round(hr), spo2: +spo2.toFixed(1), temp: +temp.toFixed(2) });
    }
    return days;
  }

  // AI Copilot response
  function copilotReply(question) {
    const q = question.toLowerCase();
    const v = vitals;
    if (q.includes('status') || q.includes('how am i'))
      return `Commander, your heart rate is ${v.hr.toFixed(0)} bpm, SpO₂ ${v.spo2.toFixed(0)}%, respiration ${v.rr.toFixed(0)}/min, body temp ${v.temp.toFixed(1)}°C. All indicators are within your simulated baseline. Note: these are simulated demo readings.`;
    if (q.includes('bone') || q.includes('musculo'))
      return `Long-duration microgravity causes ~1–1.5% bone loss per month without countermeasures. Your musculoskeletal risk is currently nominal, but continue resistance exercise 2.5 h/day. Bone density measurement requires future onboard DEXA hardware.`;
    if (q.includes('emergency') || q.includes('hurt'))
      return `EMERGENCY PROTOCOL: 1) Check airway, breathing, circulation. 2) Open the Emergency panel. 3) Contact Mission Control via the comms link. 4) Record the incident locally. I will log this and prepare a report.`;
    if (q.includes('cardio') || q.includes('heart'))
      return `Cardiovascular: HR ${v.hr.toFixed(0)} bpm vs baseline 68. SpO₂ ${v.spo2.toFixed(0)}%. No arrhythmia pattern detected in simulated waveform. Note: this is decision-support, not a diagnosis.`;
    if (q.includes('radiat'))
      return `Current simulated radiation dose is ${v.radiation.toFixed(2)} mSv. Long-duration missions accumulate risk; maintain shielding protocols and track cumulative dose.`;
    if (q.includes('oxygen') || q.includes('spo2'))
      return `SpO₂ is ${v.spo2.toFixed(0)}%. A real SpO₂ requires a pulse oximeter — this browser cannot measure it via the camera. Treat as simulated.`;
    return `I'm analyzing your simulated health data. Ask me about vitals, bone loss, radiation, cardiovascular, or emergency protocols. Remember: all readings in this demo are simulated.`;
  }

  /* helpers */
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rand(a, b) { return Math.random() * (b - a) + a; }

  return {
    update, getVitals, getBaseline, analyze, runScan,
    simulate7Days, copilotReply
  };
})();
