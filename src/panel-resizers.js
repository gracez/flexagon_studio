// Layout preferences are independent of the project artwork.
export function setupPanelResizers() {
  const workspace = document.querySelector('.workspace');
  const toolsPanel = document.querySelector('#toolsPanel');
  const previewPanel = document.querySelector('#previewPanel');
  const toolsDivider = document.querySelector('#toolsDivider');
  const previewDivider = document.querySelector('#previewDivider');
  const swapToggle = document.querySelector('#swapPanels');
  const storageKey = 'flexagon-studio-panel-widths';
  const swapStorageKey = 'flexagon-studio-panels-swapped';
  let preferred = null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (Number.isFinite(saved?.tools) && Number.isFinite(saved?.preview)) preferred = saved;
  } catch { /* Storage can be unavailable in private browsing. */ }
  let swapped = false;
  try { swapped = localStorage.getItem(swapStorageKey) === 'true'; } catch { /* Optional preference. */ }

  function applyOrder() {
    workspace.classList.toggle('panels-swapped', swapped);
    swapToggle.setAttribute('aria-pressed', String(swapped));
  }

  function defaults() {
    const css = getComputedStyle(workspace);
    return { tools: parseFloat(css.getPropertyValue('--tools-default')), preview: parseFloat(css.getPropertyValue('--preview-default')) };
  }
  function current() {
    return { tools: toolsPanel.getBoundingClientRect().width, preview: previewPanel.getBoundingClientRect().width };
  }
  function limits() {
    // Reserve 300 px for the canvas and 6 px for each draggable divider.
    return workspace.clientWidth - 300 - 12;
  }
  function apply() {
    const wanted = preferred || defaults(), available = limits();
    const tools = Math.min(Math.max(180, wanted.tools), 360, available - 220);
    const preview = Math.min(Math.max(220, wanted.preview), available - tools);
    workspace.style.setProperty('--tools-width', `${tools}px`);
    workspace.style.setProperty('--preview-width', `${preview}px`);
    for (const [divider, value, min, max] of [
      [toolsDivider, tools, 180, Math.min(360, available - preview)],
      [previewDivider, preview, 220, available - tools],
    ]) {
      divider.setAttribute('aria-valuenow', Math.round(value));
      divider.setAttribute('aria-valuetext', `${Math.round(value)} pixels`);
      divider.setAttribute('aria-valuemin', min);
      divider.setAttribute('aria-valuemax', Math.floor(max));
    }
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(preferred)); } catch { /* Optional preference. */ }
  }
  function change(panel, width, start = current()) {
    const max = panel === 'tools' ? Math.min(360, limits() - start.preview) : limits() - start.tools;
    preferred = { ...start, [panel]: Math.min(Math.max(panel === 'tools' ? 180 : 220, width), max) };
    apply();
  }
  for (const [divider, panel] of [[toolsDivider, 'tools'], [previewDivider, 'preview']]) {
    let drag = null;
    const direction = () => panel === 'tools' ? (swapped ? -1 : 1) : (swapped ? 1 : -1);
    divider.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      divider.focus();
      drag = { x: event.clientX, widths: current() };
      divider.setPointerCapture(event.pointerId);
      document.body.classList.add('resizing-panels');
      divider.classList.add('dragging');
    });
    divider.addEventListener('pointermove', event => {
      if (!drag) return;
      change(panel, drag.widths[panel] + direction() * (event.clientX - drag.x), drag.widths);
    });
    const stop = () => {
      if (!drag) return;
      drag = null;
      document.body.classList.remove('resizing-panels');
      divider.classList.remove('dragging');
      save();
    };
    divider.addEventListener('pointerup', stop);
    divider.addEventListener('pointercancel', stop);
    divider.addEventListener('lostpointercapture', stop);
    divider.addEventListener('dblclick', () => { change(panel, defaults()[panel]); save(); });
    divider.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        change(panel, current()[panel] + (event.key === 'ArrowRight' ? 1 : -1) * direction() * (event.shiftKey ? 48 : 16));
        save();
      } else if (event.key === 'Home') {
        event.preventDefault(); change(panel, defaults()[panel]); save();
      }
    });
  }
  swapToggle.addEventListener('click', () => {
    swapped = !swapped;applyOrder();apply();
    try { localStorage.setItem(swapStorageKey, String(swapped)); } catch { /* Optional preference. */ }
  });
  window.addEventListener('resize', apply);
  applyOrder();
  apply();
}
