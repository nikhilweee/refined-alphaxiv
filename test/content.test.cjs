const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

const source = readFileSync(`${__dirname}/../content.js`, "utf8");

async function reader(enabled = true) {
  const events = {};
  const frames = [];
  const timers = new Map();
  const created = [];
  const bodyAttributes = new Set();
  let timerId = 0;
  let storageChanged;
  let observe;
  const state = { text: "PDF selection", inPDF: true, saves: 0, panels: [] };
  const body = {
    removeAttribute: (name) => bodyAttributes.delete(name),
    toggleAttribute: (name, value) => value ? bodyAttributes.add(name) : bodyAttributes.delete(name),
  };
  const share = { className: "native", after: (node) => { node.previousSibling = share; } };
  const info = { className: "native", before: (node) => { node.nextSibling = info; } };
  const native = { share, info };
  const context = {
    document: {
      body,
      createElement() {
        const node = {
          attributes: {},
          setAttribute(name, value) { this.attributes[name] = value; },
          addEventListener(name, fn) { this[name] = fn; },
          contains: () => false,
        };
        created.push(node);
        return node;
      },
      addEventListener: (name, fn) => { events[name] = fn; },
      querySelector: (selector) => selector.includes("Share Paper") ? native.share : native.info,
      querySelectorAll: () => state.panels,
    },
    location: { pathname: "/pdf/2310.08864" },
    window: {
      getSelection() {
        const node = { parentElement: { closest: () => state.inPDF ? {} : null } };
        return { toString: () => state.text, anchorNode: node, focusNode: node };
      },
      addEventListener: (name, fn) => { events[name] = fn; },
    },
    chrome: { storage: {
      local: { get: async () => ({ autoHighlight: enabled }), set: async () => {} },
      onChanged: { addListener: (fn) => { storageChanged = fn; } },
    } },
    requestAnimationFrame: (fn) => { frames.push(fn); return frames.length; },
    setTimeout: (fn) => { timers.set(++timerId, fn); return timerId; },
    clearTimeout: (id) => timers.delete(id),
    MutationObserver: class {
      constructor(fn) { observe = fn; }
      observe() {}
    },
  };
  await vm.runInNewContext(source, context);
  const [link, toggle] = created;
  const flush = () => frames.splice(0).forEach((fn) => fn());
  const suppressed = () => bodyAttributes.has("data-refined-auto-highlight");
  function composer(mode = "note", text = "") {
    const note = {
      textContent: "Note",
      getAttribute: () => mode === "note" ? "true" : "false",
      click: () => { mode = "note"; },
    };
    return {
      getClientRects: () => [{}],
      querySelector: (selector) => selector.includes("contenteditable") ? { textContent: text } :
        mode === "note" ? { click: () => { state.saves++; } } : null,
      querySelectorAll: () => [note],
    };
  }
  function select({ clearOnFocus = false } = {}) {
    events.pointerdown();
    events.selectionchange();
    if (clearOnFocus) state.text = "";
    events.mouseup({ type: "mouseup" });
    flush();
  }
  return { state, context, link, toggle, native, composer, select, flush, suppressed,
    refresh: () => { observe(); flush(); },
    expire: () => [...timers.values()].forEach((fn) => fn()),
    clickElsewhere: () => events.pointerdown(),
    changePreference: (value) => storageChanged({ autoHighlight: { newValue: value } }, "local"),
  };
}

test("selection survives alphaXiv focusing its editor and saves only once", async () => {
  const r = await reader();
  r.state.panels = [r.composer()];
  r.select({ clearOnFocus: true });
  assert.equal(r.state.saves, 1);
  assert.equal(r.suppressed(), true);
  r.refresh();
  assert.equal(r.state.saves, 1);
  r.expire();
  assert.equal(r.suppressed(), false);
});

test("an asynchronously rendered AI composer switches to Note before saving", async () => {
  const r = await reader();
  r.select();
  assert.equal(r.state.saves, 0);
  r.state.panels = [r.composer("ai")];
  r.refresh();
  r.flush();
  assert.equal(r.state.saves, 1);
});

test("failed or ambiguous saves restore the manual menu", async () => {
  for (const kind of ["missing", "typed", "ambiguous"]) {
    const r = await reader();
    r.state.panels = kind === "missing" ? [] : kind === "typed" ?
      [r.composer("note", "Unfinished note")] : [r.composer(), r.composer()];
    r.select();
    assert.equal(r.state.saves, 0);
    assert.equal(r.suppressed(), true);
    r.expire();
    assert.equal(r.suppressed(), false);
    r.state.panels = [r.composer()];
    r.refresh();
    assert.equal(r.state.saves, 0);
  }
});

test("ordinary clicks, non-PDF text, and disabled mode never hide the composer", async () => {
  const r = await reader();
  r.state.panels = [r.composer()];
  r.clickElsewhere();
  assert.equal(r.suppressed(), false);
  r.state.inPDF = false;
  r.select();
  assert.equal(r.suppressed(), false);
  r.state.inPDF = true;
  r.toggle.click();
  r.select();
  assert.equal(r.state.saves, 0);
  assert.equal(r.suppressed(), false);
});

test("preference changes in another tab disable pending automatic saves", async () => {
  const r = await reader();
  r.select();
  r.changePreference(false);
  assert.equal(r.toggle.attributes["aria-pressed"], "false");
  assert.equal(r.suppressed(), false);
  r.state.panels = [r.composer()];
  r.refresh();
  assert.equal(r.state.saves, 0);
});

test("SPA navigation updates links and reinstalls controls after a UI remount", async () => {
  const r = await reader();
  assert.equal(r.link.href, "https://arxiv.org/abs/2310.08864");
  r.context.location.pathname = "/abs/1706.03762v2";
  r.refresh();
  assert.equal(r.link.href, "https://arxiv.org/abs/1706.03762v2");
  r.context.location.pathname = "/abs/hep-th/9901001";
  r.refresh();
  assert.equal(r.link.href, "https://arxiv.org/abs/hep-th/9901001");
  const replacement = { className: "replacement", after(node) { node.previousSibling = this; } };
  r.native.share = replacement;
  r.refresh();
  assert.equal(r.link.previousSibling, replacement);
  r.context.location.pathname = "/";
  r.refresh();
  assert.equal(r.link.hidden, true);
  assert.equal(r.toggle.hidden, true);
  assert.equal(r.suppressed(), false);
});
