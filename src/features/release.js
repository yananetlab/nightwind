const MAX_ANIMATED_GRAPHEMES = 76;
const RELEASE_DURATION = 2150;

function splitGraphemes(text) {
  if (typeof Intl.Segmenter !== 'function') return Array.from(text);

  return Array.from(
    new Intl.Segmenter('zh', { granularity: 'grapheme' }).segment(text),
    ({ segment }) => segment,
  );
}

export function createReleaseExperience({ input, button, paper, letters, scene, status }) {
  if (!input || !button || !paper || !letters || !scene || !status) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let releaseTimeout;

  function resizePaper() {
    input.style.height = 'auto';

    const styles = getComputedStyle(input);
    const minimum = Number.parseFloat(styles.minHeight) || 0;
    const maximum = Math.max(minimum, Number.parseFloat(styles.maxHeight) || Number.POSITIVE_INFINITY);
    const contentHeight = input.scrollHeight;

    input.style.height = `${Math.min(Math.max(contentHeight, minimum), maximum)}px`;
    input.style.overflowY = contentHeight > maximum + 1 ? 'auto' : 'hidden';
  }

  function updateButton() {
    button.disabled = input.value.trim().length === 0;
  }

  function clearInput() {
    input.value = '';
    resizePaper();
    updateButton();
  }

  function stopRelease() {
    window.clearTimeout(releaseTimeout);
    releaseTimeout = undefined;
    paper.classList.remove('is-releasing');
    scene.classList.remove('is-blowing');
    letters.replaceChildren();
  }

  function scatterWords(fragmentText) {
    const fragment = splitGraphemes(fragmentText).slice(-MAX_ANIMATED_GRAPHEMES);
    const measure = document.createElement('div');
    const inputStyles = getComputedStyle(input);

    Object.assign(measure.style, {
      position: 'absolute',
      visibility: 'hidden',
      pointerEvents: 'none',
      left: `${input.offsetLeft}px`,
      top: `${input.offsetTop}px`,
      width: `${input.clientWidth}px`,
      font: inputStyles.font,
      lineHeight: inputStyles.lineHeight,
      letterSpacing: inputStyles.letterSpacing,
      whiteSpace: 'pre-wrap',
      overflowWrap: 'anywhere',
    });

    const characters = [];

    fragment.forEach((character) => {
      if (character === '\n') {
        measure.append(document.createTextNode('\n'));
        return;
      }

      const span = document.createElement('span');
      span.textContent = character === '\t' ? '  ' : character;
      measure.append(span);
      if (character.trim()) characters.push(span);
    });

    paper.append(measure);

    const paperRect = paper.getBoundingClientRect();
    const ink = document.createDocumentFragment();

    characters.forEach((character, index) => {
      const rect = character.getBoundingClientRect();
      if (rect.top - paperRect.top > input.offsetTop + input.clientHeight - 7) return;

      const piece = document.createElement('span');
      piece.className = 'wind-letter';
      piece.textContent = character.textContent;
      piece.style.left = `${rect.left - paperRect.left}px`;
      piece.style.top = `${rect.top - paperRect.top}px`;
      piece.style.font = inputStyles.font;
      piece.style.letterSpacing = inputStyles.letterSpacing;
      piece.style.setProperty('--lag', `${(index % 15) * 19 + Math.floor(index / 15) * 24}ms`);
      piece.style.setProperty('--wind-x', `${65 + ((index * 29) % 135)}px`);
      piece.style.setProperty('--wind-y', `${-32 - ((index * 17) % 94)}px`);
      piece.style.setProperty('--spin', `${(index % 2 ? 1 : -1) * (13 + ((index * 7) % 44))}deg`);
      ink.append(piece);
    });

    measure.remove();
    letters.append(ink);
    void letters.offsetHeight;
    paper.classList.add('is-releasing');
  }

  function showStatus(message) {
    status.textContent = message;
    status.classList.add('is-visible');
  }

  function releaseWords() {
    if (!input.value.trim()) return;

    stopRelease();

    const transientInk = reduceMotion.matches ? '' : splitGraphemes(input.value).slice(-110).join('');
    clearInput();
    input.blur();

    if (reduceMotion.matches) {
      showStatus('风带走了这些话。今晚可以轻一点。');
      return;
    }

    scatterWords(transientInk);
    void scene.offsetHeight;
    scene.classList.add('is-blowing');
    showStatus('晚风正轻轻经过……');

    releaseTimeout = window.setTimeout(() => {
      stopRelease();
      showStatus('风带走了这些话。今晚可以轻一点。');
    }, RELEASE_DURATION);
  }

  input.addEventListener('input', () => {
    stopRelease();
    resizePaper();
    updateButton();
    status.classList.remove('is-visible');
  });

  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      releaseWords();
    }
  });

  button.addEventListener('click', releaseWords);
  window.addEventListener('resize', resizePaper);
  window.addEventListener('pagehide', () => {
    stopRelease();
    clearInput();
  });
  window.addEventListener('pageshow', () => {
    stopRelease();
    clearInput();
  });

  clearInput();
}
