(async function () {
  const session = await fetch('/api/session').then(r => r.json());
  if (!session.authenticated) {
    window.location.href = '/';
    return;
  }
  document.getElementById('username-display').textContent = session.username;

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/';
  });

  let debounceTimer;
  let showAll = false;
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  const showAllSwitch = document.getElementById('show-all-switch');

  searchInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    searchClear.hidden = !searchInput.value;
    debounceTimer = setTimeout(() => refreshList(), 150);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.hidden = true;
    searchInput.focus();
    refreshList();
  });

  showAllSwitch.addEventListener('change', () => {
    showAll = showAllSwitch.checked;
    refreshList();
  });

  document.getElementById('close-detail').addEventListener('click', () => {
    document.getElementById('patient-detail').hidden = true;
    document.getElementById('empty-state').hidden = false;
    document.querySelectorAll('.patient-card').forEach(c => c.classList.remove('selected'));
  });

  function refreshList() {
    const query = searchInput.value.trim();
    if (!query && !showAll) {
      document.getElementById('patient-list').innerHTML =
        '<div class="search-prompt">Type to search for patients</div>';
      return;
    }
    loadPatients(query);
  }

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });

  async function loadPatients(query) {
    const url = query ? `/api/patients?q=${encodeURIComponent(query)}` : '/api/patients';
    const patients = await fetch(url).then(r => r.json());
    renderPatientList(patients, query);
  }

  function renderPatientList(patients, query) {
    const container = document.getElementById('patient-list');
    if (patients.length === 0) {
      container.innerHTML = query
        ? '<div class="no-results">No patients match your search</div>'
        : '<div class="no-results">No patients found</div>';
      return;
    }
    container.innerHTML = patients.map(p => `
      <div class="patient-card" data-id="${p.patient_id}">
        <div class="patient-card-name">${esc(p.last_name)}, ${esc(p.first_name)}</div>
        <div class="patient-card-meta">
          <span class="mrn">MRN: ${esc(p.mrn)}</span>
          <span class="dob">${formatDate(p.date_of_birth)}</span>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.patient-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.patient-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        loadPatientDetail(card.dataset.id);
      });
    });
  }

  async function fetchJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
    return r.json();
  }

  async function loadPatientDetail(id) {
    try {
      const [patient, encounters, conditions] = await Promise.all([
        fetchJson(`/api/patients/${id}`),
        fetchJson(`/api/patients/${id}/encounters`),
        fetchJson(`/api/patients/${id}/conditions`),
      ]);

      document.getElementById('empty-state').hidden = true;
      const detail = document.getElementById('patient-detail');
      detail.hidden = false;

      document.getElementById('detail-name').textContent =
        `${patient.last_name}, ${patient.first_name}`;
      document.getElementById('detail-mrn').textContent = `MRN: ${patient.mrn}`;
      document.getElementById('detail-meta').innerHTML = `
        <span>${patient.gender || 'Unknown'}</span>
        <span>DOB: ${formatDate(patient.date_of_birth)}</span>
        <span>Age: ${calcAge(patient.date_of_birth)}</span>
      `;

      renderDemographics(patient);
      renderEncounters(encounters);
      renderConditions(conditions);
    } catch (err) {
      console.error('Failed to load patient detail:', err);
      document.getElementById('empty-state').hidden = true;
      const detail = document.getElementById('patient-detail');
      detail.hidden = false;
      detail.innerHTML = `<div class="error-banner">Failed to load patient data. Check the server console for details.</div>`;
    }
  }

  function renderDemographics(p) {
    const fields = [
      ['First Name', p.first_name],
      ['Last Name', p.last_name],
      ['Date of Birth', formatDate(p.date_of_birth)],
      ['Gender', p.gender || 'Unknown'],
      ['Phone', p.phone || '&mdash;'],
      ['Email', p.email || '&mdash;'],
      ['Address', p.address_line1 || '&mdash;'],
      ['City', p.city || '&mdash;'],
      ['State', p.state || '&mdash;'],
      ['Postal Code', p.postal_code || '&mdash;'],
    ];
    document.getElementById('demographics-grid').innerHTML = fields.map(([label, val]) => `
      <div class="demo-field">
        <div class="demo-label">${label}</div>
        <div class="demo-value">${esc(String(val))}</div>
      </div>
    `).join('');
  }

  function renderEncounters(encounters) {
    const container = document.getElementById('encounters-content');
    if (encounters.length === 0) {
      container.innerHTML = '<div class="no-results">No encounters recorded</div>';
      return;
    }
    container.innerHTML = encounters.map(e => `
      <div class="encounter-card">
        <div class="encounter-header">
          <span class="badge badge-${e.encounter_type.toLowerCase()}">${esc(e.encounter_type)}</span>
          <span class="encounter-date">${formatDateTime(e.visit_start_datetime)}</span>
          ${e.visit_end_datetime ? `<span class="encounter-end">to ${formatDateTime(e.visit_end_datetime)}</span>` : ''}
        </div>
        <div class="encounter-body">
          <div class="encounter-row"><strong>Physician:</strong> ${esc(e.attending_physician)}</div>
          <div class="encounter-row"><strong>Reason:</strong> ${esc(e.reason_for_visit)}</div>
          ${e.notes ? `<div class="encounter-row"><strong>Notes:</strong> ${esc(e.notes)}</div>` : ''}
        </div>
        ${e.heart_rate != null ? renderVitals(e) : ''}
      </div>
    `).join('');
  }

  function renderVitals(v) {
    const items = [
      ['BP', v.systolic_bp != null ? `${v.systolic_bp}/${v.diastolic_bp} mmHg` : null],
      ['HR', v.heart_rate != null ? `${v.heart_rate} bpm` : null],
      ['RR', v.respiratory_rate != null ? `${v.respiratory_rate} /min` : null],
      ['Temp', v.temperature_c != null ? `${v.temperature_c} &deg;C` : null],
      ['SpO2', v.oxygen_saturation != null ? `${v.oxygen_saturation}%` : null],
      ['Weight', v.weight_kg != null ? `${v.weight_kg} kg` : null],
      ['Height', v.height_cm != null ? `${v.height_cm} cm` : null],
    ].filter(([, val]) => val !== null);

    if (items.length === 0) return '';
    return `
      <div class="vitals-strip">
        <div class="vitals-title">Vitals</div>
        <div class="vitals-row">
          ${items.map(([label, val]) => `
            <div class="vital-item">
              <span class="vital-label">${label}</span>
              <span class="vital-value">${val}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderConditions(conditions) {
    const container = document.getElementById('conditions-content');
    if (conditions.length === 0) {
      container.innerHTML = '<div class="no-results">No medical history recorded</div>';
      return;
    }
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Condition</th>
            <th>ICD-10</th>
            <th>Status</th>
            <th>Diagnosed</th>
            <th>Resolved</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${conditions.map(c => `
            <tr>
              <td>${esc(c.condition_name)}</td>
              <td><code>${esc(c.icd10_code || '—')}</code></td>
              <td><span class="badge badge-status-${c.status.toLowerCase().replace(/\s+/g, '-')}">${esc(c.status)}</span></td>
              <td>${c.diagnosed_date ? formatDate(c.diagnosed_date) : '—'}</td>
              <td>${c.resolved_date ? formatDate(c.resolved_date) : '—'}</td>
              <td>${esc(c.notes || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  }

  function calcAge(dob) {
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function esc(str) {
    const el = document.createElement('span');
    el.textContent = str;
    return el.innerHTML;
  }

  refreshList();
})();
