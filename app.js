(() => {
  const css = `
    :root{--bg:#fff;--tile:#eef0f3;--tile2:#e9ebef;--text:#111827;--muted:#6b7280;--accent:#3b82f6;--r:14px;}
    *{box-sizing:border-box;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial;}
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f7fb;padding:24px;}
    .calc{width:min(360px,92vw);background:var(--bg);border-radius:24px;padding:18px;box-shadow:0 18px 40px rgba(17,24,39,.10);}
    .display{height:64px;display:flex;align-items:flex-end;justify-content:flex-end;padding:10px 8px 6px;color:var(--text);font-size:28px;font-weight:600;overflow:hidden;white-space:nowrap;}
    .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:10px;}
    button{border:0;border-radius:var(--r);background:var(--tile);height:56px;font-size:18px;font-weight:600;color:var(--text);cursor:pointer;transition:transform .05s ease,filter .15s ease;user-select:none;}
    button:active{transform:scale(.98);filter:brightness(.98);}
    .func{color:var(--accent);background:var(--tile2);}
    .op{color:var(--accent);background:var(--tile);}
    .eq{color:var(--accent);background:var(--tile2);font-weight:800;}
  `;

  const injectCSS = () => {
    const style = document.createElement("style");
    style.textContent = css;
    document.head.appendChild(style);
  };

  const make = (tag, attrs = {}, children = []) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("data-")) el.setAttribute(k, v);
      else el[k] = v;
    }
    children.forEach((c) => el.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
    return el;
  };

  injectCSS();

  const displayEl = make("div", { class: "display", id: "display", textContent: "0" });
  const grid = make("div", { class: "grid" });

  const buttons = [
    { t: "AC", c: "func", a: { "data-action": "ac" } },
    { t: "DEL", c: "func", a: { "data-action": "del" } },
    { t: "%", c: "func", a: { "data-action": "percent" } },
    { t: "/", c: "op", a: { "data-op": "/" } },

    { t: "7", a: { "data-digit": "7" } },
    { t: "8", a: { "data-digit": "8" } },
    { t: "9", a: { "data-digit": "9" } },
    { t: "*", c: "op", a: { "data-op": "*" } },

    { t: "4", a: { "data-digit": "4" } },
    { t: "5", a: { "data-digit": "5" } },
    { t: "6", a: { "data-digit": "6" } },
    { t: "-", c: "op", a: { "data-op": "-" } },

    { t: "1", a: { "data-digit": "1" } },
    { t: "2", a: { "data-digit": "2" } },
    { t: "3", a: { "data-digit": "3" } },
    { t: "+", c: "op", a: { "data-op": "+" } },

    { t: "0", a: { "data-digit": "0" } },
    { t: "00", a: { "data-digit": "00" } },
    { t: ".", a: { "data-action": "dot" } },
    { t: "=", c: "eq", a: { "data-action": "eq" } },
  ];

  buttons.forEach((b) => grid.appendChild(make("button", { class: b.c || "", ...b.a }, [b.t])));

  const app = make("div", { class: "calc" }, [displayEl, grid]);
  document.body.appendChild(app);

  // ---- Logic ----
  let current = "0";
  let prev = null;
  let op = null;
  let justEvaluated = false;

  const fmt = (n) => {
    if (!Number.isFinite(n)) return "Error";
    const s = String(n);
    if (s.includes("e")) return s;
    if (s.includes(".")) return s.replace(/\.?0+$/, "");
    return s;
  };

  const setDisplay = () => {
    if (op && prev !== null) {
      const left = fmt(prev);
      const right = current === "" ? "" : current;
      displayEl.textContent = `${left}${op}${right}`;
    } else {
      displayEl.textContent = current === "" ? "0" : current;
    }
  };

  const inputDigit = (d) => {
    if (justEvaluated && !op) { current = "0"; justEvaluated = false; }
    if (current === "0" && d !== "00") current = d;
    else if (current === "0" && d === "00") current = "0";
    else current += d;
    setDisplay();
  };

  const inputDot = () => {
    if (justEvaluated && !op) { current = "0"; justEvaluated = false; }
    if (!current.includes(".")) current += (current === "" ? "0." : ".");
    setDisplay();
  };

  const clearAll = () => { current = "0"; prev = null; op = null; justEvaluated = false; setDisplay(); };
  const delOne = () => {
    if (justEvaluated) { clearAll(); return; }
    if (current.length <= 1) current = "0";
    else current = current.slice(0, -1);
    setDisplay();
  };

  const setOp = (nextOp) => {
    if (op && prev !== null && current !== "" && !justEvaluated) equal();
    prev = Number(current);
    op = nextOp;
    current = "";
    justEvaluated = false;
    setDisplay();
  };

  // iPhone-like percent behavior for +/-
  const percent = () => {
    if (current === "" || current === "Error") return;
    const cur = Number(current);
    let out;
    if (prev !== null && op && (op === "+" || op === "-")) out = prev * (cur / 100);
    else out = cur / 100;
    current = fmt(out);
    justEvaluated = false;
    setDisplay();
  };

  const equal = () => {
    if (prev === null || !op) return;
    const a = prev;
    const b = Number(current === "" ? "0" : current);
    let r;
    switch (op) {
      case "+": r = a + b; break;
      case "-": r = a - b; break;
      case "*": r = a * b; break;
      case "/": r = (b === 0) ? Infinity : a / b; break;
    }
    current = fmt(r);
    prev = null;
    op = null;
    justEvaluated = true;
    setDisplay();
  };

  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.dataset.digit) return inputDigit(btn.dataset.digit);
    if (btn.dataset.op) return setOp(btn.dataset.op);
    const action = btn.dataset.action;
    if (action === "ac") return clearAll();
    if (action === "del") return delOne();
    if (action === "dot") return inputDot();
    if (action === "percent") return percent();
    if (action === "eq") return equal();
  });

  setDisplay();
})();
