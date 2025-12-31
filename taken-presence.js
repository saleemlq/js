// ==UserScript==
// @name         Daily Class Dashboard – Taken & Presence %
// @namespace    https://learnquraan.local/
// @version      1.0
// @description  Show Taken% and Presence% next to Daily Class DashBoard using dashboard monthly data
// @match        https://my.learnquraan.co.uk/employees/teacher/daily-classes.php
// @grant        GM_xmlhttpRequest
// @connect      my.learnquraan.co.uk
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const DASHBOARD_URL = 'https://my.learnquraan.co.uk/employees/teacher/dashboard.php';

    function fetchDashboardHTML() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: DASHBOARD_URL,
                onload: res => resolve(res.responseText),
                onerror: err => reject(err)
            });
        });
    }

    function extractDateChartData(html) {
        const match = html.match(/dateChartData\s*=\s*(\[[\s\S]*?\]);/);
        if (!match) return null;

        try {
            return JSON.parse(match[1]);
        } catch (e) {
            return null;
        }
    }

    function calculateStats(data) {
        let taken = 0, absent = 0, leave = 0;
        let total = 0;

        data.forEach(d => {
            taken += d.taken || 0;
            absent += d.absent || 0;
            leave += d.leave || 0;

            total +=
                (d.taken || 0) +
                (d.absent || 0) +
                (d.leave || 0) +
                (d.takenD || 0) +
                (d.declined || 0) +
                (d.pending || 0);
        });

        const takenPct = total
            ? ((taken / total) * 100).toFixed(1)
            : '0.0';

        const presencePct = (taken + absent + leave)
            ? ((taken / (taken + absent + leave)) * 100).toFixed(1)
            : '0.0';

        return { taken, absent, leave, total, takenPct, presencePct };
    }

    function injectUI(stats) {
    const title = document.querySelector('.box-title.text-info');
    if (!title || document.getElementById('vm-class-summary')) return;

    const span = document.createElement('span');
    span.id = 'vm-class-summary';
    span.style.marginLeft = '12px';
    span.style.fontSize = '14px';
    span.style.fontWeight = '600';
    span.style.color = '#2c3e50';
    span.style.cursor = 'help';

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


    async function init() {
        try {
            const html = await fetchDashboardHTML();
            const data = extractDateChartData(html);
            if (!data) return;

            const stats = calculateStats(data);
            injectUI(stats);
        } catch (e) {
            console.error('Class summary error:', e);
        }
    }

    init();
})();
