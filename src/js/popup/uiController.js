// popup/uiController.js:

/**
 * UIControllerクラスは、ポップアップのUI操作を管理します。
 */
class UIController {
    constructor() {
        this.UIElements = this.getUIElements();
        this.storage = {};  // storageプロパティの初期化
        this.loadStorage();
        this.bindEvents();
    }

    /**
     * ローカルストレージからデータを取得して、storageプロパティに保存
     * @param {Function} callback - 読み込み完了後に実行されるコールバック
     */
    loadStorage(callback) {
        chrome.storage.local.get(['prompt', 'context'], (storageData) => {
            if (chrome.runtime.lastError) {
                console.error('ローカルストレージの読み込みエラー:', chrome.runtime.lastError);
                return;
            }
            this.storage = storageData;  // storageData を this.storage に保存
            console.log('ストレージデータが読み込まれました: ', this.storage);

            if (typeof callback === 'function') {
                callback();  // ストレージ読み込み後にコールバックを実行
            }
        });
    }

    /**
     * プロンプトのセレクトボックスを初期化する
     * @param {Array} prompts - プロンプトの配列
     */
    populatePromptSelectBox(promptOptions) {
        const selectBox = this.UIElements.promptSelectBox;
        selectBox.innerHTML = '';  // セレクトボックスをクリア
        
        if (!promptOptions || promptOptions.length === 0) {
            console.error('プロンプトオプションが存在しません');
            return;
        }
        
        // プロンプトオプションをセレクトボックスに追加
        promptOptions.forEach((prompt, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.text = prompt.title;
            selectBox.appendChild(option);
        });
        
        // 保存されているプロンプトの選択状態を取得
        chrome.storage.local.get('prompt', (storage) => {
            if (storage.prompt && storage.prompt.selected !== undefined) {
                const selectedPromptIndex = storage.prompt.selected;

                // セレクトボックスに選択状態を適用
                if (selectedPromptIndex >= 0 && selectedPromptIndex < selectBox.options.length) {
                    selectBox.selectedIndex = selectedPromptIndex;
                } else {
                    console.warn('保存されたプロンプトインデックスが無効です。デフォルトにリセットします。');
                    selectBox.selectedIndex = 0;  // デフォルトのインデックスを設定
                }
            } else {
                console.warn('保存されたプロンプトの選択情報が見つかりません。デフォルトにリセットします。');
                selectBox.selectedIndex = 0;  // デフォルトのインデックスを設定
            }
        });
    }

    /**
     * セレクトボックスで選択したプロンプトのインデックスを保存
     */
    saveSelectedPrompt() {
        const selectedPromptIndex = this.UIElements.promptSelectBox.selectedIndex;

        // 既存のストレージデータを取得して更新
        chrome.storage.local.get('prompt', (result) => {
            const existingPromptData = result.prompt || DEFAULT_STORAGE.prompt; // 既存のデータがなければデフォルトを使用

            // selected フィールドのみを更新
            const updatedPrompt = {
                ...existingPromptData,  // 他のフィールドを保持
                selected: selectedPromptIndex
            };

            // 選択されたプロンプトをChromeストレージに保存
            chrome.storage.local.set({ prompt: updatedPrompt }, () => {
                console.log('選択されたプロンプトが保存されました:', updatedPrompt);
            });
        });
    }

    bindEvents() {
        // セレクトボックスの変更時に選択状態を保存
        this.UIElements.promptSelectBox.addEventListener('change', () => {
            this.saveSelectedPrompt();
        });

        // 拡大ボタンのイベントをバインド
        this.UIElements.inputText.scaleButton.addEventListener('click', (e) => this.scaleButton(e));
        this.UIElements.resultText.scaleButton.addEventListener('click', (e) => this.scaleButton(e));

        this.UIElements.inputText.clearButton.addEventListener('click', (event) => this.clearText(event));
        this.UIElements.resultText.clearButton.addEventListener('click', (event) => this.clearText(event));

        this.UIElements.settingButton.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/html/options.html' });
        });

        this.UIElements.setApiButton.addEventListener('click', () => {
            chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/html/options.html' });
        });
    }

    /**
     * UI要素を取得する
     * @returns {Object} UI要素のオブジェクト
     */
    getUIElements() {
        return {
            setApiButton: document.getElementById('setApiType'),
            settingButton: document.getElementById('settingsIcon'),
            promptSelectBox: document.getElementById('promptSelectBox'),
            inputText: {
                wordCount: document.getElementById("inputWordCount"),
                textArea: document.getElementById('inputTextArea'),
                scaleButton: document.getElementById('inputScaleButton'),
                copyButton: document.getElementById('copyInputText'),
                clearButton: document.getElementById('clearInputBtn'),
            },
            resultText: {
                wordCount: document.getElementById("resultWordCount"),
                textArea: document.getElementById('resultTextArea'),
                scaleButton: document.getElementById('resultScaleButton'),
                copyButton: document.getElementById('copyResultText'),
                clearButton: document.getElementById('clearResultBtn'),
            },
            promptCopy: document.getElementById('promptCopy'),
            promptInsertButton: document.getElementById('promptInsert'),
            textInsertButton: document.getElementById('textInsert'),
            usePromptCheckBox: document.getElementById('usePromptCheck'),
            fontSelect: document.getElementById('fontSelect'),
            textDLButton: document.getElementById('textDLButton'),
            generateButton: document.getElementById('generateButton'),
            loder: document.getElementById('loader'),
        };
    }


    // UIController.js に textInsert メソッドを追加
    textInsert() {
        const resultText = this.UIElements.resultText.textArea.value;

        // 下段のテキストが空であれば警告
        if (!resultText) {
            console.error('下段のテキストが空です');
            return;
        }

        // 下段のテキストを上段に移動
        this.UIElements.inputText.textArea.value = resultText;
        this.storage.context.input = resultText;

        // 文字数を更新
        this.UIElements.inputText.wordCount.textContent = resultText.length > 0 
            ? resultText.length + ' 文字' 
            : '0 文字';

        // コンテキストを保存
        const context = {
            selected: '',
            input: resultText,
            response: this.storage.context.response,
        };

        cconsole.log(`context: ${context} を保存しました`);
        // ローカルストレージに保存
        chrome.storage.local.set({ context: context }, () => {
            console.log('テキストが上段に移動し、ローカルストレージに保存されました。');
        });
    }

    /**
     * API設定に応じてUIを更新し、生成ボタンの状態を切り替える
     * @param {HTMLElement} setApiButton - API設定のUI要素
     * @param {Object} config - API設定オブジェクト
     */
    setApiType(setApiButton, config) {
        const CLASS_UI_ON = 'api-button-on';
        const CLASS_UI_OFF = 'api-button-off';
        const CLASS_BTN_DISABLED = 'disabled';
        const generateButton = this.UIElements.generateButton;

        // APIタイプが 'server' の場合
        if (config.type === 'server') {
            if (config.server.url) {
                setApiButton.innerHTML = 'URL : *****';
                setApiButton.classList.add(CLASS_UI_ON);
                setApiButton.classList.remove(CLASS_UI_OFF);
                generateButton.classList.remove(CLASS_BTN_DISABLED);
                generateButton.disabled = false;  // ボタンを有効化
            } else {
                setApiButton.innerHTML = 'API Key : ---';
                setApiButton.classList.add(CLASS_UI_OFF);
                setApiButton.classList.remove(CLASS_UI_ON);
                generateButton.classList.add(CLASS_BTN_DISABLED);
                generateButton.disabled = true;  // ボタンを無効化
            }
        }
        // APIタイプが 'gptKey' の場合
        else {
            if (config.gptKey) {
                setApiButton.innerHTML = 'API Key : *****';
                setApiButton.classList.add(CLASS_UI_ON);
                setApiButton.classList.remove(CLASS_UI_OFF);
                generateButton.classList.remove(CLASS_BTN_DISABLED);
                generateButton.disabled = false;  // ボタンを有効化
            } else {
                setApiButton.innerHTML = 'API Key : ---';
                setApiButton.classList.add(CLASS_UI_OFF);
                setApiButton.classList.remove(CLASS_UI_ON);
                generateButton.classList.add(CLASS_BTN_DISABLED);
                generateButton.disabled = true;  // ボタンを無効化
            }
        }
    }

   /**
     * テキストエリア拡大ボタンの処理
     * @param {Event} e - ボタンのクリックイベント
     */
    scaleButton(e) {
        console.log('scaleButton');
        const id = e.target.id;
        const isInput = id.includes('input');
        const textArea = isInput ? this.UIElements.inputText.textArea : this.UIElements.resultText.textArea;

        if (textArea.classList.contains('expanded')) {
            textArea.style.height = '125px';
            e.target.innerHTML = '▼';
            textArea.classList.remove('expanded');
        } else {
            textArea.style.height = '400px';
            e.target.innerHTML = '▲';
            textArea.classList.add('expanded');
            if (!isInput) this.smoothScrollTo(window.innerHeight, 1200);
        }
        if (isInput) this.UIElements.inputText.textArea.focus();
    }

    /**
     * スムーズスクロールを実行する
     * @param {number} targetPosition - 目標位置
     * @param {number} duration - スクロールの時間
     */
    smoothScrollTo(targetPosition, duration) {
        const startPosition = window.pageYOffset;
        const distance = targetPosition - startPosition;
        let startTime = null;

        function animation(currentTime) {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const run = ease(timeElapsed, startPosition, distance, duration);
            window.scrollTo(0, run);
            if (timeElapsed < duration) requestAnimationFrame(animation);
        }

        function ease(t, b, c, d) {
            t /= d / 2;
            if (t < 1) return (c / 2) * t * t + b;
            t--;
            return (-c / 2) * (t * (t - 2) - 1) + b;
        }

        requestAnimationFrame(animation);
    }

    /**
     * テキストエリアのテキストをクリアする処理
     */
    clearText(event) {
        event.preventDefault();
        const INPUT_TEXT = this.UIElements.inputText;
        const RESULT_TEXT = this.UIElements.resultText;
        const targetId = event.target.id;
        const STORAGE_CONTEXT = this.storage.context;
        let context = {};

        if (targetId === 'clearInputBtn') {
            // 入力テキストエリアをクリア
            INPUT_TEXT.textArea.value = '';
            INPUT_TEXT.wordCount.textContent = '0文字'; // 文字数を0にリセット
            context = { selected: '', input: '', response: STORAGE_CONTEXT.response };
            STORAGE_CONTEXT.input = '';
        } else if (targetId === 'clearResultBtn') {
            // 結果テキストエリアをクリア
            RESULT_TEXT.textArea.value = '';
            RESULT_TEXT.wordCount.textContent = '0文字'; // 文字数を0にリセット
            STORAGE_CONTEXT.response = '';
            context = { selected: STORAGE_CONTEXT.selected, input: STORAGE_CONTEXT.input, response: '' };
        }

        // ローカルストレージに変更を保存
        chrome.storage.local.set({ context: context }, () => {
            if (chrome.runtime.lastError) {
                console.error(chrome.runtime.lastError);
            }
        });
    }

    /**
     * 入力テキストを取得する
     * @returns {string} 入力テキスト
     */
    getInputText() {
        return this.UIElements.inputText.textArea.value;
    }

    /**
     * 入力テキストを設定する
     * @param {string} text - 設定するテキスト
     */
    setInputText(text) {
        this.UIElements.inputText.textArea.value = text;
    }

    /**
     * 結果テキストを取得する
     * @returns {string} 結果テキスト
     */
    getResultText() {
        return this.UIElements.resultText.textArea.value;
    }


    /**
     * テキストエリアに文字を代入し、文字数を表示する
     * @param {string} text - テキストエリアに代入するテキスト
     */
    setInputText(text) {
        const inputTextArea = this.UIElements.inputText.textArea;
        inputTextArea.value = text;

        // 文字数をカウントして表示
        this.UIElements.inputText.wordCount.textContent = text && text.length > 0 ? text.length + ' 文字' : '0文字';
    }

    /**
     * テキストエリアに文字を代入し、文字数を表示する
     * @param {string} text - テキストエリアに代入するテキスト
     */
    setResultText(text) {
        const resultTextArea = this.UIElements.resultText.textArea;
        resultTextArea.value = text;

        // 文字数をカウントして表示
        this.UIElements.resultText.wordCount.textContent = text && text.length > 0 ? text.length + ' 文字' : '0文字';
    }

    /**
     * GPTリクエストの結果をストリーミングしつつ文字数を表示する処理
     * @param {Object} self - thisのコンテキスト
     * @param {HTMLTextAreaElement} element - 結果を表示するテキストエリア要素
     * @param {Object} STORAGES - ストレージデータ
     * @param {string} prompt - GPTへのリクエストのプロンプト
     */
    streamGptRequest(self, element, STORAGES, prompt) {
        console.log('stream: ', STORAGES);
        const STORAGE_SERVER = STORAGES.api.server;
        const LOADER_ELME = self.UIElements.loder;
        const generateButton = self.UIElements.generateButton;
        const socket = new WebSocket(STORAGE_SERVER.url2);
        const token = STORAGE_SERVER.token;
        let body = { text: prompt };

        element.value = '';
        socket.addEventListener('open', (event) => {
            if (token) body['authorization'] = `Bearer ${token}`;
            const data = JSON.stringify(body);

            console.log('json: ', data);
            socket.send(data);
        });

        let start = 0;
        socket.addEventListener('message', (event) => {
            if (!start) {
                start = 1;
                self.animationControll(LOADER_ELME, generateButton, 0);
            }
            if (event.data.includes('detail')) {
                const data = JSON.parse(event.data);
                element.value += data.detail;
            } else {
                element.value += event.data;
                self.storage.context.response = element.value;
            }
            // 文字数を更新
            self.UIElements.resultText.wordCount.textContent = element.value.length + ' 文字';
        });

        socket.addEventListener('close', (event) => {
            console.log('Server closed connection:', event);
            self.animationControll(LOADER_ELME, generateButton, 0);
            let charactor = self.UIElements.resultText.wordCount.textContent;
            let containsString = charactor.includes('[ Done ]: ');
            self.UIElements.resultText.wordCount.textContent = (containsString) ? charactor : '[ Done ]: ' + charactor; 
            self.storage.context.response = element.value;
            self.setStorage();
        });

        socket.addEventListener('error', (event) => {
            console.log('Error:', event);
            element.value = `Error: ${event}\n---\n${element.value}`;
            self.animationControll(LOADER_ELME, generateButton, 0);
        });
    }

    /**
     * ストレージをセットする関数
     */
    setStorage() {
        chrome.storage.local.set({ context: this.storage.context }, () => {
            console.log('ストレージにデータが保存されました');
        });
    }
    /**
     * ローディングインジケーターを表示する
     */
    showLoading() {
        const generateButton = this.UIElements.generateButton;
        
        // UI要素が存在するか確認してから操作する
        if (generateButton && generateButton.style) {
            generateButton.style.display = 'none';
        } else {
            console.error('generateButtonが見つかりません');
        }

        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && loadingIndicator.style) {
            loadingIndicator.style.display = 'block';
        } else {
            console.error('loadingIndicatorが見つかりません');
        }
    }


    /**
     * ローディングインジケーターを非表示にする
     */
    hideLoading() {
        const generateButton = this.UIElements.generateButton;

        // UI要素が存在するか確認してから操作する
        if (generateButton && generateButton.style) {
            generateButton.style.display = 'block';
        } else {
            console.error('generateButtonが見つかりません');
        }

        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator && loadingIndicator.style) {
            loadingIndicator.style.display = 'none';
        } else {
            console.error('loadingIndicatorが見つかりません');
        }
    }

    /**
     * 入力テキストをクリップボードにコピーする
     */
    handleCopyInput() {
        const textToCopy = this.getInputText();
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Input text copied to clipboard.');
        }).catch((err) => {
            console.error('Failed to copy input text: ', err);
        });
    }

    /**
     * 結果テキストをクリップボードにコピーする
     */
    handleCopyResult() {
        const textToCopy = this.getResultText();
        navigator.clipboard.writeText(textToCopy).then(() => {
            console.log('Result text copied to clipboard.');
        }).catch((err) => {
            console.error('Failed to copy result text: ', err);
        });
    }
}

export default UIController;
