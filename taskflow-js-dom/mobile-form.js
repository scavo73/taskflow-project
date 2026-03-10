(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const mq = window.matchMedia('(max-width: 768px)');
    const headerRight = document.querySelector('.contenedor__encabezado-derecho');
    const desktopForm = document.querySelector('.form-tarea');

    if (!headerRight || !desktopForm) return;

    let openBtn = null;
    let dialog = null;

    function closeDialog() {
      if (dialog && dialog.open) {
        dialog.close();
      }
    }

    function syncModalFieldsFromDefaults() {
      const api = window.TaskFlowApp;
      if (!api) return;

      const defaults = api.getDesktopDefaults();

      const mobileTitle = document.getElementById('mobileTituloTarea');
      const mobileCategory = document.getElementById('mobileCategoriaTarea');
      const mobilePriority = document.getElementById('mobilePrioridadTarea');

      if (!mobileTitle || !mobileCategory || !mobilePriority) return;

      mobileTitle.value = '';
      mobileCategory.value = defaults.category || 'Trabajo';
      mobilePriority.value = defaults.priority || 'Media';
    }

    function submitMobileTask() {
      const api = window.TaskFlowApp;
      if (!api) {
        console.error('TaskFlowApp no está disponible');
        return;
      }

      const mobileTitle = document.getElementById('mobileTituloTarea');
      const mobileCategory = document.getElementById('mobileCategoriaTarea');
      const mobilePriority = document.getElementById('mobilePrioridadTarea');

      if (!mobileTitle || !mobileCategory || !mobilePriority) return;

      const result = api.addTaskFromData({
        title: mobileTitle.value,
        category: mobileCategory.value,
        priority: mobilePriority.value
      });

      if (!result.ok) {
        mobileTitle.focus();
        return;
      }

      mobileTitle.value = '';
      closeDialog();
    }

    function createMobileButton() {
      if (openBtn) return openBtn;

      openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn-primario btn-nueva-tarea-mobile';
      openBtn.setAttribute('aria-haspopup', 'dialog');
      openBtn.setAttribute('aria-controls', 'modalNuevaTareaMobile');
      openBtn.textContent = 'Añadir tarea';

      openBtn.addEventListener('click', () => {
        if (!dialog) return;
        syncModalFieldsFromDefaults();
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
            <button
              type="button"
              class="modal-tarea-mobile__close"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <form
            class="modal-tarea-mobile__form"
            id="mobileTaskForm"
            aria-label="Añadir tarea en móvil"
          >
            <div class="form">
            <div>
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
              </div>

              <div class="modal-tarea-mobile__actions">
                <button type="button" class="badge modal-cancelar">Cancelar</button>
                <button class="btn-primario" type="submit">
                  Añadir tarea
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
      const modalBox = dialog.querySelector('.modal-tarea-mobile__box');

      closeBtn.addEventListener('click', closeDialog);
      cancelBtn.addEventListener('click', closeDialog);

      dialog.addEventListener('click', (event) => {
        if (!modalBox.contains(event.target)) {
          closeDialog();
        }
      });

      mobileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        submitMobileTask();
      });

      return dialog;
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
})();