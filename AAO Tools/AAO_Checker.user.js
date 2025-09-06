// ==UserScript==
// @name         [LSS] AAO-Check Übersicht (Popup + Vehicle-Mapping + Tooltipps)
// @namespace    https://leitstellenspiel.de/
// @version      0.18
// @description  Popup mit AAO-Check, Filter nach mission_categories + Status. Export möglich. Vehicle-Mapping erweiterbar & im LocalStorage gespeichert. Tooltipps für unbekannte Fahrzeuge. Tabelle sofort aktualisierbar.
// @author       NinoRossi
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_xmlhttpRequest
// @connect      leitstellenspiel.de
// @run-at       document-end
// ==/UserScript==

(function() {
  'use strict';

  const BASE = 'https://www.leitstellenspiel.de';
  const vehicleMap = { 'LF 20': 'LF20', 'DLK 23/12': 'DLK23/12' };
  const unknownVehicles = new Set();
  let allRows = [];

  // VehicleMap aus Local Storage laden
  const storedMapping = localStorage.getItem('lss_vehicleMap');
  if (storedMapping) {
      try { Object.assign(vehicleMap, JSON.parse(storedMapping)); }
      catch(e){ console.error("Fehler beim Laden des Vehicle-Mappings aus LocalStorage", e); }
  }

  // Menüeintrag unter „Alarm und Ausrückeordnung“
  function addMenuEntry() {
    const aaosEntry = document.querySelector('a[href="/aaos"]');
    if (aaosEntry && !document.querySelector('#aaoCheckLink')) {
      const li = document.createElement('li');
      li.role = 'presentation';
      const a = document.createElement('a');
      a.href = '#';
      a.id = 'aaoCheckLink';
      a.innerHTML = '🚒 AAO-Check';
      a.addEventListener('click', e => { e.preventDefault(); openPopup(); });
      li.appendChild(a);
      aaosEntry.parentElement.insertAdjacentElement('afterend', li);
    }
  }
  addMenuEntry();

  // Popup öffnen
  function openPopup() {
    const overlay = document.createElement('div');
    overlay.id = 'aaoCheckOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.zIndex = '10000';

    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'white';
    popup.style.color = 'black';
    popup.style.padding = '20px';
    popup.style.borderRadius = '8px';
    popup.style.maxHeight = '80%';
    popup.style.overflow = 'auto';
    popup.style.width = '90%';
    popup.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';

    // Schließen-Button
    const closeBtn = document.createElement('span');
    closeBtn.textContent = '×';
    closeBtn.style.position = 'absolute';
    closeBtn.style.top = '10px';
    closeBtn.style.right = '20px';
    closeBtn.style.fontSize = '24px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.addEventListener('click', () => overlay.remove());

    const container = document.createElement('div');
    container.innerHTML = `
      <h1 style="margin-top:0">AAO-Check Übersicht</h1>
      <p>Vergleicht <code>einsaetze.json</code> mit deinen AAOs. Grün = passt, Gelb = AAO fordert mehr, Rot = zu wenig/fehlt. Unbekannte Fahrzeuge werden mit ⚠️ markiert.</p>
      <label for="missionFilter">Filter nach Einsatzart:</label>
      <select id="missionFilter" style="margin-bottom:10px;"></select>
      <label for="statusFilter">Filter nach Status:</label>
      <select id="statusFilter" style="margin-bottom:10px; margin-left:10px;"></select>
      <br>
      <button id="exportJson">Export als JSON</button>
      <button id="exportUnknown">Unbekannte Fahrzeuge exportieren</button>
      <button id="addVehicleMapping">Vehicle-Mapping erweitern</button>
      <div id="tableWrap" style="margin-top:20px;"></div>
    `;

    popup.appendChild(closeBtn);
    popup.appendChild(container);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // CSS für Zebra, Hover, Tooltipps
    const style = document.createElement('style');
    style.textContent = `
      #tableWrap table tbody tr:nth-child(odd) { background-color: #f9f9f9; }
      #tableWrap table tbody tr:nth-child(even) { background-color: #ffffff; }
      #tableWrap table tbody tr:hover { background-color: #d0ebff !important; cursor: pointer; }
      #tableWrap span[title] {
        position: relative;
        cursor: help;
      }
      #tableWrap span[title]:hover::after {
        content: attr(title);
        position: absolute;
        left: 0;
        top: 100%;
        white-space: nowrap;
        background: #333;
        color: #fff;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 12px;
        z-index: 10001;
      }
    `;
    popup.appendChild(style);

    // Daten laden
    Promise.all([
      fetchJson(`${BASE}/einsaetze.json`),
      fetchJson(`${BASE}/api/v1/aaos`)
    ]).then(([missions, aaos]) => {
      const aaoMap = Object.fromEntries(aaos.map(a => [a.caption, a]));
      allRows = [];

      for (const [id, mission] of Object.entries(missions)) {
        const name = mission.name;
        const reqRaw = mission.requirements || {};
        const req = remapVehicles(reqRaw);
        const aao = aaoMap[name];
        let status = '❌ Keine AAO';
        let color = '#f8d7da';
        if (aao) {
          const cmp = compareVehicles(req, aao.vehicle_classes || {});
          status = cmp.status;
          color = cmp.color;
        }

        const types = (mission.mission_categories && mission.mission_categories.length > 0)
                      ? mission.mission_categories
                      : ['Unbekannt'];

        allRows.push({ name, req, reqRaw, aao, status, color, reward: mission.average_credits || 0, types });
      }

      // Filter Optionen erstellen
      renderFilterOptions();
      renderStatusOptions();
      renderFilteredTable('Alle', 'Alle');

      document.getElementById('missionFilter').addEventListener('change', () =>
        renderFilteredTable(
          document.getElementById('missionFilter').value,
          document.getElementById('statusFilter').value
        )
      );
      document.getElementById('statusFilter').addEventListener('change', () =>
        renderFilteredTable(
          document.getElementById('missionFilter').value,
          document.getElementById('statusFilter').value
        )
      );

      document.getElementById('exportJson').addEventListener('click', exportJson);
      document.getElementById('exportUnknown').addEventListener('click', exportUnknown);

      // Vehicle-Mapping Button
      document.getElementById('addVehicleMapping').addEventListener('click', () => {
          const input = prompt('Neues Vehicle-Mapping eingeben im Format "Name_in_einsaetze.json=Name_in_AAO":');
          if (!input) return;
          const parts = input.split('=');
          if (parts.length !== 2) {
              alert('Ungültiges Format! Bitte genau so: LF 20=LF20');
              return;
          }
          const [key, value] = parts.map(s => s.trim());
          vehicleMap[key] = value;
          localStorage.setItem('lss_vehicleMap', JSON.stringify(vehicleMap));
          if (unknownVehicles.has(key)) unknownVehicles.delete(key);

          alert(`Mapping hinzugefügt: "${key}" → "${value}"`);

          // Tabelle sofort aktualisieren
          allRows.forEach(row => {
              row.req = remapVehicles(row.reqRaw);
              if (row.aao) {
                  const cmp = compareVehicles(row.req, row.aao.vehicle_classes || {});
                  row.status = cmp.status;
                  row.color = cmp.color;
              }
          });

          renderFilterOptions();
          renderStatusOptions();
          renderFilteredTable(
            document.getElementById('missionFilter').value,
            document.getElementById('statusFilter').value
          );
      });
    });
  }

  function exportJson() {
    const filtered = filterRows(document.getElementById('missionFilter').value, document.getElementById('statusFilter').value);
    const blob = new Blob([JSON.stringify(filtered, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aaocheck.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportUnknown() {
    const blob = new Blob([JSON.stringify(Array.from(unknownVehicles), null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'unbekannte_fahrzeuge.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function fetchJson(url) { const r = await fetch(url); return await r.json(); }
  // Filter Optionen
  function renderFilterOptions() {
    const select = document.getElementById('missionFilter');
    const allTypes = new Set();
    allRows.forEach(r => r.types.forEach(t => allTypes.add(t)));
    const types = ['Alle', ...allTypes];
    select.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join('');
  }

  function renderStatusOptions() {
    const select = document.getElementById('statusFilter');
    const statuses = new Set(allRows.map(r => r.status));
    const options = ['Alle', ...statuses];
    select.innerHTML = options.map(s => `<option value="${s}">${s}</option>`).join('');
  }

  function filterRows(type, status='Alle') {
    return allRows.filter(r =>
        (type === 'Alle' || r.types.includes(type)) &&
        (status === 'Alle' || r.status === status)
    );
  }

  function renderFilteredTable(type='Alle', status='Alle') {
    renderTable(filterRows(type, status));
  }

  function renderTable(rows) {
    const wrap = document.getElementById('tableWrap');
    const table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.width = '100%';
    table.innerHTML = `<thead><tr>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">Einsatz</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">Anforderung</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">AAO</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">Status</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">Verdienst</th>
      <th style="border:1px solid #ccc;padding:6px;background:#f2f2f2">Einsatzarten</th>
    </tr></thead>`;
    const tbody = document.createElement('tbody');

    for (const r of rows) {
      const tr = document.createElement('tr');
      let baseColor = (r.color === '#f8d7da' ? 'rgba(248,215,218,0.7)' :
                       r.color === '#fff3cd' ? 'rgba(255,243,205,0.7)' :
                       r.color === '#d4edda' ? 'rgba(212,237,218,0.7)' : 'rgba(255,255,255,0.7)');
      tr.style.backgroundColor = baseColor;

      const td1 = document.createElement('td'); td1.style.padding='6px'; td1.style.border='1px solid #ccc'; td1.textContent = r.name;
      const td2 = document.createElement('td'); td2.style.padding='6px'; td2.style.border='1px solid #ccc'; td2.innerHTML = stringifyReq(r.req);
      const td3 = document.createElement('td'); td3.style.padding='6px'; td3.style.border='1px solid #ccc'; td3.innerHTML = r.aao ? stringifyReq(r.aao.vehicle_classes) : '-';
      const td4 = document.createElement('td'); td4.style.padding='6px'; td4.style.border='1px solid #ccc'; td4.textContent = r.status;
      const td5 = document.createElement('td'); td5.style.padding='6px'; td5.style.border='1px solid #ccc'; td5.textContent = r.reward;
      const td6 = document.createElement('td'); td6.style.padding='6px'; td6.style.border='1px solid #ccc'; td6.textContent = r.types.join(', ');

      tr.append(td1, td2, td3, td4, td5, td6);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    wrap.innerHTML = '';
    wrap.appendChild(table);
  }

  function remapVehicles(req) {
    const mapped = {};
    for (const [veh, count] of Object.entries(req)) {
      const key = vehicleMap[veh] || veh;
      if (!vehicleMap[veh]) unknownVehicles.add(veh);
      mapped[key] = (mapped[key] || 0) + count;
    }
    return mapped;
  }

  function stringifyReq(req) {
    if (!req) return '-';
    return Object.entries(req).map(([k,v]) => {
        if (unknownVehicles.has(k)) {
            return `<span title="${k} ⚠️">${v} ${k} ⚠️</span>`;
        } else {
            return `${v} ${k}`;
        }
    }).join(', ');
  }

  function compareVehicles(req, aaoReq) {
    let ok = true, more = false;
    for (const [veh, count] of Object.entries(req)) {
      const have = aaoReq[veh] || 0;
      if (have < count) ok = false;
      if (have > count) more = true;
    }
    if (!ok) return {status:'❌ Zu wenig', color:'#f8d7da'};
    if (more) return {status:'⚠️ Mehr als nötig', color:'#fff3cd'};
    return {status:'✅ Passt', color:'#d4edda'};
  }

})();
