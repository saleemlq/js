// ==UserScript==
// @name         Daily Class Dashboard – Taken & Presence %
// @namespace    https://learnquraan.local/
// @version      2.0
// @description  Calculates Taken% and Presence% using live schedule (no manual page open)
// @match        https://my.learnquraan.co.uk/employees/teacher/daily-classes.php
// @grant        GM_xmlhttpRequest
// @connect      my.learnquraan.co.uk
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const DASHBOARD_URL = 'https://my.learnquraan.co.uk/employees/teacher/dashboard.php';
  const SCHEDULE_URL  = 'https://my.learnquraan.co.uk/employees/teacher/teacher-schd';

  /* ---------------- FETCH ---------------- */

  function fetchHTML(url) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url,
        onload: res => resolve(res.responseText),
        onerror: err => reject(err)
      });
    });
  }

  /* ---------------- DASHBOARD DATA ---------------- */

  function extractDateChartData(html) {
    const match = html.match(/dateChartData\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) return null;

    try {
      return Function(`"use strict"; return ${match[1]}`)();
    } catch {
      return null;
    }
  }

  /* ---------------- SCHEDULE TOTAL ---------------- */

  function calculateMonthlyTotal(scheduleHTML) {
    const doc = new DOMParser().parseFromString(scheduleHTML, 'text/html');
    const table = doc.querySelector('table.table');
    if (!table) return null;

    const weekly = [0,0,0,0,0,0,0];
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(r => {
      const tds = r.querySelectorAll('td');
      if (tds.length !== 8) return;

      for (let i = 1; i <= 7; i++) {
        const cell = tds[i];
        const text = cell.textContent.trim();
        const bg = cell.style.backgroundColor;

        if (text && bg !== 'rgb(254, 249, 231)') {
          weekly[i - 1]++;
        }
      }
    });

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const days = new Date(year, month + 1, 0).getDate();

    const weekdayCount = [0,0,0,0,0,0,0];
    for (let d = 1; d <= days; d++) {
      const js = new Date(year, month, d).getDay();
      const idx = js === 0 ? 6 : js - 1;
      weekdayCount[idx]++;
    }

    let total = 0;
    for (let i = 0; i < 7; i++) {
      total += weekly[i] * weekdayCount[i];
    }

    return total;
  }

  /* ---------------- CALCULATIONS ---------------- */

  function calculateStats(attendance, total) {
    let taken = 0, absent = 0, leave = 0;

    attendance.forEach(d => {
      taken  += d.taken  || 0;
      absent += d.absent || 0;
      leave  += d.leave  || 0;
    });

    const takenPct = total
      ? ((taken / total) * 100).toFixed(1)
      : '0.0';

    const presenceBase = taken + absent + leave;
    const presencePct = presenceBase
      ? ((taken / presenceBase) * 100).toFixed(1)
      : '0.0';

    return { taken, absent, leave, total, takenPct, presencePct };
  }

  /* ---------------- UI ---------------- */

  function injectUI(stats) {
    const title = document.querySelector('.box-title.text-info');
    if (!title || document.getElementById('vm-class-summary')) return;

    const span = document.createElement('span');
    span.id = 'vm-class-summary';
    span.style.marginLeft = '12px';
    span.style.fontSize = '14px';
    span.style.fontWeight = '600';

    span.innerHTML = `
      | <span style="color:#1e88e5;">Taken ${stats.takenPct}%</span>
      | <span style="color:#2e7d32;">Presence ${stats.presencePct}%</span>
    `;

    // Friendly hover tooltip
    span.title = `
Taken: This month, you ${stats.taken === stats.total ?
  `have taken all ${stats.total} available classes.` :
  `can take up to ${stats.total} classes. So far, you have taken ${stats.taken} classes.`}

Presence: You ${stats.taken + stats.leave + stats.absent === stats.taken ?
  `have attended all possible classes so far (${stats.taken}).` :
  `could have attended ${stats.taken + stats.leave + stats.absent} classes so far, but you have attended ${stats.taken} classes.`}
`;

    title.appendChild(span);
  }

  /* ---------------- INIT ---------------- */

  async function init() {
    try {
      const [dashboardHTML, scheduleHTML] = await Promise.all([
        fetchHTML(DASHBOARD_URL),
        fetchHTML(SCHEDULE_URL)
      ]);

      const attendance = extractDateChartData(dashboardHTML);
      if (!attendance) return;

      const total = calculateMonthlyTotal(scheduleHTML);
      if (!total) return;

      const stats = calculateStats(attendance, total);
      injectUI(stats);

    } catch (e) {
      console.error('Daily dashboard calculation failed:', e);
    }
  }

  init();
})();
