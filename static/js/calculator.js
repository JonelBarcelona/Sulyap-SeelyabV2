'use strict';

let currentStep = 1;
const TOTAL_STEPS = 4;

const AREAS = [
  { district:"1st District", location:"Tabaco City",  classification:"Commercial", type:"Mainland", rate:10.3008, psh:5.04, lat:13.3556, lon:123.7328 },
  { district:"1st District", location:"Tiwi",          classification:"Residential",type:"Mainland", rate:11.2812, psh:5.04, lat:13.4561, lon:123.6714 },
  { district:"1st District", location:"Malinao",       classification:"Residential",type:"Mainland", rate:11.2812, psh:5.04, lat:13.4003, lon:123.6053 },
  { district:"1st District", location:"Bacacay",       classification:"Residential",type:"Mainland", rate:11.2812, psh:5.04, lat:13.2914, lon:123.7869 },
  { district:"1st District", location:"Malilipot",     classification:"Residential",type:"Mainland", rate:11.2812, psh:5.04, lat:13.3197, lon:123.7353 },
  { district:"1st District", location:"Sto. Domingo",  classification:"Residential",type:"Mainland", rate:11.2812, psh:5.04, lat:13.2556, lon:123.7683 },
  { district:"2nd District", location:"Legazpi City",  classification:"Commercial", type:"Mainland", rate:10.3008, psh:4.98, lat:13.1390, lon:123.7348 },
  { district:"2nd District", location:"Daraga",        classification:"Commercial", type:"Mainland", rate:10.3008, psh:4.98, lat:13.1583, lon:123.6975 },
  { district:"2nd District", location:"Camalig",       classification:"Residential",type:"Mainland", rate:11.2812, psh:4.98, lat:13.1769, lon:123.6428 },
  { district:"2nd District", location:"Guinobatan",    classification:"Residential",type:"Mainland", rate:11.2812, psh:4.98, lat:13.1819, lon:123.5958 },
  { district:"2nd District", location:"Rapu-Rapu",     classification:"Residential",type:"Island",   rate:10.3008, psh:5.11, lat:13.1928, lon:124.1358 },
  { district:"2nd District", location:"Manito",        classification:"Residential",type:"Mainland", rate:10.3008, psh:4.92, lat:13.0739, lon:123.5664 },
  { district:"3rd District", location:"Ligao City",    classification:"Commercial", type:"Mainland", rate:10.3008, psh:4.85, lat:13.2272, lon:123.5258 },
  { district:"3rd District", location:"Oas",           classification:"Residential",type:"Mainland", rate:11.2812, psh:4.85, lat:13.2586, lon:123.4942 },
  { district:"3rd District", location:"Polangui",      classification:"Residential",type:"Mainland", rate:11.2812, psh:4.85, lat:13.2938, lon:123.4870 },
  { district:"3rd District", location:"Libon",         classification:"Residential",type:"Mainland", rate:11.2812, psh:4.85, lat:13.2991, lon:123.3683 },
  { district:"3rd District", location:"Pio Duran",     classification:"Residential",type:"Mainland", rate:11.2812, psh:4.78, lat:13.0276, lon:123.3959 },
  { district:"3rd District", location:"Jovellar",      classification:"Residential",type:"Mainland", rate:11.2812, psh:4.78, lat:13.0522, lon:123.5994 },
];

const EFF = {
  shade:   { none:1.0, partial:0.80, heavy:0.50 },
  dust:    { weekly:0.98, monthly:0.95, rarely:0.90 },
  weather: { sunny:1.0, mixed:0.85, cloudy:0.70 },
};

// ── Navigation ────────────────────────────────────────────────────────────────

function goToStep(n) {
  if (typeof n === 'number') {
    if (n > currentStep) {
      for (let i = currentStep; i < n; i++) {
        if (i === 1 && !validateStep1()) return;
        if (i === 2 && !validateStep2()) return;
      }
    }
  }

  const prevStep = currentStep;
  const allSteps = document.querySelectorAll('.step');
  allSteps.forEach(s => s.classList.remove('active', 'enter-right', 'enter-left', 'enter-up'));

  const targetId = n === 'results' ? 'step-results' : `step-${n}`;
  const target = document.getElementById(targetId);
  target.classList.add('active');

  const nextNum = n === 'results' ? 5 : n;
  if (nextNum > prevStep)       target.classList.add('enter-right');
  else if (nextNum < prevStep)  target.classList.add('enter-left');
  else                          target.classList.add('enter-up');

  currentStep = nextNum;

  updateProgress(currentStep);
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (n === 3) {
    updateEffPreview();
    fetchWeatherSuggestion();
  }
}

function restartWizard() { goToStep(1); }

function updateProgress(step) {
  const pcts = { 1: '12%', 2: '37%', 3: '62%', 4: '87%', 5: '100%' };
  document.getElementById('progress-fill').style.width = pcts[step] || '12%';

  document.querySelectorAll('.pstep').forEach((el, i) => {
    const s = i + 1;
    el.classList.toggle('active', s === step);
    el.classList.toggle('done', s < step);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

function validateStep1() {
  const mode = document.querySelector('input[name="input_mode"]:checked').value;
  if (mode === 'A') {
    const v = parseFloat(document.getElementById('monthly_bill').value);
    if (!v || v <= 0) { alert('Please enter your monthly electricity bill.'); return false; }
  } else {
    if (getTotalKwh() <= 0) { alert('Please select at least one appliance and enter hours of use.'); return false; }
  }
  return true;
}

function validateStep2() {
  const val = document.getElementById('area-select').value;
  if (!val) { alert('Please select your location.'); return false; }
  if (val === 'custom') {
    const rate = parseFloat(document.getElementById('custom_rate').value);
    const psh  = parseFloat(document.getElementById('custom_psh').value);
    if (!rate || rate <= 0) { alert('Please enter your utility rate.'); return false; }
    if (!psh  || psh  <= 0) { alert('Please enter your Peak Sun Hours.'); return false; }
  }
  return true;
}

// ── Step 1: Mode ──────────────────────────────────────────────────────────────

document.querySelectorAll('input[name="input_mode"]').forEach(r => {
  r.addEventListener('change', () => {
    const isA = r.value === 'A';
    document.getElementById('fields-a').classList.toggle('hidden', !isA);
    document.getElementById('fields-b').classList.toggle('hidden',  isA);
  });
});

// ── Step 1: Appliances ────────────────────────────────────────────────────────

function getAppWatts(row) {
  const wattsInput = row.querySelector('.app-watts');
  const parsed = parseFloat(wattsInput ? wattsInput.value : 0);
  const cb = row.querySelector('.app-check');
  return (!isNaN(parsed) && parsed > 0) ? parsed : parseFloat(cb.dataset.watts);
}

function getTotalKwh() {
  let total = 0;
  document.querySelectorAll('.app-check:checked').forEach(cb => {
    const row = cb.closest('.app-item');
    const hrs = parseFloat(row.querySelector('.app-hours').value) || 0;
    const watts = getAppWatts(row);
    total += (watts * hrs) / 1000;
  });
  return total;
}

function updateTotalKwh() {
  const t = getTotalKwh();
  document.getElementById('total-kwh').textContent = t.toFixed(3) + ' kWh / day';
}

document.querySelectorAll('.app-check').forEach(cb => {
  cb.addEventListener('change', () => {
    const row = cb.closest('.app-item');
    row.querySelector('.app-hrs').classList.toggle('hidden', !cb.checked);
    if (!cb.checked) {
      row.querySelector('.app-hours').value = '';
      row.querySelector('.app-kwh').textContent = '';
    }
    updateTotalKwh();
  });
});

document.querySelectorAll('.app-hours').forEach(input => {
  input.addEventListener('input', () => {
    const row   = input.closest('.app-item');
    const watts = getAppWatts(row);
    const hrs   = parseFloat(input.value) || 0;
    const kwh   = (watts * hrs) / 1000;
    row.querySelector('.app-kwh').textContent = kwh > 0 ? kwh.toFixed(3) + ' kWh' : '';
    updateTotalKwh();
  });
});

document.querySelectorAll('.app-watts').forEach(input => {
  input.addEventListener('input', () => {
    const row  = input.closest('.app-item');
    const hrs  = parseFloat(row.querySelector('.app-hours').value) || 0;
    const watts = parseFloat(input.value) || 0;
    const kwh  = (watts * hrs) / 1000;
    row.querySelector('.app-kwh').textContent = (kwh > 0 && hrs > 0) ? kwh.toFixed(3) + ' kWh' : '';
    updateTotalKwh();
  });
});

// ── Step 2: Area Select ───────────────────────────────────────────────────────

document.getElementById('area-select').addEventListener('change', function () {
  const val = this.value;
  const preview     = document.getElementById('area-preview');
  const customFlds  = document.getElementById('custom-fields');

  if (!val) {
    preview.classList.add('hidden');
    customFlds.classList.add('hidden');
    return;
  }

  if (val === 'custom') {
    preview.classList.add('hidden');
    customFlds.classList.remove('hidden');
    return;
  }

  customFlds.classList.add('hidden');
  const area = AREAS[parseInt(val)];
  if (area) {
    document.getElementById('prev-rate').textContent  = `₱${area.rate.toFixed(4)} / kWh`;
    document.getElementById('prev-psh').textContent   = `${area.psh} hrs / day`;
    document.getElementById('prev-class').textContent = `${area.classification}, ${area.type}`;
    preview.classList.remove('hidden');
  }
});

// ── Step 3: Weather Suggestion from Open-Meteo ───────────────────────────────

let _weatherFetched = null;

async function fetchWeatherSuggestion() {
  const areaVal = document.getElementById('area-select').value;
  const hint = document.getElementById('weather-hint');

  if (!areaVal || areaVal === 'custom' || areaVal === _weatherFetched) return;
  _weatherFetched = areaVal;

  hint.className = 'weather-hint loading';
  hint.innerHTML = '<span>Fetching weather data for your area…</span>';
  hint.classList.remove('hidden');

  try {
    const res  = await fetch(`/weather-suggestion/${areaVal}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'No data');

    hint.className = 'weather-hint';
    hint.innerHTML = `
      <span class="hint-badge">Open-Meteo</span>
      <span><strong>${data.location}</strong>: ${data.description} Suggested: <strong>${data.label}</strong>.</span>
    `;

    const radio = document.querySelector(`input[name="weather"][value="${data.suggestion}"]`);
    if (radio) {
      radio.checked = true;
      updateEffPreview();
    }
  } catch (e) {
    hint.classList.add('hidden');
    _weatherFetched = null;
  }
}

// ── Step 3: Efficiency Preview ────────────────────────────────────────────────

function updateEffPreview() {
  const shade   = document.querySelector('input[name="shade"]:checked')?.value   || 'none';
  const dust    = document.querySelector('input[name="dust"]:checked')?.value    || 'weekly';
  const weather = document.querySelector('input[name="weather"]:checked')?.value || 'sunny';
  const eff = EFF.shade[shade] * EFF.dust[dust] * EFF.weather[weather] * 0.97;
  document.getElementById('eff-preview-val').textContent = (eff * 100).toFixed(1) + '%';
}

document.querySelectorAll('input[name="shade"], input[name="dust"], input[name="weather"]')
  .forEach(r => r.addEventListener('change', updateEffPreview));

// ── Calculation ───────────────────────────────────────────────────────────────

let lastPayload = null;

async function runCalculation() {
  const btn = document.getElementById('calc-btn');
  btn.disabled = true;
  btn.textContent = 'Calculating…';

  const mode    = document.querySelector('input[name="input_mode"]:checked').value;
  const areaVal = document.getElementById('area-select').value;
  const shade   = document.querySelector('input[name="shade"]:checked').value;
  const dust    = document.querySelector('input[name="dust"]:checked').value;
  const weather = document.querySelector('input[name="weather"]:checked').value;
  const panel   = document.querySelector('input[name="panel"]:checked').value;

  const payload = { input_mode: mode, shade, dust, weather, panel };

  if (areaVal === 'custom') {
    payload.area_index   = 'custom';
    payload.custom_rate  = parseFloat(document.getElementById('custom_rate').value);
    payload.custom_psh   = parseFloat(document.getElementById('custom_psh').value);
  } else {
    payload.area_index = parseInt(areaVal);
  }

  if (mode === 'A') {
    payload.monthly_bill = parseFloat(document.getElementById('monthly_bill').value);
  } else {
    const usage = {};
    document.querySelectorAll('.app-check:checked').forEach(cb => {
      const row = cb.closest('.app-item');
      const hours = parseFloat(row.querySelector('.app-hours').value) || 0;
      const watts = getAppWatts(row);
      usage[cb.dataset.name] = { hours, watts };
    });
    payload.appliance_usage = usage;
  }

  lastPayload = payload;

  try {
    const res  = await fetch('/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Calculation failed.');
    renderResults(data.result);
    goToStep('results');
  } catch (e) {
    alert('Error: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Calculate My System';
  }
}

// ── Print & Download ──────────────────────────────────────────────────────────

function printReport() {
  window.print();
}

async function downloadReport() {
  if (!lastPayload) return;
  const btn = document.getElementById('btn-download');
  btn.disabled = true;
  btn.textContent = 'Preparing…';
  try {
    const res = await fetch('/download-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lastPayload),
    });
    if (!res.ok) throw new Error('Download failed.');
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match ? match[1] : 'SULYAP-SEELYAB-Report.html';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert('Could not download report: ' + e.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '&#8675; Download Report';
  }
}

// ── Animations ────────────────────────────────────────────────────────────────

function countUp(el, target, decimals, prefix, suffix, duration) {
  const start = performance.now();
  const from = 0;
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const value = from + (target - from) * ease;
    el.textContent = prefix + value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = prefix + target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(tick);
}

function animateResults() {
  const kpis = document.querySelectorAll('.kpi');
  kpis.forEach((kpi, i) => {
    setTimeout(() => kpi.classList.add('visible'), i * 120);
  });

  const sections = document.querySelectorAll('.detail-section');
  sections.forEach((sec, i) => {
    setTimeout(() => sec.classList.add('visible'), 300 + i * 100);
  });

  const disclaimer = document.querySelector('.disclaimer');
  if (disclaimer) {
    disclaimer.style.opacity = '0';
    disclaimer.style.transition = 'opacity 0.4s ease';
    setTimeout(() => { disclaimer.style.opacity = '1'; }, 700);
  }
}

// ── Render Results ────────────────────────────────────────────────────────────

function peso(n) { return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function renderResults(r) {
  const loc      = r.area?.location || 'Custom Location';
  const panelName = r.panel_info.name;

  const shadeLabel   = { none:'None (×1.00)',  partial:'Partial (×0.80)', heavy:'Heavy (×0.50)' };
  const dustLabel    = { weekly:'Weekly (×0.98)', monthly:'Monthly (×0.95)', rarely:'Rarely (×0.90)' };
  const weatherLabel = { sunny:'Mostly Sunny (×1.00)', mixed:'Mixed (×0.85)', cloudy:'Often Cloudy (×0.70)' };

  let breakdownHtml = '';
  if (r.input_mode === 'B' && r.appliance_breakdown?.length) {
    const rows = r.appliance_breakdown.map(a =>
      `<tr><td>${a.name}</td><td>${a.watts}W</td><td>${a.hours} hrs</td><td>${a.kwh.toFixed(3)} kWh</td></tr>`
    ).join('');
    breakdownHtml = `
      <div class="detail-section">
        <div class="detail-section-head">Appliance Breakdown</div>
        <table class="app-table">
          <thead><tr><th>Appliance</th><th>Watts</th><th>Hours/Day</th><th>Daily kWh</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>`;
  }

  const now = new Date().toLocaleString('en-PH', { dateStyle: 'long', timeStyle: 'short' });

  document.getElementById('results-container').innerHTML = `
    <div class="print-header">
      <div>
        <div class="print-header-logo">SULYAP&#8209;<em>SEE</em>LYAB</div>
        <div style="font-size:0.72rem;color:#6B7280;">Albay Solar Sizing Estimator</div>
      </div>
      <div class="print-header-date">Generated: ${now}</div>
    </div>

    <div class="res-intro">
      <h2>Your System Estimate</h2>
      <p>${loc} &middot; ${panelName} &middot; ${r.system_efficiency_pct}% combined efficiency</p>
    </div>

    <div class="kpi-row">
      <div class="kpi">
        <div class="kpi-label">System Size</div>
        <div class="kpi-val" id="kpi-size">0 kWp</div>
        <div class="kpi-sub">${r.num_panels} × ${r.panel_info.watts}W panels</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Monthly Savings</div>
        <div class="kpi-val" id="kpi-savings">₱0.00</div>
        <div class="kpi-sub">${peso(r.annual_savings)} / year</div>
      </div>
      <div class="kpi">
        <div class="kpi-label">Payback Period</div>
        <div class="kpi-val" id="kpi-payback">0 yrs</div>
        <div class="kpi-sub">Based on mid-range estimate</div>
      </div>
    </div>

    <div class="detail-section">
      <div class="detail-section-head">System Details</div>
      <div class="detail-row"><span>Daily Energy Need</span><strong>${r.daily_kwh} kWh / day</strong></div>
      <div class="detail-row"><span>Peak Sun Hours (PSH)</span><strong>${r.psh} hrs / day</strong></div>
      <div class="detail-row"><span>Combined Efficiency</span><strong>${r.system_efficiency_pct}%</strong></div>
      <div class="detail-row"><span>Required Capacity</span><strong>${r.system_size_kwp} kWp</strong></div>
      <div class="detail-row"><span>Panels Required</span><strong>${r.num_panels} panels (${r.actual_size_kwp} kWp)</strong></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-head">Cost Estimate (Equipment + 25% Installation)</div>
      <div class="detail-row"><span>Panel Type</span><strong>${panelName}, ${r.panel_info.watts}W</strong></div>
      <div class="detail-row"><span>Price per Panel</span><strong>${peso(r.panel_info.price_low)} – ${peso(r.panel_info.price_high)}</strong></div>
      <div class="detail-row"><span>Equipment Cost</span><strong>${peso(r.equipment_cost_low)} – ${peso(r.equipment_cost_high)}</strong></div>
      <div class="detail-row highlight"><span>Total Estimated Cost</span><strong>${peso(r.total_cost_low)} – ${peso(r.total_cost_high)}</strong></div>
    </div>

    <div class="detail-section">
      <div class="detail-section-head">Efficiency Factors Applied</div>
      <div class="detail-row"><span>Location</span><strong>${loc} (₱${r.area?.rate?.toFixed(4)}/kWh)</strong></div>
      <div class="detail-row"><span>Shade</span><strong>${shadeLabel[r.shade]}</strong></div>
      <div class="detail-row"><span>Dust / Cleaning</span><strong>${dustLabel[r.dust]}</strong></div>
      <div class="detail-row"><span>Weather</span><strong>${weatherLabel[r.weather]}</strong></div>
      <div class="detail-row"><span>Wiring Loss</span><strong>Standard (×0.97)</strong></div>
    </div>

    ${breakdownHtml}

    <div class="disclaimer">
      <strong>Note:</strong> These are rough estimates for planning purposes only. Actual performance depends on roof orientation, net metering eligibility, installer assessment, and panel degradation over time. Consult a PEC-accredited solar installer for a formal quotation.
    </div>

    <div class="report-actions">
      <button class="btn-report btn-print" onclick="printReport()">
        &#128438; Print Report
      </button>
      <button class="btn-report btn-download" id="btn-download" onclick="downloadReport()">
        &#8675; Download Report
      </button>
    </div>
  `;

  animateResults();

  setTimeout(() => {
    countUp(document.getElementById('kpi-size'),    r.actual_size_kwp,  1, '',  ' kWp', 900);
    countUp(document.getElementById('kpi-savings'), r.monthly_savings,  2, '₱', '',     1100);
    countUp(document.getElementById('kpi-payback'), r.payback_years,    1, '',  ' yrs', 1000);
  }, 150);
}
