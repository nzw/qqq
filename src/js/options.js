// options.js

import UIManager from './settings/uiManager.js';
import { bindEvents } from './settings/eventManager.js';

document.addEventListener('DOMContentLoaded', () => {
    const uiManager = new UIManager();

    uiManager.initializeUI();
    bindEvents(uiManager);
});
