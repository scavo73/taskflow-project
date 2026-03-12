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

    function renderMobileCategoryOptions(selectedValue = '') {
      const api = window.TaskFlowApp;
      const mobileCategory = document.getElementById('mobileTaskCategory');
      if (!api || !mobileCategory) return;

      const categories = typeof api.getCategories === 'function'
        ? api.getCategories()
        : ['Trabajo', 'Estudio', 'Personal', 'Salud'];

      mobileCategory.innerHTML = categories
        .map((label) => `<option>${label}</option>`)
        .join('');

      const fallback = categories[0] || '';
      mobileCategory.value = categories.includes(selectedValue) ? selectedValue : fallback;
    }

    function updateMobileCategoryFieldMode() {
      const field = document.getElementById('mobileCategoryField');
      const selectRow = document.getElementById('mobileCategorySelectRow');
      const editor = document.getElementById('mobileNewCategoryEditor');
      const trigger = document.getElementById('mobileBtnNewCategory');

      if (!field || !selectRow || !editor || !trigger) return;

      const isEditing = !editor.hidden;
      field.classList.toggle('is-editing', isEditing);
      selectRow.hidden = isEditing;
      trigger.setAttribute('aria-expanded', String(isEditing));
    }

    function openMobileCategoryEditor() {
      const editor = document.getElementById('mobileNewCategoryEditor');
      const input = document.getElementById('mobileNewCategoryInput');

      if (!editor || !input) return;

      editor.hidden = false;
      input.value = '';
      updateMobileCategoryFieldMode();
      input.focus();
    }

    function closeMobileCategoryEditor() {
      const editor = document.getElementById('mobileNewCategoryEditor');
      const input = document.getElementById('mobileNewCategoryInput');

      if (!editor || !input) return;

      editor.hidden = true;
      input.value = '';
      updateMobileCategoryFieldMode();
    }

    function saveMobileCategory() {
      const api = window.TaskFlowApp;
      const input = document.getElementById('mobileNewCategoryInput');
      const mobileCategory = document.getElementById('mobileTaskCategory');
      if (!api || !input || !mobileCategory) return;

      const result = api.addCategory(input.value);

      if (!result.ok) {
        if (result.error === 'duplicate') {
          alert('Esa categoría ya existe.');
        } else {
          alert('Escribe un nombre de categoría válido.');
        }

        input.focus();
        return;
      }

      renderMobileCategoryOptions(result.category);
      mobileCategory.value = result.category;
      closeMobileCategoryEditor();
    }

    function syncModalFieldsFromDefaults() {
      const api = window.TaskFlowApp;
      if (!api) return;

      const defaults = api.getDesktopDefaults();
      const mobileTitle = document.getElementById('mobileTaskTitle');
      const mobilePriority = document.getElementById('mobileTaskPriority');

      if (!mobileTitle || !mobilePriority) return;

      mobileTitle.value = '';
      renderMobileCategoryOptions(defaults.category || '');
      mobilePriority.value = defaults.priority || 'Media';
      closeMobileCategoryEditor();
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

                    <div class="category-field" id="mobileCategoryField">
                      <div class="category-field__row" id="mobileCategorySelectRow">
                        <select class="select category-field__select" id="mobileTaskCategory"></select>

                        <button
                          type="button"
                          class="chip category-field__trigger"
                          id="mobileBtnNewCategory"
                          aria-expanded="false"
                          aria-controls="mobileNewCategoryEditor"
                        >
                          Nueva
                        </button>
                      </div>

                      <div class="category-field__edit" id="mobileNewCategoryEditor" hidden>
                        <input
                          class="input category-field__input"
                          id="mobileNewCategoryInput"
                          type="text"
                          placeholder="Nombre de categoría"
                        />

                        <div class="category-field__actions">
                          <button
                            type="button"
                            class="chip category-action category-action--save"
                            id="mobileBtnSaveNewCategory"
                          >
                            <i data-lucide="check" aria-hidden="true"></i>
                            <span>Guardar</span>
                          </button>

                          <button
                            type="button"
                            class="chip category-action"
                            id="mobileBtnCancelNewCategory"
                          >
                            <i data-lucide="x" aria-hidden="true"></i>
                            <span>Cancelar</span>
                          </button>
                        </div>
                      </div>
                    </div>
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

      dialog.querySelector('#mobileBtnNewCategory')?.addEventListener('click', openMobileCategoryEditor);
      dialog.querySelector('#mobileBtnCancelNewCategory')?.addEventListener('click', closeMobileCategoryEditor);
      dialog.querySelector('#mobileBtnSaveNewCategory')?.addEventListener('click', saveMobileCategory);
      dialog.querySelector('#mobileNewCategoryInput')?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          saveMobileCategory();
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          closeMobileCategoryEditor();
        }
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
