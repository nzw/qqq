//contents.js:

/**
 * Chrome拡張機能のハンドラークラス
 */
class ChromeExtensionHandler {
    /**
     * コンストラクタ
     */
    constructor() {
        /**
         * ストレージキーの配列
         * @type {string[]}
         */
        this.STORAGE_KEYS = ['prompt', 'isPopUp', 'prompt', 'context', 'api'];

        /**
         * ストレージのデフォルト値
         * @type {Object}
         */
        this.storage = this.getPromptDefault();

        /**
         * マウスのX座標
         * @type {number}
         */
        this.mouseX = 0;

        /**
         * マウスのY座標
         * @type {number}
         */
        this.mouseY = 0;

        this.getStorage();
        document.addEventListener('selectionchange', this.handleSelectionChange.bind(this));
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        chrome.runtime.onMessage.addListener(this.handleReceivedMessage.bind(this));
    }

    /**
     * ローカルストレージからデータを取得する
     * @param {Function} [callback] - コールバック関数（オプション）
     */
    getStorage(callback) {
        chrome.storage.local.get(this.STORAGE_KEYS, (storageKeys) => {
            Object.assign(this.storage, storageKeys);
            if (callback) callback();
        });
    }

    /**
     * ストレージのデフォルト値を取得する
     * @returns {Object} デフォルトのストレージオブジェクト
     */
    getPromptDefault() {
        return {
            context: { selected: null, input: null, response: null },
            api: { type: 'gptKey', gptKey: null, server: { url: null, method: 'post', url2: '', token: '' } }
        };
    }

    /**
     * 選択内容の変更時に呼び出されるハンドラー
     * @param {Event} event - イベントオブジェクト
     */
    handleSelectionChange(event) {
        console.log('event.target: ', event.target);
        try {
            const selectedText = window.getSelection().toString().trim();
            const storageContext = this.storage.context;

            // 無効なコンテキストかどうかを確認
            if (!chrome.runtime || !chrome.runtime.id) {
                console.warn('Extension context invalidated.');
                return; // コンテキストが無効化されていた場合は終了
            }

            if (selectedText) {
                // メッセージをバックグラウンドに送信する
                try {
                    chrome.runtime.sendMessage({ action: 'notifyUser', text: selectedText }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('Error sending message:', chrome.runtime.lastError);
                        } else {
                            console.log('Message sent successfully:', response);
                        }
                    });
                } catch (error) {
                    console.error('Failed to send message:', error);
                }
            }
            const context = {
                selected: selectedText,
                input: selectedText,
                response: storageContext ? storageContext.response : null
            };

            if (!selectedText) {
                // 選択がない場合の処理（必要に応じて追加）
                return;
            }

            chrome.storage.local.set({ context: context }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error setting storage:', chrome.runtime.lastError);
                } else {
                    try {
                        chrome.runtime.sendMessage({ action: 'notifyUser' }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error('Error sending message:', chrome.runtime.lastError);
                            }
                        });
                    } catch (error) {
                        console.error('Failed to send message:', error);
                    }
                }
            });
        } catch (err) {
            console.error('Error in handleSelectionChange:', err);
        }
    }

    /** 
     * バッジアイコンの通知をリセットする
     */
    clearBadge() {
        try {
            chrome.action.setBadgeText({ text: '' });
        } catch (err) { }
    }

    /**
     * ローカルストレージの指定キーを削除する
     * @param {string} key - 削除するキー
     */
    clearLocalStorage(key) {
        chrome.storage.local.remove(key, () => {
            if (!chrome.runtime.lastError) {
                console.log('Value removed from storage.');
            }
        });
    }

    /**
     * メッセージを受信した際のハンドラー
     * @param {Object} message - 受信したメッセージオブジェクト
     */
    handleReceivedMessage(message) {
        switch (message.action) {
            case 'replaceText':
                console.log(window.getSelection().toString());
                break;
            case 'loadingStart':
                this.showLoadingMessage('re-ai-qqq-gpt-responseLoading', 180000);
                break;
            case 'loadingEnd':
                this.hideLoadingMessage('re-ai-qqq-gpt-responseLoading');
                break;
            case 'tabActiveError':
                this.showMessage('re-ai-qqq-gpt-tabActiveError', 'エラーが発生しました。<br>ブラウザをリロードして再度お試しください。', 10000);
                break;
            case 'connectError':
                this.showMessage('re-ai-qqq-gpt-responseError', 'エラーが発生しました。<br>設定内容を見直すか、時間をおいて再度お試しください。', 10000);
                break;
            case 'SettingValueError':
                this.showMessage('re-ai-qqq-gpt-responseError', 'エラーが発生しました。<br>設定値が取得できませんでした。設定内容を確認してください。', 10000);
                break;
            case 'copyToClipboard':
                this.handleCopyToClipboard(message.text, 10000);
                break;
        }
    }

    /**
     * マウス移動時に呼び出されるハンドラー
     * @param {MouseEvent} event - マウスイベントオブジェクト
     */
    handleMouseMove(event) {
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
    }

    /**
     * クリップボードへのコピーと通知の表示
     * @param {string} responseText - コピーするテキスト
     * @param {number} timer - メッセージ表示時間（ミリ秒）
     */
    handleCopyToClipboard(responseText, timer) {
        const omitText = responseText.length > 55 ? `...(${responseText.length} words)` : "";
        navigator.clipboard.writeText(responseText)
            .then(() => {
                const messageText = `I copied the response🙃<br><p>> ${responseText.slice(0, 55)}${omitText}</p>`;
                this.showMessage('re-ai-qqq-gpt-responseNotification', messageText, timer);
                this.hideLoadingMessage('re-ai-qqq-gpt-responseLoading');
            })
            .catch(() => {
                this.hideLoadingMessage('re-ai-qqq-gpt-responseLoading');
                const messageText = `I can't copy the response🥲<br><p>> ${responseText.slice(0, 55)}${omitText}</p>`;
                this.showMessage('re-ai-qqq-gpt-responseNotificationFail', messageText, timer);
            });
    }

    /**
     * メッセージ通知を表示する
     * @param {string} id - メッセージ要素のID
     * @param {string} message - 表示するメッセージ
     * @param {number} timer - メッセージ表示時間（ミリ秒）
     */
    showMessage(id, message, timer) {
        if (!id) {
            console.error("The 'id' parameter is undefined or null.");
            return;
        }

        if (document.getElementById(id)) return;

        const messageElement = this.createDivWithClass(`re-ai-qqq-gpt-common-message ${id}`);
        messageElement.id = id;
        messageElement.innerHTML = message;
        messageElement.appendChild(this.createCloseButton());

        document.body.appendChild(messageElement);
        this.setFadeOutTimer(messageElement, timer);
    }

    /**
     * クリップボードの内容を取得（未使用）
     */
    handleCopyEvent() {
        setTimeout(() => {
            navigator.clipboard.readText().then(text => {
                this.displayClipboardContent(text);
            });
        }, 100);
    }

    /**
     * クリップボードの内容を表示する
     * @param {string} responseText - クリップボードのテキスト
     */
    displayClipboardContent(responseText) {
        const clipboardDiv = this.createDivWithClass('re-ai-qqq-gpt-clipboard');
        const omitText = responseText.length > 50 ? `...(${responseText.length} words)` : "";
        const copyText = responseText.slice(0, 50);
        clipboardDiv.innerHTML = `I copied the response🙃<br><p>> ${copyText}${omitText}</p>`;
        clipboardDiv.appendChild(this.createCloseButton());
        clipboardDiv.appendChild(this.createGenerateButton());
        document.body.appendChild(clipboardDiv);
    }

    /**
     * 指定されたクラス名を持つdiv要素を作成する
     * @param {string} className - クラス名
     * @returns {HTMLDivElement} 作成されたdiv要素
     */
    createDivWithClass(className) {
        const div = document.createElement('div');
        div.className = className;
        return div;
    }

    /**
     * クローズボタンを作成する
     * @returns {HTMLSpanElement} クローズボタン要素
     */
    createCloseButton() {
        const closeButton = document.createElement('span');
        closeButton.innerHTML = '&times;'; // x
        closeButton.className = 're-ai-qqq-gpt-close-btn';
        closeButton.onclick = () => closeButton.parentElement.remove();
        return closeButton;
    }

    /**
     * 生成ボタンを作成する
     * @returns {HTMLButtonElement} 生成ボタン要素
     */
    createGenerateButton() {
        const generateButton = document.createElement('button');
        generateButton.id = 're-ai-qqq-gpt-generate-btn';
        generateButton.textContent = 'Generate';
        return generateButton;
    }

    /**
     * ローディングメッセージを表示する
     * @param {string} id - メッセージ要素のID
     * @param {number} timer - メッセージ表示時間（ミリ秒）
     */
    showLoadingMessage(id, timer) {
        if (document.getElementById('re-ai-gpt-notification')) return;

        const loadingElement = this.createDivWithClass(id);
        loadingElement.id = id;
        loadingElement.innerHTML = `<div id='re-ai-qqq-gpt-loader'></div>`;
        loadingElement.style.top = `${this.mouseY - 50}px`;
        loadingElement.style.left = `${this.mouseX + 10}px`;

        document.body.appendChild(loadingElement);
        this.setFadeOutTimer(loadingElement, timer);
    }

    /**
     * メッセージをフェードアウトさせて削除する
     * @param {HTMLElement} element - 削除する要素
     * @param {number} timer - 削除までの時間（ミリ秒）
     */
    setFadeOutTimer(element, timer) {
        setTimeout(() => {
            element.className += ' re-ai-qqq-gpt-fadeOut';
        }, timer - 500);
        setTimeout(() => {
            if (document.body.contains(element)) {
                document.body.removeChild(element);
            }
        }, timer);
    }

    /**
     * ローディングメッセージを非表示にする
     * @param {string} id - メッセージ要素のID
     */
    hideLoadingMessage(id) {
        if (!document.getElementById(id)) return;
        const loadingElement = document.getElementById(id);
        if (loadingElement) {
            loadingElement.remove();
        }
    }
}

const chromeExtensionHandler = new ChromeExtensionHandler();

/**
 * GPTのリクエストパラメータを取得する
 * @param {string} token - APIトークン
 * @param {string} prompt - プロンプトテキスト
 * @returns {Object} リクエストオプション
 */
function getGptRequestParam(token, prompt) {
    return {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            'model': 'gpt-4o',
            'messages': [{ "role": "user", "content": prompt }],
            'max_tokens': 4096,
            'temperature': 1,
            'top_p': 1,
            'frequency_penalty': 0.0,
            'presence_penalty': 0.6,
            'stop': [' Human:', ' AI:']
        }),
    };
}

/**
 * テキストを作成する
 * @param {string} text - 入力テキスト
 * @returns {string} 作成されたテキスト
 */
function createText(text) {
    const STORAGE = chromeExtensionHandler.storage;
    const prompt = '上記をよりわかりやすく、そして手順通りに理解できるように修正してください。';

    if (prompt) text += "\n---\n" + prompt;

    const requestText = {
        selected: STORAGE.context.selected,
        input: text,
        response: STORAGE.context.response,
    };
    chromeExtensionHandler.storage.context = requestText;
    chrome.storage.local.set({ context: requestText });
    return text;
}
