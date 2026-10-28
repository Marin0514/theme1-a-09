const recipeToggles = document.querySelectorAll('.recipe-toggle');

const parseNumberToken = (value) => {
  if (!value) return 0;
  if (value.includes('/')) {
    const [numerator, denominator] = value.split('/').map(Number);
    return numerator / denominator;
  }
  return Number(value);
};

const formatScaledValue = (value) => {
  if (Math.abs(value - Math.round(value)) < 1e-9) {
    return String(Math.round(value));
  }

  return Number(value.toFixed(3)).toString();
};

const scaleIngredientText = (text, ratio) => {
  return text.replace(/(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?)(?:〜(\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?))?/g, (match, left, right) => {
    const leftValue = parseNumberToken(left) * ratio;

    if (right !== undefined) {
      const rightValue = parseNumberToken(right) * ratio;
      return `${formatScaledValue(leftValue)}〜${formatScaledValue(rightValue)}`;
    }

    return formatScaledValue(leftValue);
  });
};

const syncIngredientServings = (control) => {
  const panel = control.closest('.recipe-panel');
  if (!panel) return;

  const input = control.querySelector('.servings-input');
  const baseServings = Number(control.dataset.baseServings) || 1;
  const servings = Number(input.value) || 1;
  const ratio = servings / baseServings;

  const ingredientItems = panel.querySelectorAll(':scope > ul > li');
  ingredientItems.forEach((item) => {
    const originalText = item.dataset.originalText || item.textContent.trim();
    item.dataset.originalText = originalText;
    item.textContent = scaleIngredientText(originalText, ratio);
  });
};

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

  document.querySelectorAll('.servings-control').forEach((control) => {
    const ingredientItems = control.closest('.recipe-panel')?.querySelectorAll(':scope > ul > li');
    ingredientItems?.forEach((item) => {
      item.dataset.originalText = item.textContent.trim();
    });

    syncIngredientServings(control);
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
    syncIngredientServings(control);
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
