export function createPrivacyDisclosure(disclosure) {
  if (!disclosure) return;

  document.addEventListener('pointerdown', (event) => {
    if (disclosure.open && !disclosure.contains(event.target)) {
      disclosure.removeAttribute('open');
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && disclosure.open) {
      disclosure.removeAttribute('open');
      disclosure.querySelector('summary')?.focus();
    }
  });
}
