(async () => {
  const { autoHighlight } = await chrome.storage.local.get({ autoHighlight: false });
  const arxiv = document.createElement("a");
  arxiv.id = "refined-alphaxiv-arxiv";
  // Official small logomark: https://info.arxiv.org/brand/logos.html
  arxiv.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 17.732 24.269" aria-hidden="true"><g><path d="M573.549,280.916l2.266,2.738,6.674-7.84c.353-.47.52-.717.353-1.117a1.218,1.218,0,0,0-1.061-.748h0a.953.953,0,0,0-.712.262Z" transform="translate(-566.984 -271.548)" fill="#bdb9b4"/><path d="M579.525,282.225l-10.606-10.174a1.413,1.413,0,0,0-.834-.5,1.09,1.09,0,0,0-1.027.66c-.167.4-.047.681.319,1.206l8.44,10.242h0l-6.282,7.716a1.336,1.336,0,0,0-.323,1.3,1.114,1.114,0,0,0,1.04.69A.992.992,0,0,0,571,293l8.519-7.92A1.924,1.924,0,0,0,579.525,282.225Z" transform="translate(-566.984 -271.548)" fill="#b31b1b"/><path d="M584.32,293.912l-8.525-10.275,0,0L573.53,280.9l-1.389,1.254a2.063,2.063,0,0,0,0,2.965l10.812,10.419a.925.925,0,0,0,.742.282,1.039,1.039,0,0,0,.953-.667A1.261,1.261,0,0,0,584.32,293.912Z" transform="translate(-566.984 -271.548)" fill="#bdb9b4"/></g></svg>';
  arxiv.title = "Switch to this paper on arXiv";
  arxiv.setAttribute("aria-label", "Switch to arXiv");
  const toggle = document.createElement("button");
  toggle.id = "refined-alphaxiv-highlight";
  toggle.type = "button";
  toggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>';

  let enabled = false;
  let pending = false;
  let pdfSelection = false;
  let expiry;
  let frame;

  function resetSelection() {
    pending = false;
    pdfSelection = false;
    clearTimeout(expiry);
    document.body.removeAttribute("data-refined-auto-highlight");
  }

  function setEnabled(value) {
    enabled = value;
    toggle.title = `Auto highlight: ${value ? "on" : "off"}`;
    toggle.setAttribute("aria-label", toggle.title);
    toggle.setAttribute("aria-pressed", String(value));
    resetSelection();
  }

  setEnabled(autoHighlight === true);
  toggle.addEventListener("click", () => {
    setEnabled(!enabled);
    chrome.storage.local.set({ autoHighlight: enabled });
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.autoHighlight && changes.autoHighlight.newValue !== enabled) {
      setEnabled(changes.autoHighlight.newValue === true);
    }
  });

  function update() {
    frame = undefined;
    const paper = location.pathname.match(
      /^\/(?:abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?|[a-z][a-z.\-]*\/\d{7}(?:v\d+)?)(?:\/|$)/i
    );
    if (paper) arxiv.href = `https://arxiv.org/abs/${paper[1]}`;
    const share = document.querySelector('button[aria-label="Share Paper" i]');
    const info = document.querySelector('button[aria-label="Paper info"]');
    arxiv.hidden = !paper || !share;
    toggle.hidden = !paper || !info;
    if (!paper) resetSelection();
    if (paper && share) {
      arxiv.className = share.className;
      if (arxiv.previousSibling !== share) share.after(arxiv);
    }
    if (paper && info) {
      toggle.className = info.className;
      if (toggle.nextSibling !== info) info.before(toggle);
    }
    if (!paper || !enabled || !pending) return;

    // Let alphaXiv create and save the annotation, preserving its native behavior.
    const composers = [...document.querySelectorAll('body > .absolute:has([aria-label="Composer mode"])')]
      .filter((panel) => {
        const editor = panel.querySelector('[contenteditable="true"]');
        return editor && !editor.textContent.trim() && panel.getClientRects().length;
      });
    if (composers.length !== 1) return;
    const panel = composers[0];
    const note = [...panel.querySelectorAll('[aria-label="Composer mode"] button')]
      .find((button) => button.textContent.trim() === "Note");
    if (note?.getAttribute("aria-pressed") === "false") {
      note.click();
      schedule();
      return;
    }
    const save = panel.querySelector('button[aria-label="Save note"]');
    if (!save || save.disabled) return;
    pending = false;
    pdfSelection = false;
    save.click();
  }

  function schedule() {
    if (frame === undefined) frame = requestAnimationFrame(update);
  }

  function onSelection(event) {
    if (!enabled || toggle.hidden || toggle.contains(event.target) || arxiv.contains(event.target)) return;
    if (event.type === "keyup" && !event.shiftKey) return;
    rememberSelection();
    pending = pdfSelection;
    clearTimeout(expiry);
    if (!pending) return;
    // Wait for the selection menu, but never act on a later, unrelated dialog.
    expiry = setTimeout(() => {
      // Restore the native menu if saving stalls or the composer isn't empty.
      resetSelection();
    }, 1500);
    schedule();
  }

  function rememberSelection() {
    if (!enabled) return;
    const selection = window.getSelection();
    if (selection?.toString().trim() &&
        selection.anchorNode?.parentElement?.closest(".textLayer") &&
        selection.focusNode?.parentElement?.closest(".textLayer")) {
      pdfSelection = true;
      document.body.toggleAttribute("data-refined-auto-highlight", true);
    }
  }

  // alphaXiv clears the browser selection when it focuses the note editor.
  document.addEventListener("selectionchange", rememberSelection);
  document.addEventListener("mouseup", onSelection, true);
  document.addEventListener("keyup", onSelection, true);
  document.addEventListener("pointerdown", resetSelection, true);
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("popstate", schedule);
  update();
})();
