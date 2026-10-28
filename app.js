const recipeToggles = document.querySelectorAll('.recipe-toggle');
const ingredientSearchInput = document.getElementById('ingredient-search');
const searchStatus = document.getElementById('search-status');
const ingredientSearchSuggestions = document.getElementById('ingredient-search-suggestions');

const japaneseSearchAliases = {
  'たまねぎ': ['玉ねぎ', 'タマネギ', 'たまねぎ'],
  'ごぼう': ['ごぼう', 'ゴボウ'],
  'にんじん': ['にんじん', 'ニンジン'],
  'ほうれんそう': ['ほうれん草', 'ホウレンソウ', 'ほうれんそう'],
  'ちくわ': ['ちくわ', 'チクワ'],
  'かぼちゃ': ['かぼちゃ', 'カボチャ'],
  'こまつな': ['小松菜', 'コマツナ', 'こまつな'],
  'あぶらあげ': ['油揚げ', 'アブラアゲ', 'あぶらあげ'],
  'とりももにく': ['鶏もも肉', 'トリモモニク', 'とりももにく'],
  'とりひきにく': ['鶏ひき肉', 'トリヒキニク', 'とりひきにく'],
  'ぶたにく': ['豚肉', 'ブタニク', 'ぶたにく'],
  'しょうゆ': ['醤油', 'ショクヨウ', 'しょうゆ'],
  'みりん': ['みりん', 'ミリン'],
  'しょうが': ['生姜', 'ショウガ', 'しょうが'],
  'えび': ['エビ', 'えび'],
  'はむ': ['ハム', 'はむ'],
  'だし': ['だし', 'ダシ'],
  'こしょう': ['こしょう', 'コショウ'],
  'さけ': ['鮭', 'サケ', 'さけ'],
  'さば': ['鯖', 'サバ', 'さば'],
  'あじ': ['鯵', 'アジ', 'あじ'],
  'たまご': ['卵', 'タマゴ', 'たまご'],
};

const kanjiToHiraganaMap = {
  '玉ねぎ': 'たまねぎ',
  'タマネギ': 'たまねぎ',
  '玉葱': 'たまねぎ',
  '卵': 'たまご',
  'タマゴ': 'たまご',
  '生姜': 'しょうが',
  'ショウガ': 'しょうが',
  '鶏もも肉': 'とりももにく',
  'トリモモニク': 'とりももにく',
  '鶏ひき肉': 'とりひきにく',
  'トリヒキニク': 'とりひきにく',
  '豚肉': 'ぶたにく',
  'ブタニク': 'ぶたにく',
  '醤油': 'しょうゆ',
  'ショクヨウ': 'しょうゆ',
  'ごぼう': 'ごぼう',
  'ゴボウ': 'ごぼう',
  'にんじん': 'にんじん',
  'ニンジン': 'にんじん',
  'ほうれん草': 'ほうれんそう',
  'ホウレンソウ': 'ほうれんそう',
  '小松菜': 'こまつな',
  'コマツナ': 'こまつな',
  '油揚げ': 'あぶらあげ',
  'アブラアゲ': 'あぶらあげ',
  '鮭': 'さけ',
  'サケ': 'さけ',
  '鯖': 'さば',
  'サバ': 'さば',
  '鯵': 'あじ',
  'アジ': 'あじ',
  'エビ': 'えび',
  'ハム': 'はむ',
  '片栗粉': 'かたくりこ',
  'じゃがいも': 'じゃがいも',
  'きゅうり': 'きゅうり',
};

const clearSearchState = () => {
  recipeToggles.forEach((toggle) => {
    toggle.style.display = '';
  });

  document.querySelectorAll('.recipe-panel').forEach((panel) => {
    panel.classList.add('hidden');
  });

  if (searchStatus) {
    searchStatus.textContent = '';
    searchStatus.classList.add('hidden');
  }

  if (ingredientSearchSuggestions) {
    ingredientSearchSuggestions.innerHTML = '';
    ingredientSearchSuggestions.classList.add('hidden');
  }
};

const normalizeJapaneseText = (value = '') => {
  let text = String(value).normalize('NFKC');

  Object.entries(kanjiToHiraganaMap).forEach(([source, target]) => {
    text = text.split(source).join(target);
  });

  text = text
    .replace(/[ァ-ヶ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60))
    .replace(/ー/g, '')
    .replace(/\s+/g, '')
    .replace(/[、。！？]/g, '')
    .toLowerCase();

  return text;
};

const getSearchVariants = (value = '') => {
  const normalized = normalizeJapaneseText(value);
  const variants = new Set([normalized]);

  Object.entries(japaneseSearchAliases).forEach(([canonical, aliases]) => {
    const normalizedCanonical = normalizeJapaneseText(canonical);
    const normalizedAliases = aliases.map((alias) => normalizeJapaneseText(alias));

    const shouldAdd =
      normalized.includes(normalizedCanonical) ||
      normalizedAliases.some((alias) => normalized.includes(alias));

    if (shouldAdd) {
      variants.add(normalizedCanonical);
      normalizedAliases.forEach((alias) => variants.add(alias));
    }
  });

  return [...variants].filter((variant) => variant.length > 0);
};

const getMaterialCandidates = () => {
  const candidates = new Set();

  document.querySelectorAll('.recipe-panel').forEach((panel) => {
    const materials = panel.querySelectorAll(':scope > ul > li');
    materials.forEach((item) => {
      const text = item.textContent.trim();
      const materialName = text.split('：')[0].trim();
      if (materialName) {
        candidates.add(materialName);
      }
    });
  });

  return [...candidates];
};

const materialCandidates = getMaterialCandidates();

const panelMaterialTerms = (panel) => {
  return Array.from(panel.querySelectorAll(':scope > ul > li'))
    .map((item) => item.textContent.trim().split('：')[0].trim())
    .filter(Boolean);
};

const renderSuggestions = (query) => {
  if (!ingredientSearchSuggestions) return;

  const normalizedQuery = normalizeJapaneseText(query);

  if (!normalizedQuery) {
    ingredientSearchSuggestions.innerHTML = '';
    ingredientSearchSuggestions.classList.add('hidden');
    return;
  }

  const suggestions = materialCandidates
    .filter((candidate) => {
      const normalizedCandidate = normalizeJapaneseText(candidate);
      const candidateVariants = getSearchVariants(normalizedCandidate);
      return candidateVariants.some((variant) => variant.includes(normalizedQuery));
    })
    .slice(0, 8);

  if (!suggestions.length) {
    ingredientSearchSuggestions.innerHTML = '';
    ingredientSearchSuggestions.classList.add('hidden');
    return;
  }

  ingredientSearchSuggestions.classList.remove('hidden');
  ingredientSearchSuggestions.innerHTML = suggestions
    .map((suggestion) => `<button type="button" class="suggestion-item">${suggestion}</button>`)
    .join('');

  ingredientSearchSuggestions.querySelectorAll('.suggestion-item').forEach((button) => {
    button.addEventListener('click', () => {
      ingredientSearchInput.value = button.textContent.trim();
      ingredientSearchSuggestions.innerHTML = '';
      ingredientSearchSuggestions.classList.add('hidden');
      updateIngredientSearch();
    });
  });
};

const matchesIngredientSearch = (panel, searchQuery) => {
  const normalizedQuery = normalizeJapaneseText(searchQuery);
  if (!normalizedQuery) {
    return false;
  }

  const terms = panelMaterialTerms(panel).map((term) => normalizeJapaneseText(term));

  return terms.some((term) => {
    const variants = getSearchVariants(term);
    return variants.some((variant) => variant.includes(normalizedQuery));
  });
};

const updateIngredientSearch = () => {
  if (!ingredientSearchInput) return;

  const query = ingredientSearchInput.value.trim();
  renderSuggestions(query);

  if (!query) {
    clearSearchState();
    return;
  }

  let matchCount = 0;

  recipeToggles.forEach((toggle) => {
    const targetId = toggle.dataset.target;
    const panel = document.getElementById(targetId);

    if (!panel) {
      toggle.style.display = 'none';
      return;
    }

    const hasMatch = matchesIngredientSearch(panel, query);

    toggle.style.display = hasMatch ? '' : 'none';
    panel.classList.toggle('hidden', !hasMatch);

    if (hasMatch) {
      matchCount += 1;
    }
  });

  if (searchStatus) {
    if (matchCount === 0) {
      searchStatus.textContent = 'ヒットしませんでした';
    } else {
      searchStatus.textContent = `${matchCount}件ヒットしました`;
    }
    searchStatus.classList.remove('hidden');
  }
};

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

if (ingredientSearchInput) {
  ingredientSearchInput.addEventListener('input', () => {
    updateIngredientSearch();
  });
}
