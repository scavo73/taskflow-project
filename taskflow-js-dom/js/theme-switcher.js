(() => {
  const THEME_KEY = 'taskflow_ui_theme';

  const THEMES = {
    green: {
      bg: '#17d98f',
      dark: '#14b87a',
      light: '#1afaa4'
    },
    blue: {
      bg: '#17a8d9',
      dark: '#148fb8',
      light: '#1ac1fa'
    },
    yellow: {
      bg: '#d6d917',
      dark: '#b6b814',
      light: '#f6fa1a'
    }
  };

  function setThemeVars(theme) {
    const root = document.documentElement;
    root.style.setProperty('--theme-bg', theme.bg);
    root.style.setProperty('--theme-shadow-dark', theme.dark);
    root.style.setProperty('--theme-shadow-light', theme.light);
    root.style.setProperty(
      '--theme-shadow-md',
      `10px 10px 24px ${theme.dark}, -10px -10px 24px ${theme.light}`
    );
    root.style.setProperty(
      '--theme-shadow-sm',
      `6px 6px 14px ${theme.dark}, -6px -6px 14px ${theme.light}`
    );
    root.style.setProperty(
      '--theme-shadow-inset',
      `inset 4px 4px 12px ${theme.dark}, inset -4px -4px 12px ${theme.light}`
    );
    root.style.setProperty('--theme-text', 'rgba(0, 0, 0, 0.88)');
  }

  function clearThemeVars() {
    const root = document.documentElement;
    root.style.removeProperty('--theme-bg');
    root.style.removeProperty('--theme-shadow-dark');
    root.style.removeProperty('--theme-shadow-light');
    root.style.removeProperty('--theme-shadow-md');
    root.style.removeProperty('--theme-shadow-sm');
    root.style.removeProperty('--theme-shadow-inset');
    root.style.removeProperty('--theme-text');
  }

  function updateButtonsState(activeThemeId, dots, resetBtn) {
    dots.forEach((dot) => {
      dot.setAttribute(
        'aria-pressed',
        String(dot.dataset.themeId === activeThemeId)
      );
    });

    if (resetBtn) {
      resetBtn.setAttribute('aria-pressed', String(!activeThemeId));
    }
  }

  function applyTheme(themeId, dots, resetBtn) {
    const theme = THEMES[themeId];
    if (!theme) return;

    setThemeVars(theme);
    document.body.dataset.theme = themeId;
    localStorage.setItem(THEME_KEY, themeId);
    updateButtonsState(themeId, dots, resetBtn);
  }

  function resetTheme(dots, resetBtn) {
    clearThemeVars();
    delete document.body.dataset.theme;
    localStorage.removeItem(THEME_KEY);
    updateButtonsState('', dots, resetBtn);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const dots = [...document.querySelectorAll('.theme-dot[data-theme-id]')];
    const resetBtn = document.querySelector('[data-theme-reset]');

    if (dots.length === 0) return;

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        applyTheme(dot.dataset.themeId, dots, resetBtn);
      });
    });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetTheme(dots, resetBtn);
      });
    }

    const savedTheme = localStorage.getItem(THEME_KEY);

    if (savedTheme && THEMES[savedTheme]) {
      applyTheme(savedTheme, dots, resetBtn);
    } else {
      resetTheme(dots, resetBtn);
    }
  });
})();