import UIController from './popup/uiController.js';
import PopupManager from './popup/manager.js';
import { bindEvents } from './popup/events.js';

document.addEventListener('DOMContentLoaded', () => {
    const uiController = new UIController();
    const popupManager = new PopupManager(uiController);

    console.log('uiController: ', uiController);

    // ChromeのストレージからAPI設定情報を取得
    chrome.storage.local.get(['api'], (storageData) => {
        const apiConfig = storageData.api || {};

        // UIControllerのsetApiType関数を呼び出して、API設定に基づいてUIを更新
        const setApiButton = uiController.UIElements.setApiButton;
        uiController.setApiType(setApiButton, apiConfig);
    });

    // 初期化時にストレージからテキストエリアにテキストをロードして文字数を表示
    chrome.storage.local.get(['context'], (storage) => {
        const inputText = storage.context ? storage.context.input : '';
        const resultText = storage.context ? storage.context.response : '';
        uiController.setInputText(inputText);
        uiController.setResultText(resultText);
    });

    // PopupManagerの初期化
    popupManager.initialize();

    // イベントをバインドする
    bindEvents(uiController, popupManager);
});
