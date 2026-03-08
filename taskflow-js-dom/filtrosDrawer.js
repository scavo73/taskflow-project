function inicializarDrawerFiltrosMovil() {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const aside = document.querySelector('.barra-lateral');

    if (!aside) return;

    const panel = aside.querySelector('.panel');
    const titulo = aside.querySelector('.panel__titulo');

    if (!panel || !titulo) return;

    if (!aside.id) {
        aside.id = 'panelFiltrosMovil';
    }

    if (document.querySelector('.filtros-mobile-btn')) return;

    const btnFiltros = document.createElement('button');
    btnFiltros.type = 'button';
    btnFiltros.className = 'filtros-mobile-btn';
    btnFiltros.setAttribute('aria-controls', aside.id);
    btnFiltros.setAttribute('aria-expanded', 'false');
    btnFiltros.setAttribute('aria-label', 'Abrir filtros');
    btnFiltros.innerHTML = `
    <i data-lucide="sliders-horizontal" aria-hidden="true"></i>
    <span>Filtros</span>
  `;

    const backdrop = document.createElement('div');
    backdrop.className = 'filtros-mobile-backdrop';
    backdrop.hidden = true;

    document.body.append(btnFiltros, backdrop);

    const handle = document.createElement('div');
    handle.className = 'filtros-mobile-handle';
    handle.setAttribute('aria-hidden', 'true');

    const headerMovil = document.createElement('div');
    headerMovil.className = 'filtros-mobile-header';

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'filtros-mobile-close';
    closeBtn.setAttribute('aria-label', 'Cerrar filtros');
    closeBtn.innerHTML = `<i data-lucide="x" aria-hidden="true"></i>`;

    headerMovil.append(titulo, closeBtn);
    panel.insertBefore(handle, panel.firstChild);
    panel.insertBefore(headerMovil, handle.nextSibling);

    const footer = document.createElement('div');
    footer.className = 'filtros-mobile-footer';

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.className = 'filtros-mobile-cancel';
    btnCancelar.textContent = 'Cancelar';

    const btnAplicar = document.createElement('button');
    btnAplicar.type = 'button';
    btnAplicar.className = 'filtros-mobile-apply';
    btnAplicar.textContent = 'Ver resultados';

    footer.append(btnCancelar, btnAplicar);
    panel.appendChild(footer);

    let ultimoElementoActivo = null;
    let snapshotInicial = null;

    function esMovil() {
        return mediaQuery.matches;
    }

    function refrescarIconos() {
        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function ocultarBoton() {
        btnFiltros.classList.add('is-hidden');
    }

    function mostrarBoton() {
        if (!esMovil()) return;
        btnFiltros.classList.remove('is-hidden');
    }

    function obtenerInputsPrioridad() {
        return [...aside.querySelectorAll('input[name="prioridad"]')];
    }

    function obtenerInputsCategorias() {
        return [...aside.querySelectorAll('input[name="cat"]')];
    }

    function leerEstadoActual() {
        const prioridad =
            aside.querySelector('input[name="prioridad"]:checked')?.value || 'all';

        const categorias = obtenerInputsCategorias()
            .filter((input) => input.checked)
            .map((input) => input.value.toLowerCase());

        return { prioridad, categorias };
    }

    function guardarSnapshot() {
        snapshotInicial = leerEstadoActual();
    }

    function restaurarSnapshot() {
        if (!snapshotInicial) return;

        const radios = obtenerInputsPrioridad();
        const checks = obtenerInputsCategorias();

        radios.forEach((input) => {
            input.checked = input.value === snapshotInicial.prioridad;
        });

        checks.forEach((input) => {
            input.checked = snapshotInicial.categorias.includes(input.value.toLowerCase());
        });

        sincronizarAplicacionConInputs();
    }

    function sincronizarAplicacionConInputs() {
        const prioridadMarcada = aside.querySelector('input[name="prioridad"]:checked');
        const categorias = obtenerInputsCategorias();

        if (prioridadMarcada) {
            prioridadMarcada.dispatchEvent(new Event('change', { bubbles: true }));
            prioridadMarcada.dispatchEvent(new Event('input', { bubbles: true }));
        }

        categorias.forEach((input) => {
            input.dispatchEvent(new Event('change', { bubbles: true }));
            input.dispatchEvent(new Event('input', { bubbles: true }));
        });

        if (typeof window.filtrarPorCategorias === 'function') {
            window.filtrarPorCategorias();
        }

        if (typeof window.filtrarPorPrioridad === 'function') {
            window.filtrarPorPrioridad();
        }

        if (typeof window.anadirFitros === 'function') {
            window.anadirFitros();
        }

        if (typeof window.anadirFiltros === 'function') {
            window.anadirFiltros();
        }

        if (typeof window.actualizarResumenTareas === 'function') {
            window.actualizarResumenTareas();
        }

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    function contarResultadosDesdeTasks(estado) {
        if (!Array.isArray(window.tasks)) return null;

        return window.tasks.filter((task) => {
            const prioridadTask = String(task.priority || task.prioridad || '')
                .toLowerCase()
                .trim();

            const categoriaTask = String(task.category || task.categoria || '')
                .toLowerCase()
                .trim();

            const coincidePrioridad =
                estado.prioridad === 'all' || prioridadTask === estado.prioridad;

            const coincideCategoria =
                estado.categorias.length === 0 || estado.categorias.includes(categoriaTask);

            return coincidePrioridad && coincideCategoria;
        }).length;
    }

    function contarResultadosDesdeDOM() {
        const items = document.querySelectorAll('#listContainer .lista-tareas__item');
        return items.length;
    }

    function actualizarBotonResultados() {
        const estado = leerEstadoActual();
        let total = contarResultadosDesdeTasks(estado);

        if (total === null) {
            total = contarResultadosDesdeDOM();
        }

        const texto = total === 1 ? 'Ver 1 resultado' : `Ver ${total} resultados`;
        btnAplicar.textContent = texto;
    }

    function abrirDrawer() {
        if (!esMovil()) return;

        ultimoElementoActivo = document.activeElement;
        guardarSnapshot();
        actualizarBotonResultados();

        aside.classList.add('is-open');
        backdrop.hidden = false;
        backdrop.classList.add('is-visible');
        document.body.classList.add('filtros-mobile-open');

        btnFiltros.setAttribute('aria-expanded', 'true');
        ocultarBoton();

        closeBtn.focus();
    }

    function cerrarDrawer({ restaurar = false } = {}) {
        if (restaurar) {
            restaurarSnapshot();
        }

        aside.classList.remove('is-open');
        backdrop.classList.remove('is-visible');
        backdrop.hidden = true;
        document.body.classList.remove('filtros-mobile-open');

        btnFiltros.setAttribute('aria-expanded', 'false');
        mostrarBoton();

        if (ultimoElementoActivo && typeof ultimoElementoActivo.focus === 'function') {
            ultimoElementoActivo.focus();
        } else {
            btnFiltros.focus();
        }
    }

    function aplicarCambios() {
        sincronizarAplicacionConInputs();
        cerrarDrawer({ restaurar: false });
    }

    function cancelarCambios() {
        cerrarDrawer({ restaurar: true });
    }

    function toggleDrawer() {
        if (aside.classList.contains('is-open')) {
            cancelarCambios();
        } else {
            abrirDrawer();
        }
    }

    function actualizarModo() {
        if (esMovil()) {
            btnFiltros.hidden = false;
            aside.setAttribute('aria-modal', 'true');
            aside.setAttribute('role', 'dialog');

            if (!aside.classList.contains('is-open')) {
                mostrarBoton();
            }
        } else {
            aside.classList.remove('is-open');
            backdrop.classList.remove('is-visible');
            backdrop.hidden = true;
            document.body.classList.remove('filtros-mobile-open');

            btnFiltros.hidden = true;
            btnFiltros.classList.remove('is-hidden');
            btnFiltros.setAttribute('aria-expanded', 'false');

            aside.removeAttribute('aria-modal');
            aside.removeAttribute('role');
        }
    }

    btnFiltros.addEventListener('click', toggleDrawer);
    closeBtn.addEventListener('click', cancelarCambios);
    btnCancelar.addEventListener('click', cancelarCambios);
    btnAplicar.addEventListener('click', aplicarCambios);
    backdrop.addEventListener('click', cancelarCambios);

    aside.addEventListener('change', () => {
        if (!aside.classList.contains('is-open')) return;
        actualizarBotonResultados();
    });

    aside.addEventListener('input', () => {
        if (!aside.classList.contains('is-open')) return;
        actualizarBotonResultados();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && aside.classList.contains('is-open')) {
            cancelarCambios();
        }
    });

    if (typeof mediaQuery.addEventListener === 'function') {
        mediaQuery.addEventListener('change', actualizarModo);
    } else {
        mediaQuery.addListener(actualizarModo);
    }

    actualizarModo();
    refrescarIconos();
}