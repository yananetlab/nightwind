import './styles.css';
import { createPrivacyDisclosure } from './features/privacy.js';
import { createReleaseExperience } from './features/release.js';

createReleaseExperience({
  input: document.querySelector('#thoughts'),
  button: document.querySelector('#release'),
  paper: document.querySelector('#paper'),
  letters: document.querySelector('#wind-letters'),
  scene: document.querySelector('#scene'),
  status: document.querySelector('#status'),
});

createPrivacyDisclosure(document.querySelector('#privacy-disclosure'));
