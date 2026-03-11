(() => {
  document.addEventListener('DOMContentLoaded', () => {
    const mq = window.matchMedia('(max-width: 768px)');
    const topbarRight = document.querySelector('.topbar__right');
    const desktopForm = document.querySelector('.task-form');

    if (!topbarRight || !desktopForm) return;

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
      const mobileTitle = document.getElementById('mobileTaskTitle');
      const mobileCategory = document.getElementById('mobileTaskCategory');
      const mobilePriority = document.getElementById('mobileTaskPriority');

      if (!mobileTitle || !mobileCategory || !mobilePriority) return;

      mobileTitle.value = '';
      mobileCategory.value = defaults.category || 'Trabajo';
      mobilePriority.value = defaults.priority || 'Media';
    }

    function submitMobileTask() {
      const api = window.TaskFlowApp;
      if (!api) return;

      const mobileTitle = document.getElementById('mobileTaskTitle');
      const mobileCategory = document.getElementById('mobileTaskCategory');
      const mobilePriority = document.getElementById('mobileTaskPriority');

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
      openBtn.className = 'btn mobile-add-btn';
      openBtn.setAttribute('aria-haspopup', 'dialog');
      openBtn.setAttribute('aria-controls', 'mobileTaskModal');
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
      dialog.id = 'mobileTaskModal';
      dialog.className = 'task-modal';

      dialog.innerHTML = `
        <div class="task-modal__box">
          <div class="task-modal__head">
            <h2 class="task-modal__title">Nueva tarea</h2>
            <button
              type="button"
              class="task-modal__close"
              aria-label="Cerrar modal"
            >
              ✕
            </button>
          </div>

          <form class="task-modal__form" id="mobileTaskForm" aria-label="Añadir tarea en móvil">
            <div class="form-grid">
              <div>
                <div class="field">
                  <label class="label" for="mobileTaskTitle">Título</label>
                  <input
                    class="input"
                    id="mobileTaskTitle"
                    type="text"
                    placeholder="Ej: Enviar propuesta"
                  />
                </div>

                <div class="form-row">
                  <div class="field">
                    <label class="label" for="mobileTaskCategory">Categoría</label>
                    <select class="select" id="mobileTaskCategory">
                      <option>Trabajo</option>
                      <option>Estudio</option>
                      <option>Personal</option>
                      <option>Salud</option>
                    </select>
                  </div>

                  <div class="field">
                    <label class="label" for="mobileTaskPriority">Prioridad</label>
                    <select class="select" id="mobileTaskPriority">
                      <option>Alta</option>
                      <option selected>Media</option>
                      <option>Baja</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="task-modal__actions">
                <button type="button" class="chip modal-cancel">Cancelar</button>
                <button class="btn btn--primary" type="submit">Añadir tarea</button>
              </div>
            </div>
          </form>
        </div>
      `;

      document.body.appendChild(dialog);

      const closeBtn = dialog.querySelector('.task-modal__close');
      const cancelBtn = dialog.querySelector('.modal-cancel');
      const mobileForm = dialog.querySelector('#mobileTaskForm');
      const modalBox = dialog.querySelector('.task-modal__box');

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
        topbarRight.insertBefore(btn, topbarRight.firstChild);
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
