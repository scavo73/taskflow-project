document.addEventListener('DOMContentLoaded', () => {
    const mq = window.matchMedia('(max-width: 768px)');

    const headerRight = document.querySelector('.contenedor__encabezado-derecho');
    const desktopForm = document.querySelector('.tarea.tarea-nueva');

    if (!headerRight || !desktopForm) return;

    let openBtn = null;
    let dialog = null;

    function createMobileButton() {
        if (openBtn) return openBtn;

        openBtn = document.createElement('button');
        openBtn.type = 'button';
        openBtn.className = 'btn btn-nueva-tarea-mobile';
        openBtn.setAttribute('aria-haspopup', 'dialog');
        openBtn.setAttribute('aria-controls', 'modalNuevaTareaMobile');
        openBtn.innerHTML = `
    Andir tarea
`;

        openBtn.addEventListener('click', () => {
            if (!dialog) return;
            syncModalFieldsFromDesktopDefaults();
            dialog.showModal();
        });

        return openBtn;
    }

    function createMobileDialog() {
        if (dialog) return dialog;

        dialog = document.createElement('dialog');
        dialog.id = 'modalNuevaTareaMobile';
        dialog.className = 'modal-tarea-mobile';

        dialog.innerHTML = `
      <div class="modal-tarea-mobile__box">
        <div class="modal-tarea-mobile__header">
          <h2 class="modal-tarea-mobile__title">Nueva tarea</h2>
          <button type="button" class="modal-tarea-mobile__close" aria-label="Cerrar modal">✕</button>
        </div>

        <form class="modal-tarea-mobile__form" id="mobileTaskForm" aria-label="Añadir tarea en móvil">
          <div class="form">
            <div class="form-campo">
              <label class="form-campo__etiqueta" for="mobileTituloTarea">Título</label>
              <input
                class="form-campo__control"
                id="mobileTituloTarea"
                type="text"
                placeholder="Ej: Enviar propuesta"
              />
            </div>

            <div class="form-fila-formulario">
              <div class="form-campo">
                <label class="form-campo__etiqueta" for="mobileCategoriaTarea">Categoría</label>
                <select class="form-campo__control" id="mobileCategoriaTarea">
                  <option>Trabajo</option>
                  <option>Estudio</option>
                  <option>Personal</option>
                  <option>Salud</option>
                </select>
              </div>

              <div class="form-campo">
                <label class="form-campo__etiqueta" for="mobilePrioridadTarea">Prioridad</label>
                <select class="form-campo__control" id="mobilePrioridadTarea">
                  <option>Alta</option>
                  <option selected>Media</option>
                  <option>Baja</option>
                </select>
              </div>
            </div>

            <div class="modal-tarea-mobile__actions">
              <button type="button" class="badge modal-cancelar">Cancelar</button>
                   <button class="btn" onclick="addTask()" type="submit">
                            <strong>Añadir Tarea</strong>
                            <div id="container-stars">
                                <div id="stars"></div>
                            </div>
                            <div id="glow">
                                <div class="circle"></div>
                                <div class="circle"></div>
                            </div>
                        </button>
            </div>
          </div>
        </form>
      </div>
    `;

        document.body.appendChild(dialog);

        const closeBtn = dialog.querySelector('.modal-tarea-mobile__close');
        const cancelBtn = dialog.querySelector('.modal-cancelar');
        const mobileForm = dialog.querySelector('#mobileTaskForm');

        closeBtn.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);

        dialog.addEventListener('click', (e) => {
            const box = dialog.querySelector('.modal-tarea-mobile__box');
            const rect = box.getBoundingClientRect();
            const isInBox =
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom;

            if (!isInBox) closeDialog();
        });

        mobileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submitMobileTask();
        });

        return dialog;
    }

    function closeDialog() {
        if (dialog && dialog.open) {
            dialog.close();
        }
    }

    function syncModalFieldsFromDesktopDefaults() {
        const desktopTitle = document.getElementById('tituloTarea');
        const desktopCategory = document.getElementById('categoria-tarea');
        const desktopPriority = document.getElementById('prioridad-tarea');

        const mobileTitle = document.getElementById('mobileTituloTarea');
        const mobileCategory = document.getElementById('mobileCategoriaTarea');
        const mobilePriority = document.getElementById('mobilePrioridadTarea');

        if (!mobileTitle || !mobileCategory || !mobilePriority) return;

        mobileTitle.value = '';
        mobileCategory.value = desktopCategory ? desktopCategory.value : 'Trabajo';
        mobilePriority.value = desktopPriority ? desktopPriority.value : 'Media';
    }

    function submitMobileTask() {
        const desktopTitle = document.getElementById('tituloTarea');
        const desktopCategory = document.getElementById('categoria-tarea');
        const desktopPriority = document.getElementById('prioridad-tarea');

        const mobileTitle = document.getElementById('mobileTituloTarea');
        const mobileCategory = document.getElementById('mobileCategoriaTarea');
        const mobilePriority = document.getElementById('mobilePrioridadTarea');

        if (!desktopTitle || !desktopCategory || !desktopPriority) return;
        if (!mobileTitle || !mobileCategory || !mobilePriority) return;

        const title = mobileTitle.value.trim();
        if (!title) {
            mobileTitle.focus();
            return;
        }

        desktopTitle.value = title;
        desktopCategory.value = mobileCategory.value;
        desktopPriority.value = mobilePriority.value;

        if (typeof window.addTask === 'function') {
            window.addTask();
        } else {
            console.error('addTask() no está disponible en window');
        }

        mobileTitle.value = '';
        closeDialog();
    }

    function enableMobileMode() {
        createMobileDialog();

        if (!openBtn) {
            const btn = createMobileButton();
            headerRight.insertBefore(btn, headerRight.firstChild);
        }

        desktopForm.style.display = 'none';
    }

    function enableDesktopMode() {
        if (openBtn) {
            openBtn.remove();
            openBtn = null;
        }

        if (dialog && dialog.open) {
            dialog.close();
        }

        desktopForm.style.display = '';
    }

    function applyMode() {
        if (mq.matches) {
            enableMobileMode();
        } else {
            enableDesktopMode();
        }
    }

    applyMode();

    if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', applyMode);
    } else {
        mq.addListener(applyMode);
    }
});