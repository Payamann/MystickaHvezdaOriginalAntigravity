(function () {
  const state = {
    names: {},
    selectedLetter: 'A'
  };

  function normalize(value) {
    return String(value || '')
      .toLocaleLowerCase('cs-CZ')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value || '';
  }

  function getNameEntries() {
    return Object.entries(state.names).sort(([a], [b]) => a.localeCompare(b, 'cs-CZ'));
  }

  function showName(name) {
    const detail = state.names[name];
    const result = document.getElementById('name-result');
    if (!detail || !result) return;

    setText('res-name', name);
    setText('res-meaning', detail.meaning);
    setText('res-personality', detail.personality);
    setText('res-nameday', detail.nameday);
    setText('res-num', detail.numerology);
    setText('res-aura', detail.aura);
    setText('res-element', detail.element);
    setText('res-love', detail.love);
    setText('res-career', detail.career);

    result.classList.add('is-visible');
  }

  function renderNames(filter = '') {
    const grid = document.getElementById('names-grid');
    if (!grid) return;

    const normalizedFilter = normalize(filter);
    const entries = getNameEntries().filter(([name]) => {
      if (normalizedFilter) return normalize(name).includes(normalizedFilter);
      return name.toLocaleUpperCase('cs-CZ').startsWith(state.selectedLetter);
    });

    grid.textContent = '';
    entries.slice(0, 120).forEach(([name]) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'name-chip';
      button.textContent = name;
      button.addEventListener('click', () => showName(name));
      grid.appendChild(button);
    });
  }

  function renderAlphabet() {
    const alphabet = document.getElementById('alphabet-bar');
    if (!alphabet) return;

    const letters = [...new Set(getNameEntries().map(([name]) => name.charAt(0).toLocaleUpperCase('cs-CZ')))];
    alphabet.textContent = '';

    letters.forEach((letter) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = letter === state.selectedLetter ? 'alphabet-btn active' : 'alphabet-btn';
      button.textContent = letter;
      button.addEventListener('click', () => {
        state.selectedLetter = letter;
        document.querySelectorAll('.alphabet-btn').forEach((item) => item.classList.remove('active'));
        button.classList.add('active');
        renderNames();
      });
      alphabet.appendChild(button);
    });
  }

  function bindSearch() {
    const input = document.getElementById('name-search');
    const button = document.getElementById('btn-search-name');
    if (!input) return;

    const search = () => {
      const query = input.value.trim();
      renderNames(query);

      const exact = getNameEntries().find(([name]) => normalize(name) === normalize(query));
      if (exact) showName(exact[0]);
    };

    input.addEventListener('input', search);
    button?.addEventListener('click', search);
  }

  async function initNames() {
    try {
      const response = await fetch('/data/jmena.json', { credentials: 'same-origin' });
      if (!response.ok) throw new Error('Names data unavailable');

      state.names = await response.json();
      renderAlphabet();
      renderNames();
      bindSearch();
    } catch (error) {
      console.error('[jmena] Nepodarilo se nacist databazi jmen', error);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNames, { once: true });
  } else {
    initNames();
  }
})();
