(() => {
  const STORAGE_KEY = 'taskflow-theme';
  const query = window.matchMedia('(prefers-color-scheme: dark)');

  function resolveTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored === 'light' || stored === 'dark') {
      return stored;
    }

    return query.matches ? 'dark' : 'light';
  }

  function applyTheme(theme, { persist = false } = {}) {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    root.classList.toggle('dark', isDark);
    root.dataset.theme = theme;
    root.style.colorScheme = theme;

    if (persist) {
      localStorage.setItem(STORAGE_KEY, theme);
    }

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-pressed', String(isDark));
      button.setAttribute('aria-label', isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');

      const label = button.querySelector('[data-theme-label]');
      if (label) {
        label.textContent = isDark ? 'Oscuro' : 'Claro';
      }
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function toggleTheme() {
    const nextTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
    applyTheme(nextTheme, { persist: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(resolveTheme());

    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.addEventListener('click', toggleTheme);
    });
  });

  const syncSystemTheme = (event) => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    applyTheme(event.matches ? 'dark' : 'light');
  };

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', syncSystemTheme);
  } else if (typeof query.addListener === 'function') {
    query.addListener(syncSystemTheme);
  }
})();
