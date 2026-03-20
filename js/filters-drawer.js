function initFiltersDrawer() {
  // Element selectors
  const MOBILE_BREAKPOINT = '(max-width: 768px)';
  const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT);
  const sidebar = document.querySelector('.sidebar');
  const actionsBar = document.querySelector('.task-actions');

  if (!sidebar || !actionsBar) return;

  const filterPanel = sidebar.querySelector('.filter-panel');
  const panelTitle = sidebar.querySelector('.panel__title');
  if (!filterPanel || !panelTitle) return;

  if (!sidebar.id) sidebar.id = 'mobileFiltersPanel';
  if (document.querySelector('.filters-btn')) return; // Only one instance

  // --- UI Elements Creation ---
  const btnOpenDrawer = createButton({
    type: 'button',
    className: 'filters-btn',
    html: '<i data-lucide="list-filter" aria-hidden="true"></i>',
    aria: {
      controls: sidebar.id,
      expanded: 'false',
      label: 'Abrir filtros',
    },
  });
  actionsBar.appendChild(btnOpenDrawer);

  const backdrop = createDiv('filters-backdrop', { hidden: true });
  document.body.appendChild(backdrop);

  const drawerHandle = createDiv('filters-handle', { 'aria-hidden': 'true' });

  // Mobile header
  const mobileHeader = createDiv('filters-head');
  const mobileHeaderTitle = document.createElement('h2');
  mobileHeaderTitle.className = 'sec-head__title';
  mobileHeaderTitle.textContent = panelTitle.textContent;

  const btnCloseDrawer = createButton({
    type: 'button',
    className: 'filters-close',
    html: '<i data-lucide="x" aria-hidden="true"></i>',
    aria: { label: 'Cerrar filtros' },
  });

  mobileHeader.append(mobileHeaderTitle, btnCloseDrawer);

  // Insert header and handle to panel
  filterPanel.insertBefore(drawerHandle, filterPanel.firstChild);
  filterPanel.insertBefore(mobileHeader, drawerHandle.nextSibling);

  // Footer/Actions
  const footer = createDiv('filters-footer');
  const btnCancelDrawer = createButton({
    type: 'button',
    className: 'filters-cancel',
    text: 'Cancelar',
  });
  const btnApplyDrawer = createButton({
    type: 'button',
    className: 'filters-apply',
    text: 'Ver resultados',
  });
  footer.append(btnCancelDrawer, btnApplyDrawer);
  filterPanel.appendChild(footer);

  // --- State
  let lastFocusedElement = null;
  let filtersSnapshot = null;

  // === Helpers ===
  function isMobileView() {
    return mediaQuery.matches;
  }

  function refreshLucideIcons() {
    window.lucide?.createIcons();
  }

  function setFiltersBtnVisibility(hidden) {
    btnOpenDrawer.classList.toggle('is-hidden', hidden);
  }

  function getInputList(selector) {
    return Array.from(sidebar.querySelectorAll(selector));
  }
  const getStatusInputs    = () => getInputList('input[name="status"]');
  const getPriorityInputs  = () => getInputList('input[name="priority"]');
  const getCategoryInputs  = () => getInputList('input[name="cat"]');

  function readUISelections() {
    const checkedStatus =
      sidebar.querySelector('input[name="status"]:checked')?.value || 'all';

    const priorities = getPriorityInputs()
      .filter(i => i.checked)
      .map(i => i.value);

    const categories = getCategoryInputs()
      .filter(i => i.checked)
      .map(i => i.value.toLowerCase());

    return { status: checkedStatus, priorities, categories };
  }

  function saveFiltersSnapshot() {
    filtersSnapshot = readUISelections();
  }

  function restoreFiltersSnapshotIfAvailable() {
    if (!filtersSnapshot) return;
    getStatusInputs().forEach(
      input => (input.checked = input.value === filtersSnapshot.status)
    );
    getPriorityInputs().forEach(
      input => (input.checked = filtersSnapshot.priorities.includes(input.value))
    );
    getCategoryInputs().forEach(
      input => (input.checked = filtersSnapshot.categories.includes(input.value.toLowerCase()))
    );
    wireUpAppToInputs();
  }

  function wireUpAppToInputs() {
    const selectedStatusInput = sidebar.querySelector('input[name="status"]:checked');
    if (selectedStatusInput) {
      selectedStatusInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    getPriorityInputs().forEach(i =>
      i.dispatchEvent(new Event('change', { bubbles: true }))
    );
    getCategoryInputs().forEach(i =>
      i.dispatchEvent(new Event('change', { bubbles: true }))
    );
    window.TaskFlowApp?.refreshUI?.();
  }

  function updateResultsButtonText() {
    const currentSelections = readUISelections();
    let resultCount = null;
    if (typeof window.TaskFlowApp?.getFilteredCountByState === 'function') {
      resultCount = window.TaskFlowApp.getFilteredCountByState(currentSelections);
    }
    if (resultCount == null) {
      // fallback: visible task items in DOM
      resultCount = document.querySelectorAll('#taskList .task-list__item').length;
    }
    btnApplyDrawer.textContent =
      resultCount === 1 ? 'Ver 1 resultado' : `Ver ${resultCount} resultados`;
  }

  function openDrawer() {
    if (!isMobileView()) return;

    lastFocusedElement = document.activeElement;
    saveFiltersSnapshot();
    updateResultsButtonText();

    sidebar.classList.add('is-open');
    backdrop.hidden = false;
    backdrop.classList.add('is-visible');
    document.body.classList.add('filters-open');

    btnOpenDrawer.setAttribute('aria-expanded', 'true');
    setFiltersBtnVisibility(true);
    btnCloseDrawer.focus();
  }

  function closeDrawer({ restore = false } = {}) {
    if (restore) restoreFiltersSnapshotIfAvailable();

    sidebar.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    backdrop.hidden = true;
    document.body.classList.remove('filters-open');

    btnOpenDrawer.setAttribute('aria-expanded', 'false');
    setFiltersBtnVisibility(!isMobileView());

    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus();
    } else {
      btnOpenDrawer.focus();
    }
  }

  function applyAndCloseDrawer() {
    wireUpAppToInputs();
    closeDrawer({ restore: false });
  }

  function cancelAndCloseDrawer() {
    closeDrawer({ restore: true });
  }

  function toggleDrawerOpen() {
    if (sidebar.classList.contains('is-open')) {
      cancelAndCloseDrawer();
    } else {
      openDrawer();
    }
  }

  function updateMobileModeView() {
    if (isMobileView()) {
      btnOpenDrawer.hidden = false;
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('role', 'dialog');
      if (!sidebar.classList.contains('is-open')) {
        setFiltersBtnVisibility(false);
      }
    } else {
      // Reset/make static
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      backdrop.hidden = true;
      document.body.classList.remove('filters-open');

      btnOpenDrawer.hidden = true;
      setFiltersBtnVisibility(false);
      btnOpenDrawer.setAttribute('aria-expanded', 'false');

      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('role');
    }
  }

  // --- Event Listeners ---
  btnOpenDrawer.addEventListener('click', toggleDrawerOpen);
  btnCloseDrawer.addEventListener('click', cancelAndCloseDrawer);
  btnCancelDrawer.addEventListener('click', cancelAndCloseDrawer);
  btnApplyDrawer.addEventListener('click', applyAndCloseDrawer);
  backdrop.addEventListener('click', cancelAndCloseDrawer);

  function handleFilterInputChange() {
    if (sidebar.classList.contains('is-open')) {
      updateResultsButtonText();
    }
  }
  sidebar.addEventListener('change', handleFilterInputChange);
  sidebar.addEventListener('input', handleFilterInputChange);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('is-open')) {
      cancelAndCloseDrawer();
    }
  });

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', updateMobileModeView);
  } else {
    // legacy browsers
    mediaQuery.addListener(updateMobileModeView);
  }

  // --- Initial setup ---
  updateMobileModeView();
  refreshLucideIcons();

  // --- Small helper creators ---
  function createButton({ type, className, text, html, aria = {} }) {
    const btn = document.createElement('button');
    btn.type = type || 'button';
    btn.className = className || '';
    if (text) btn.textContent = text;
    if (html) btn.innerHTML = html;
    Object.entries(aria).forEach(([attr, value]) => btn.setAttribute(`aria-${attr}`, value));
    return btn;
  }

  function createDiv(className, attrs = {}) {
    const div = document.createElement('div');
    div.className = className || '';
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === 'hidden') div.hidden = v;
      else div.setAttribute(k, v);
    });
    return div;
  }
}

window.initFiltersDrawer = initFiltersDrawer;
