(async () => {
  const { autoHighlight } = await chrome.storage.local.get({
    autoHighlight: false,
  });
  const arxiv = document.createElement("a");
  arxiv.id = "refined-alphaxiv-arxiv";
  // Official arxiv-logomark-small-black.svg; black parts follow the toolbar color via CSS.
  // https://cornell.app.box.com/v/arxiv-logo-assets/file/804104728304
  arxiv.innerHTML =
    '<svg aria-hidden="true" id="logomark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 74.492 100.25"><g id="tiny_-_red" data-name="tiny - red"><path d="M553.264,283.782l29.888-27.1a5.163,5.163,0,0,1,3.265-1.515,4.168,4.168,0,0,1,.544.037,6.622,6.622,0,0,1,4.18,3.251c.612,1.507.268,2.693-1.416,4.88l-26.858,31.724Z" transform="translate(-526.086 -245.559)" fill="#fff"/><path d="M586.417,255.912a3.534,3.534,0,0,1,.448.03,5.923,5.923,0,0,1,3.581,2.791c.454,1.116.314,2.023-1.315,4.14L562.865,293.9l-8.558-10.047,29.349-26.616a4.4,4.4,0,0,1,2.761-1.321m0-1.5a5.767,5.767,0,0,0-3.689,1.642l-.041.033-.039.035L553.3,282.738l-1.077.977.943,1.107,8.558,10.046,1.146,1.345,1.141-1.348,26.266-31.022.023-.027.021-.028c1.575-2.046,2.328-3.622,1.516-5.62a7.309,7.309,0,0,0-4.779-3.713,4.891,4.891,0,0,0-.64-.043Z" transform="translate(-526.086 -245.559)"/><path d="M577.758,289.555l-43.7-41.923s-1.671-2.029-3.437-2.071a4.49,4.49,0,0,0-4.23,2.718c-.688,1.651-.194,2.809,1.315,4.97l34.775,42.2-.017,0-25.884,31.793c-1.255,1.337-2.032,3.683-1.331,5.367a4.587,4.587,0,0,0,4.287,2.841,4.087,4.087,0,0,0,3.082-1.523l35.1-32.634A7.926,7.926,0,0,0,577.758,289.555Z" transform="translate(-526.086 -245.559)"/><path d="M595.193,345.06A4.725,4.725,0,0,1,592,343.741l-44.508-42.39c-3.656-3.656-3.48-8.728.424-12.632l5.569-5.211,9.486,11.158,35.517,42.75a4.44,4.44,0,0,1,1.188,4.115,4.85,4.85,0,0,1-3.22,3.338A4.353,4.353,0,0,1,595.193,345.06Z" transform="translate(-526.086 -245.559)" fill="#fff"/><path d="M553.423,284.593l8.977,10.558L597.911,337.9c.873,1.093,1.419,2.186,1.047,3.418a4.092,4.092,0,0,1-2.721,2.837,3.557,3.557,0,0,1-1.045.159,4,4,0,0,1-2.687-1.124L548.01,300.808c-3.5-3.5-2.971-8.151.436-11.558l4.977-4.657m.124-2.17L552.4,283.5l-4.976,4.656c-4.192,4.191-4.372,9.816-.473,13.714l44.521,42.4a5.485,5.485,0,0,0,3.722,1.538,5.1,5.1,0,0,0,1.483-.224,5.59,5.59,0,0,0,3.719-3.838,5.175,5.175,0,0,0-1.31-4.788l-35.53-42.767-8.988-10.571-1.019-1.2Z" transform="translate(-526.086 -245.559)"/><path d="M592.074,250.547" transform="translate(-526.086 -245.559)" fill="#fff" stroke="#000" stroke-miterlimit="10" stroke-width="0.25"/></g></svg>';
  arxiv.title = "Switch to this paper on arXiv";
  arxiv.setAttribute("aria-label", "Switch to arXiv");
  const toggle = document.createElement("button");
  toggle.id = "refined-alphaxiv-highlight";
  toggle.type = "button";
  toggle.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-5" aria-hidden="true"><path d="m9 11-6 6v3h9l3-3"/><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4"/></svg>';

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
    if (
      area === "local" &&
      changes.autoHighlight &&
      changes.autoHighlight.newValue !== enabled
    ) {
      setEnabled(changes.autoHighlight.newValue === true);
    }
  });

  function update() {
    frame = undefined;
    const paper = location.pathname.match(
      /^\/(abs|pdf)\/(\d{4}\.\d{4,5}(?:v\d+)?|[a-z][a-z.\-]*\/\d{7}(?:v\d+)?)(?:\/|$)/i,
    );
    if (paper)
      arxiv.href = `https://arxiv.org/${paper[1].toLowerCase()}/${paper[2]}`;
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
    const composers = [
      ...document.querySelectorAll(
        'body > .absolute:has([aria-label="Composer mode"])',
      ),
    ].filter((panel) => {
      const editor = panel.querySelector('[contenteditable="true"]');
      return (
        editor && !editor.textContent.trim() && panel.getClientRects().length
      );
    });
    if (composers.length !== 1) return;
    const panel = composers[0];
    const note = [
      ...panel.querySelectorAll('[aria-label="Composer mode"] button'),
    ].find((button) => button.textContent.trim() === "Note");
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
    if (
      !enabled ||
      toggle.hidden ||
      toggle.contains(event.target) ||
      arxiv.contains(event.target)
    )
      return;
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
    if (
      selection?.toString().trim() &&
      selection.anchorNode?.parentElement?.closest(".textLayer") &&
      selection.focusNode?.parentElement?.closest(".textLayer")
    ) {
      pdfSelection = true;
      document.body.toggleAttribute("data-refined-auto-highlight", true);
    }
  }

  // alphaXiv clears the browser selection when it focuses the note editor.
  document.addEventListener("selectionchange", rememberSelection);
  document.addEventListener("mouseup", onSelection, true);
  document.addEventListener("keyup", onSelection, true);
  document.addEventListener("pointerdown", resetSelection, true);
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  });
  window.addEventListener("popstate", schedule);
  update();
})();
