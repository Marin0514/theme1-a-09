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

    if (isHidden) {
      panel.classList.remove('hidden');
    }
  });
});
