// uiManager.js

import { getStorage, setStorage } from './storageManager.js';
import { showMessage } from './messageManager.js';

const STORAGE_KEYS = ['prompt', 'context', 'api'];
const DEFAULT_STORAGE = {
    context: { selected: null, input: null, response: null },
    prompt: {
        type: [
            {title: "-", text: "-", enabled: 1},
            {title: "英語翻訳", text: "下記の文章を英語に翻訳してください。", enabled: 1},
            {title: "日本語翻訳", text: "下記の文章を日本語に翻訳してください。", enabled: 1},
            {title: "要約", text: "下記の文章を提供された情報を、短く明確に伝えることが目的です。修正お願いします。", enabled: 1},
            {title: "GPTに質問", text: "下記の文章の意味が理解できません。要求事項を指定しながら明確な説明をお願いします。", enabled: 1},
            {title: "文章の指摘", text: "もし下記の文章内にエラーや間違いがあれば、それらを修正するために教えてください。", enabled: 1},
        ],
        selected: ['prompt1'],
        setPrompt: true,
    },
    api: { type: 'gptKey', gptKey: null, server: { url: null, method: 'post', url2: '', token: '' } }
};

/**
 * UIマネージャークラス
 */
class UIManager {
    constructor() {
        this.maxHeaders = 1;
        this.UIElements = this.getUIElements();
        this.storage = this.getDefaultStorage();
    }

    /**
     * UI要素を取得する
     * @returns {Object} - UI要素のオブジェクト
     */
    getUIElements() {
        return {
            gptKeyInput: document.getElementById('gptKey'),
            methodSelect: document.getElementById('methodSelect'),
            methodSelect2: document.getElementById('methodSelect2'),
            urlInput: document.getElementById('urlInput'),
            urlInput2: document.getElementById('urlInput2'),
            headersContainer: document.getElementById('headersContainer'),
            addHeaderBtn: document.getElementById('addHeaderBtn'),
            removeHeaderBtn: document.getElementById('removeHeaderBtn'),
            form: document.getElementById('settingsForm'),
            saveBtn: document.getElementById('saveBtn'),
            saveBtn2: document.getElementById('saveBtn2')
        };
    }

    /**
     * デフォルトのストレージ設定を取得する
     * @returns {Object} デフォルトのストレージ設定
     */
    getDefaultStorage() {
        return DEFAULT_STORAGE;
    }

    /**
     * ストレージからデータを取得し、UIを初期化する
     */
    initializeUI() {
        getStorage(STORAGE_KEYS, (storageKeys) => {
            Object.assign(this.storage, storageKeys);
            this.initializeApiControls();
            this.initializePromptControls();
            this.updateUI();
            this.updateHeaderButtons();
        });
    }

    /**
     * イベントリスナーをバインドする
     */
    bindEvents() {
        this.UIElements.gptKeyInput.addEventListener('input', this.validateInputs.bind(this));
        this.UIElements.urlInput.addEventListener('input', this.validateInputs.bind(this));
        this.UIElements.urlInput2.addEventListener('input', this.validateInputs.bind(this));
        this.UIElements.addHeaderBtn.addEventListener('click', this.addHeader.bind(this));
        this.UIElements.removeHeaderBtn.addEventListener('click', this.removeHeader.bind(this));
        this.UIElements.saveBtn.addEventListener('click', this.saveSettings.bind(this));
        this.UIElements.saveBtn2.addEventListener('click', this.saveSettings.bind(this));

        document.querySelectorAll('input[name="settingType"]').forEach((input) => {
            input.addEventListener('change', () => {
                this.updateUI();
                this.validateInputs();
            });
        });
    }

    /**
     * API関連のUIコントロールを初期化する
     */
    initializeApiControls() {
        const API_CONFIG = this.storage.api;
        if (API_CONFIG.type) {
            this.UIElements.form.settingType.value = API_CONFIG.type;
        }
        this.UIElements.gptKeyInput.value = API_CONFIG.gptKey || '';
        this.UIElements.urlInput.value = API_CONFIG.server.url || '';
        this.UIElements.urlInput2.value = API_CONFIG.server.url2 || '';
        this.UIElements.methodSelect.value = API_CONFIG.server.method || '';
        this.UIElements.methodSelect2.value = 'stream';
        if (API_CONFIG.server.token) {
            this.addHeaderWithToken(API_CONFIG.server.token);
        }
        this.updateHeaderButtons();
    }

    /**
     * プロンプト関連のUIコントロールを初期化する
     */
    initializePromptControls() {
        this.UIElements.gptKeyInput.focus();
        const PROMPTS_CONFIG = this.storage.prompt.type;
        let prompts = document.querySelectorAll(".prompt");
        prompts.forEach((prompt, index) => {
            let checkbox = prompt.querySelector("input[type='checkbox']");
            let textInput = prompt.querySelector("input[type='text']");
            let textarea = prompt.querySelector("textarea");

            const number = Number(prompt.id.replace("prompt", ""));
            const currentPromptConfig = PROMPTS_CONFIG[number - 1];

            if (currentPromptConfig) {
                checkbox.checked = currentPromptConfig.enabled === 1;
                textInput.value = currentPromptConfig.title;
                textarea.value = currentPromptConfig.text;
            }
            this.toggleInputState(checkbox, textInput, textarea);

            checkbox.addEventListener("change", () => {
                this.toggleInputState(checkbox, textInput, textarea);
            });
        });
    }

    /**
     * 入力フォームの状態を更新する
     */
    updateUI() {
        const isAPIKeySelected = document.querySelector('input[name="settingType"]:checked').value === 'gptKey';
        this.UIElements.gptKeyInput.disabled = !isAPIKeySelected;
        this.UIElements.urlInput.disabled = isAPIKeySelected;
        this.UIElements.urlInput2.disabled = isAPIKeySelected;
        this.UIElements.methodSelect.disabled = isAPIKeySelected;
        this.UIElements.methodSelect2.disabled = isAPIKeySelected;
        this.UIElements.headersContainer.style.display = isAPIKeySelected ? 'none' : 'block';
        document.getElementById('headerControls').style.display = 'block';
    }

    /**
     * 入力内容の検証を行う
     */
    validateInputs() {
        const isAPIKeySelected = document.querySelector('input[name="settingType"]:checked').value === 'gptKey';
        if (isAPIKeySelected) {
            this.clearInputBorders();
        } else {
            this.validateUrlInputs();
        }
    }

    /**
     * ヘッダー追加/削除ボタンの状態を更新する
     */
    updateHeaderButtons() {
        this.UIElements.removeHeaderBtn.disabled = this.UIElements.headersContainer.children.length === 0;
        this.UIElements.addHeaderBtn.disabled = this.UIElements.headersContainer.children.length >= this.maxHeaders;
    }

    /**
     * ヘッダーを追加する
     */
    addHeader() {
        if (this.UIElements.headersContainer.children.length < this.maxHeaders) {
            this.addHeaderWithToken('');
        }
    }

    /**
     * ヘッダーを削除する
     */
    removeHeader() {
        if (this.UIElements.headersContainer.children.length > 0) {
            this.UIElements.headersContainer.innerHTML = '';
            this.updateHeaderButtons();
            this.storage.api.server.token = '';
        }
    }

    /**
     * 設定を保存する
     * @param {Event} e - イベントオブジェクト
     */
    saveSettings(e) {
        e.preventDefault();

        const selectedType = this.UIElements.form.settingType.value;
        const methodSelect = this.UIElements.methodSelect;
        const selectBox = methodSelect ? methodSelect.options[methodSelect.selectedIndex].value : 'none';
        const headers = Array.from(document.querySelectorAll(".header-text")).map(input => input.value);

        const promptList = Array.from(document.querySelectorAll(".prompt")).map(div => {
            const number = div.id.replace("prompt", "");
            return {
                enabled: div.querySelector("input[type='checkbox']").checked ? 1 : 0,
                title: div.querySelector("input[type='text']").value,
                text: div.querySelector("textarea").value
            };
        });

        const dataToSave = {
            api: {
                type: selectedType,
                gptKey: this.UIElements.gptKeyInput.value,
                server: {
                    url: this.UIElements.urlInput.value,
                    url2: this.UIElements.urlInput2.value,
                    method: selectBox,
                    token: headers[0] || ''
                }
            },
            prompt: { type: promptList, selected: this.storage.prompt.selected }
        };

        setStorage(dataToSave, () => {
            showMessage('re-ai-saveSuccess', 'Save OK👍', 3000);
        });
    }

    /**
     * ヘッダーにBearerトークンを追加する
     * @param {string} token - Bearerトークン
     */
    addHeaderWithToken(token) {
        const headersContainer = this.UIElements.headersContainer;

        const passwordContainer = document.createElement('div');
        passwordContainer.classList.add('password-container');

        const headerInput = document.createElement('input');
        headerInput.type = 'password';
        headerInput.value = token;
        headerInput.classList.add('header-text');
        headerInput.placeholder = "Bearer Token キーを設定してください";
        headerInput.addEventListener('input', this.validateInputs.bind(this));
        passwordContainer.appendChild(headerInput);

        const eyeIcon = document.createElement('span');
        eyeIcon.classList.add('eye-icon');
        eyeIcon.textContent = '👁️';
        eyeIcon.addEventListener('click', () => {
            if (headerInput.getAttribute('type') === 'password') {
                headerInput.setAttribute('type', 'text');
                eyeIcon.textContent = '🙈';
            } else {
                headerInput.setAttribute('type', 'password');
                eyeIcon.textContent = '👁️';
            }
        });
        passwordContainer.appendChild(eyeIcon);

        headersContainer.appendChild(passwordContainer);
        this.updateHeaderButtons();
    }

    /**
     * 入力欄の境界線の色をクリアする
     */
    clearInputBorders() {
        this.UIElements.urlInput.style.borderColor = '';
        this.UIElements.urlInput2.style.borderColor = '';
        this.UIElements.headersContainer.style.borderColor = '';
    }

    /**
     * URL入力欄を検証する
     */
    validateUrlInputs() {
        const urlIsValid = this.UIElements.urlInput.value.startsWith('http://') || this.UIElements.urlInput.value.startsWith('https://');
        const urlIsValid2 = this.UIElements.urlInput2.value.startsWith('ws://') || this.UIElements.urlInput2.value.startsWith('wss://');
        this.UIElements.urlInput.style.borderColor = urlIsValid ? '' : 'red';
        this.UIElements.urlInput2.style.borderColor = urlIsValid2 ? '' : 'red';
    }

    /**
     * 入力状態を切り替える
     * @param {HTMLElement} checkbox - チェックボックス
     * @param {string} promptDivId - プロンプト要素のID
     * @param {HTMLElement} textInput - テキスト入力
     * @param {HTMLElement} textarea - テキストエリア
     */
    toggleInputState(checkbox, promptDivId, textInput, textarea) {
        // textInputとtextareaが存在するか確認
        if (!textInput || !textarea) {
            console.error("Text input or textarea is missing in the DOM.");
            return;
        }

        // 特定のIDが 'prompt1' である場合は、必ず 'disabled-input' クラスを付与
        if (promptDivId === 'prompt1') {
            textInput.disabled = true;
            textarea.disabled = true;
            textInput.classList.add('disabled-input');
            textarea.classList.add('disabled-input');
        } else if (checkbox.checked) {
            textInput.disabled = false;
            textarea.disabled = false;
            textInput.classList.remove('disabled-input');
            textarea.classList.remove('disabled-input');
        } else {
            textInput.disabled = true;
            textarea.disabled = true;
            textInput.classList.add('disabled-input');
            textarea.classList.add('disabled-input');
        }
    }
}

export default UIManager;
