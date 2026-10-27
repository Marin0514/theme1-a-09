const recipeToggles = document.querySelectorAll('.recipe-toggle');

recipeToggles.forEach((button) => {
  button.addEventListener('click', () => {
    const targetId = button.dataset.target;
    const panel = document.getElementById(targetId);

    if (!panel) return;

    const isHidden = panel.classList.contains('hidden');

    document.querySelectorAll('.recipe-panel').forEach((item) => {
      item.classList.add('hidden');
    });

    document.querySelectorAll('.recipe-toggle').forEach((item) => {
      item.classList.remove('is-open');
    });

    if (isHidden) {
      panel.classList.remove('hidden');
      button.classList.add('is-open');
    }
  });
});

const injectServingsControls = () => {
  document.querySelectorAll('.recipe-panel').forEach((panel) => {
    if (panel.querySelector('.recipe-header')) return;

    const firstHeading = panel.querySelector('h3');
    if (!firstHeading) return;

    const header = document.createElement('div');
    header.className = 'recipe-header';
    header.innerHTML = `
      <h3>材料</h3>
      <div class="servings-control" data-base-servings="1">
        <span class="servings-label">人数</span>
        <button type="button" class="servings-btn minus" aria-label="人数を減らす">−</button>
        <input type="number" class="servings-input" value="1" min="1" step="1" aria-label="人数を入力" />
        <button type="button" class="servings-btn plus" aria-label="人数を増やす">＋</button>
      </div>
    `;

    panel.insertBefore(header, firstHeading);
    firstHeading.remove();
  });
};

injectServingsControls();

const servingsControls = document.querySelectorAll('.servings-control');

servingsControls.forEach((control) => {
  const input = control.querySelector('.servings-input');
  const minusButton = control.querySelector('.minus');
  const plusButton = control.querySelector('.plus');

  const clampServings = (value) => {
    const min = Number(input.min) || 1;
    const max = Number(input.max) || 99;
    return Math.min(Math.max(value, min), max);
  };

  const updateValue = (nextValue) => {
    const safeValue = clampServings(nextValue);
    input.value = safeValue;
  };

  minusButton.addEventListener('click', () => {
    updateValue(Number(input.value) - 1);
  });

  plusButton.addEventListener('click', () => {
    updateValue(Number(input.value) + 1);
  });

  input.addEventListener('input', () => {
    const nextValue = Number(input.value) || 1;
    updateValue(nextValue);
  });
});
