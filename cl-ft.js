// ==UserScript==
// @name         cl-ft
// @namespace    violentmonkey
// @version      2.8
// @match        https://my.learnquraan.co.uk/employees/teacher/lesson-step1*
// @match        https://my.learnquraan.co.uk/employees/teacher/lesson-step2*
// @grant        GM.addStyle
// @run-at       document-idle
// ==/UserScript==

(() => {
    "use strict";
    (document.head || document.documentElement).insertAdjacentHTML("beforeend", '<link href="https://fonts.googleapis.com/css2?family=Play:wght@400;600;800&display=swap" rel="stylesheet"><link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">');
    const L = k => {
            try {
                return JSON.parse(localStorage.getItem(k) || "[]")
            } catch {
                return []
            }
        },
        S = (k, v) => localStorage.setItem(k, JSON.stringify(v));
    const hid = new URLSearchParams(location.search).get("history_id") || document.querySelector('input[name="history1"]')?.value || "";
    let h = document.querySelector(".box-title")?.textContent.trim() || "",
        name = "";
    if (h) {
    if (location.href.includes("lesson-step1")) {
        name = h.match(/^(.+?)'s\s+Lesson Details$/)?.[1] || "";
    } else if (location.href.includes("lesson-step2")) {
        name = h.match(/^(.+?)'s\s+Additional Lesson Details$/)?.[1] || "";
    }
}
    let students = L("listOfStudents"),
        i = students.findIndex(x => x[hid]);
    let pref = i > -1 ? students[i][hid] : {
        name,
        panelOpen: false,
        feature: "performance"
    };
    if (typeof pref === "string") pref = {
        name: pref,
        panelOpen: false,
        feature: "performance"
    };
    i > -1 ? students[i][hid] = pref : students.push({
        [hid]: pref
    });
    S("listOfStudents", students);
    let feats = {};
    try {
        feats = JSON.parse(localStorage.getItem("lq_features") || "{}")
    } catch {
        feats = {}
    };
    feats[hid] = feats[hid] || {
        tasks: [],
        history: []
    };
    const R = () => {
        let d = new Date(),
            m = d.getMinutes() < 30 ? "00" : "30";
        return d.getFullYear() + ("" + (d.getMonth() + 1)).padStart(2, 0) + ("" + d.getDate()).padStart(2, 0) + ("" + d.getHours()).padStart(2, 0) + m
    };
    let cur;
    try {
        cur = JSON.parse(localStorage.getItem("currentClass"))
    } catch {}
    if (!cur || cur.history_id !== hid || cur.time !== R()) {
        cur = {
            history_id: hid,
            time: R(),
            complements: {
                p: Array(9).fill(0),
                n: Array(9).fill(0)
            }
        };
        localStorage.setItem("currentClass", JSON.stringify(cur));
    }
    const P = {
            1: "Nice",
            2: "Good",
            3: "Cool",
            4: "Great",
            5: "Awesome",
            6: "Amazing",
            7: "Wow",
            8: "Marvelous",
            9: "Spectacular"
        },
        N = {
            1: "Oh",
            2: "Oops",
            3: "Uh-oh",
            4: "Hmm",
            5: "Ehh",
            6: "Oopsie",
            7: "Whoops",
            8: "Aaugh",
            9: "Yikes"
        },
        PC = {
            1: "#0f766e",
            2: "#166534",
            3: "#1e40af",
            4: "#b45309",
            5: "#b91c1c",
            6: "#be185d",
            7: "#7c3aed",
            8: "#6d28d9",
            9: "#b7791f"
        },
        NC = {
            1: "#4b5563",
            2: "#6b7280",
            3: "#2563eb",
            4: "#1e40af",
            5: "#6d28d9",
            6: "#9d174d",
            7: "#c026d3",
            8: "#ef4444",
            9: "#7f1d1d"
        };
    let c = {
            p: {},
            n: {}
        },
        score = 50;
    for (let j = 1; j <= 9; j++) {
        c.p[j] = cur.complements.p[j - 1];
        c.n[j] = cur.complements.n[j - 1];
        score += c.p[j] * j - c.n[j] * j
    }
    const site = document.createElement("div");
    site.id = "site";
    document.body.appendChild(site);
    const panel = document.createElement("div");
    panel.id = "panel";
    panel.innerHTML = `<div id=header><div id=name><i class="fa-regular fa-user"></i>${name}</div><div id=timer><i class="fa-regular fa-clock"></i><span>00:00</span></div></div><div id=switcher><button data-f="performance" title="Performance"><i class="fa-solid fa-chart-simple"></i></button><button data-f="results" title="Results"><i class="fa-solid fa-chart-column"></i></button><button data-f="tasks" title="Tasks"><i class="fa-solid fa-list-check"></i></button></div><div id=featureArea><div id=perfContainer><div id=box><div class=l>STUDENT AURA</div><div id=score>${score}</div></div><div id=lists><div><h3>🌟 Positive</h3><div id=pos></div></div><div><h3>⚠️ Needs Work</h3><div id=neg></div></div></div></div><div id=featContent style="display:none"></div></div><div id=close>✕</div>`;
    document.body.appendChild(panel);
    const mini = document.createElement("div");
    mini.id = "mini";
    mini.innerHTML = '<i class="fa-solid fa-chart-simple"></i>';
    document.body.appendChild(mini);
    const toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
    GM.addStyle(`:root{--site-width:100%;--pswp-width:100vw}html,body{margin:0;font-family:Play}
body{
  transition:margin-right .35s ease;
}
body.lq-panel-open{
  margin-right:20vw;
}
#panel{position:fixed;right:0;top:0;width:20vw;height:100vh;background:#020617;color:#e5e7eb;padding:14px;display:flex;flex-direction:column;transition:transform .28s ease;z-index:9999}#panel.closed{transform:translateX(100%)}#close{position:absolute;top:8px;right:8px;cursor:pointer;opacity:.4}#header{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}#name,#timer{font-size:14px;color:#93c5fd}#timer i{margin-right:6px}#switcher{display:flex;gap:6px;margin-bottom:8px}#switcher button{flex:1;background:transparent;border:1px solid #0b1220;color:#93c5fd;padding:6px;border-radius:8px;cursor:pointer;opacity:.6}#switcher button.active{background:rgba(250,204,21,0.06);color:#facc15;opacity:1;border-color:rgba(250,204,21,0.16)}#featureArea{flex:1;overflow:auto}#perfContainer{display:flex;flex-direction:column;height:100%;justify-content:space-between}.l{font-size:11px;opacity:.6;letter-spacing:.1em}#box{flex:1;text-align:center;margin-top:0;display:flex;flex-direction:column;justify-content:center}#score{position: relative; font-size: 90px; font-weight: 800; color: #facc15;}#lists{margin-top:auto;display:flex;width:100%;gap:8px}#lists>div{width:50%;flex:0 0 47%}#pos,#neg{width:100%}h3{text-align:center;font-size:12px;opacity:.7}.item{margin:4px 0;padding:6px;border-radius:8px;font-size:12px;font-weight:700;text-align:center;cursor:pointer}
#toast{position:absolute;top:40px;left:50%;transform:translateX(-50%);display:flex;justify-content:center;pointer-events:none;z-index:10000}
#toast::before{content:attr(data-text);padding:18px 50px;border-radius:28px;font-size:30px;font-weight:800;color:#fff;background:var(--bg);opacity:0;transform:translateY(-20px);transition:.4s}#toast.show::before{opacity:1;transform:none}#mini{position:fixed;top:10px;right:10px;width:34px;height:34px;border-radius:50%;background:#020617;color:#93c5fd;display:none;align-items:center;justify-content:center;cursor:pointer;z-index:9999;box-shadow:0 0 12px rgba(0,0,0,.6)}#featContent{height: 90%; margin-top:6px; display: flex; flex-direction: column;}.lq-task{background:#071025;border:1px solid #122032;border-radius:10px;padding:10px;display:flex;align-items:center;gap:10px;margin-bottom:6px}.lq-task span{flex:1;transition:color .35s linear}.lq-task input{flex:1;background:transparent;border:none;outline:none;color:#facc15}.lq-task i{cursor:pointer;opacity:.6}.lq-bars{flex:1;display:flex;align-items:flex-end;gap:4px;justify-content:center;overflow-x:auto;height:200px;position:relative;width:100%}.lq-bars .bar{width:12px;border-radius:3px;background:linear-gradient(180deg,#facc15,#f59e0b);display:inline-block;position:relative}.lq-bars .bar span{position:absolute;top:-18px;left:50%;transform:translateX(-50%) rotate(90deg);font-size:10px;color:#facc15;font-weight:700}.lq-labels{display:flex;gap:4px;margin-top:4px;justify-content:center;align-items:flex-start}.lq-labels div{writing-mode:vertical-rl; text-align:center;font-size:10px;color:#9ca3af;width:12px}.lq-stats{display:flex;flex-direction:column;gap:6px;margin-bottom:6px}.lq-meta{display:flex;justify-content:space-between;font-size:12px;color:#93c5fd;opacity:.9}.pswp{position:fixed!important;left:0!important;top:0!important;width:var(--pswp-width)!important;height:100vh!important;z-index:9998!important;transition:width .35s ease}.pswp__bg{width:var(--pswp-width)!important;background:rgba(2,6,23,0.92)!important}.pswp__scroll-wrap,.pswp__container,.pswp__item{width:var(--pswp-width)!important;transition:width .35s ease}.pswp__ui{right:auto!important}.pswp__button--fs{display:none!important}`);

  const applyPanelState = open => {
  document.body.classList.toggle("lq-panel-open", open);
  document.documentElement.style.setProperty('--pswp-width', open ? '80vw' : '100vw');
  // requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
};
    const updatePSWPWidth = () => {
    const open = !panel.classList.contains("closed");
    document.documentElement.style.setProperty(
        '--pswp-width',
        open ? '80vw' : '100vw'
    );
    requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
};
    const open = () => {
    if (!panel.classList.contains("closed")) return; // safety
    panel.classList.remove("closed");
    mini.style.display = "none";
    pref.panelOpen = true;
    S("listOfStudents", students);
    applyPanelState(true);
};

const close = () => {
    if (panel.classList.contains("closed")) return; // safety
    panel.classList.add("closed");
    mini.style.display = "flex";
    pref.panelOpen = false;
    S("listOfStudents", students);
    applyPanelState(false);
};
    panel.querySelector("#close").onclick = close;
    mini.onclick = open;

    const show = (t, c, chg) => {
        toast.dataset.text = `${t} ${chg>0?"+":"-"}${Math.abs(chg)}`;
        toast.style.setProperty("--bg", `linear-gradient(135deg,${c},#000a)`);
        toast.classList.add("show");
        setTimeout(() => toast.classList.remove("show"), 1600);
        let f = document.createElement("div");
        f.textContent = (chg > 0 ? "+" : "-") + Math.abs(chg);
        Object.assign(f.style, {
            position: "absolute",
            left: "50%",
            top: "-20px",
            transform: "translateX(-50%)",
            fontSize: "36px",
            fontWeight: "800",
            color: c,
            opacity: "1",
            transition: "all 1s ease-out"
        });
        scoreEl.appendChild(f);
        requestAnimationFrame(() => {
            f.style.top = "-60px";
            f.style.opacity = "0"
        });
        setTimeout(() => scoreEl.removeChild(f), 1000)
    };
    const scoreEl = panel.querySelector("#score"),
        pos = panel.querySelector("#pos"),
        neg = panel.querySelector("#neg");
    const upd = () => {
        scoreEl.textContent = score;
        pos.innerHTML = neg.innerHTML = "";
        for (let j = 9; j > 0; j--) {
            let d = document.createElement("div");
            d.className = "item";
            d.style.background = PC[j];
            d.textContent = P[j] + " : " + c.p[j];
            d.onclick = () => act(j, 0);
            pos.appendChild(d)
        }
        for (let j = 1; j <= 9; j++) {
            let d = document.createElement("div");
            d.className = "item";
            d.style.background = NC[j];
            d.textContent = N[j] + " : " + c.n[j];
            d.onclick = () => act(j, 1);
            neg.appendChild(d)
        }
    };
    const pushOrUpdateHistory = () => {
        feats[hid] = feats[hid] || {
            tasks: [],
            history: []
        };
        const hlist = feats[hid].history;
        const last = hlist.slice(-1)[0];
        if (!last || last.time !== cur.time) hlist.push({
            time: cur.time,
            score
        });
        else last.score = score;

        // Keep only last 10 entries
        feats[hid].history = hlist.slice(-10);

        S("lq_features", feats);
    };

    const animateScoreChange = (change, color) => {
        const f = document.createElement("div");
        f.textContent = (change > 0 ? "+" : "-") + Math.abs(change);
        Object.assign(f.style, {
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%,-50%) scale(1.2)",
            fontSize: "48px",
            fontWeight: "900",
            color: color,
            opacity: "1",
            pointerEvents: "none",
            zIndex: 9999,
            transition: "all 0.9s ease-out"
        });
        scoreEl.appendChild(f);
        requestAnimationFrame(() => {
            f.style.transform = "translate(-50%,-180%) scale(1)";
            f.style.opacity = "0"
        });
        setTimeout(() => scoreEl.removeChild(f), 900)
    };
    const act = (l, n) => {
        const change = n ? -l : l;
        if (n) {
            c.n[l]++;
            cur.complements.n[l - 1]++;
            show(N[l], NC[l], change)
        } else {
            c.p[l]++;
            cur.complements.p[l - 1]++;
            show(P[l], PC[l], change)
        }
        score += change;
        animateScoreChange(change, n ? NC[l] : PC[l]);
        localStorage.setItem("currentClass", JSON.stringify(cur));
        pushOrUpdateHistory();
        upd()
    };
    let timerStopped = false;
    const tick = () => {
        if (timerStopped) return;
        let n = new Date(),
            t = new Date(n);
        n.getMinutes() < 30 ? t.setMinutes(30, 0, 0) : t.setHours(n.getHours() + 1, 0, 0);
        let d = t - n;
        const span = panel.querySelector("#timer span");
        if (d <= 0) {
            span.textContent = "CLASS ENDED";
            timerStopped = true
        } else span.textContent = String(d / 6e4 | 0).padStart(2, 0) + ":" + String(d % 6e4 / 1e3 | 0).padStart(2, 0)
    };
    setInterval(tick, 1000);
    tick();
    document.addEventListener("keydown", e => {
        /INPUT|TEXTAREA/.test(e.target.tagName) || !/^[1-9]$/.test(e.key) || act(+e.key, e.altKey)
    });
    upd();
    const setActiveButton = f => {
        panel.querySelectorAll("#switcher button").forEach(b => b.classList.toggle("active", b.dataset.f === f));
        pref.feature = f;
        S("listOfStudents", students)
    };
    const taskColors = ["#facc15", "#fbbf24", "#fb923c", "#f97316", "#ea580c"];
    const renderTasks = () => {
        const cont = panel.querySelector("#featContent");
        cont.innerHTML = "";
        (feats[hid].tasks || []).forEach((t, idx) => {
            const r = document.createElement("div");
            r.className = "lq-task";
            const ok = document.createElement("i");
            ok.className = "fa-solid fa-check";
            const txt = document.createElement("span");
            txt.textContent = t.text;
            txt.style.color = taskColors[(t.bad || 1) - 1];
            const no = document.createElement("i");
            no.className = "fa-solid fa-xmark";
            ok.onclick = () => {
                r.style.opacity = 0;
                setTimeout(() => {
                    feats[hid].tasks.splice(idx, 1);
                    S("lq_features", feats);
                    renderTasks()
                }, 300)
            };
            no.onclick = () => {
                t.bad = Math.min(5, (t.bad || 1) + 1);
                S("lq_features", feats);
                renderTasks()
            };
            r.append(ok, txt, no);
            cont.appendChild(r)
        });
        const inr = document.createElement("div");
        inr.className = "lq-task";
        const inp = document.createElement("input");
        inp.placeholder = "Add task and press Enter";
        inp.onkeydown = e => {
            if (e.key === "Enter" && inp.value.trim()) {
                feats[hid].tasks.push({
                    text: inp.value.trim(),
                    bad: 1
                });
                S("lq_features", feats);
                renderTasks()
            }
        };
        inr.appendChild(inp);
        cont.appendChild(inr)
    };
    const renderResults = () => {
        const cont = panel.querySelector("#featContent");
        cont.innerHTML = "";
        const hist = (feats[hid].history || []).slice(-10);
        if (!hist.length) {
            cont.textContent = "No history yet for this student.";
            return;
        }
        const scores = hist.map(x => x.score || 0);
        const highest = Math.max(...scores);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        const recent = scores.slice(-1)[0];
        const meta = document.createElement("div");
        meta.className = "lq-stats";
        meta.innerHTML = `<div class=lq-meta><div>Highest: <strong>${highest}</strong></div><div>Avg: <strong>${avg}</strong></div><div>Recent: <strong>${recent}</strong></div></div>`;
        cont.appendChild(meta);
        const barsWrap = document.createElement("div");
        barsWrap.className = "lq-bars";
        barsWrap.style.width = "100%";
        cont.appendChild(barsWrap);
        const maxH = Math.max(...scores) * 1.2 || highest * 1.2;
        const containerWidth = barsWrap.clientWidth;
        const gap = 4;
        const n = hist.length;
        const barWidth = Math.min(20, (containerWidth - gap * (n - 1)) / n);
        hist.forEach(item => {
            const b = document.createElement("div");
            b.className = "bar";
            b.style.width = barWidth + "px";
            b.style.height = (item.score / maxH * 80) + "%";
            const sp = document.createElement("span");
            sp.textContent = item.score;
            b.appendChild(sp);
            barsWrap.appendChild(b);
        });
        const labs = document.createElement("div");
        labs.className = "lq-labels";
        cont.appendChild(labs);
        hist.forEach(item => {
            const lab = document.createElement("div");
            const t = item.time || "";
            let dt = "";
            if (t.length >= 12) {
                const d = new Date(t.slice(0, 4) + "-" + t.slice(4, 6) + "-" + t.slice(6, 8));
                dt = d.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
            } else dt = t;
            lab.textContent = dt;
            lab.style.width = barWidth + "px";
            labs.appendChild(lab);
        });
    };
    const setFeature = f => {
        setActiveButton(f);
        const perfContainer = panel.querySelector("#perfContainer"),
            featContent = panel.querySelector("#featContent");
        if (f === "performance") {
            perfContainer.style.display = "flex";
            featContent.style.display = "none";
            upd()
        } else {
            perfContainer.style.display = "none";
            featContent.style.display = "flex";
            if (f === "tasks") renderTasks();
            else renderResults()
        }
        updatePSWPWidth();
    };
    panel.querySelectorAll("#switcher button").forEach(b => {
        b.onclick = () => {
            pref.feature = b.dataset.f;
            S("listOfStudents", students);
            setFeature(b.dataset.f);
        }
    });
    setFeature(pref.feature || "performance");
    if (panel.classList.contains("closed") || !pref.panelOpen) {
        panel.classList.add("closed");
        mini.style.display = "flex"
    } else {
        panel.classList.remove("closed");
        mini.style.display = "none"
    }
    applyPanelState(!panel.classList.contains("closed"));
})();
