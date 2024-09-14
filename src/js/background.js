// background.js

'use strict';

/**
 * @constant {Array<string>} STORAGE_KEYS - ローカルストレージから取得するキーの配列
 */
const STORAGE_KEYS = ['prompt', 'context', 'api'];

/**
 * @constant {Object} DEFAULT_STORAGE - デフォルトのストレージ設定
 */
const DEFAULT_STORAGE = {
    menuTitle: {
        'QuickProofreadMenu': {
            title: '校正依頼',
            prompt: '下記をよりわかりやすく、そして手順通りに理解できるように修正してください。',
            contexts: ["selection", "editable"]
        },
        'QuickSummaryMenu': {
            title: '要約依頼',
            prompt: '下記の主要なポイントを簡潔にまとめて、全体の意味を短い文章で表現してください。',
            contexts: ["selection", "editable"]
        },
        'QuickQuestionMenu': {
            title: 'AIに質問',
            prompt: '下記の意味がわからないため、簡潔にわかりやすく教えてください。',
            contexts: ["selection", "editable"]
        },
    },
    context: { selected: null, input: null, response: null },
    api: {
        type: 'gptKey',
        gptKey: null,
        server: { url: null, method: 'post', url2: '', token: '' }
    }
};

/**
 * 拡張機能の設定を管理するクラス
 */
class ExtensionSettings {
    /**
     * コンストラクタ
     */
    constructor() {
        this.storage = this.getDefaultStorage();
        this.getStorage()
            .then(() => this.setStorage())
            //.then(() => this.updateContextMenuTitle())
            .catch(error => {
                console.error('エラーが発生しました: ', error);
            });
    }

    /**
     * デフォルトのストレージ設定を取得する
     * @returns {Object} デフォルトのストレージ設定
     */
    getDefaultStorage() {
        return DEFAULT_STORAGE;
    }

    /**
     * ローカルストレージからデータを取得する
     * @returns {Promise<void>} データ取得のPromise
     */
    getStorage() {
        console.log('getStorage');
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(STORAGE_KEYS, (storageKeys) => {
                console.log('storageKeys: ', storageKeys);
                Object.assign(this.storage, storageKeys);
                console.log('getStorage 完了');
                resolve();
            });
        });
    }

    /**
     * ストレージにデフォルトの設定を保存する
     * @returns {Promise<void>} データ保存のPromise
     */
    setStorage() {
        console.log('setStorage1');
        return new Promise((resolve, reject) => {
            const storageContents = {
                menuTitle: this.storage.menuTitle,
                prompt: this.storage.prompt,
                context: this.storage.context,
                api: this.storage.api
            };

            chrome.storage.local.set(storageContents, () => {
                if (chrome.runtime.lastError) {
                    console.error('Save Failed.');
                    reject(chrome.runtime.lastError);
                } else {
                    console.log('setStorage 完了');
                    resolve();
                }
            });
        });
    }

    /**
     * コンテキストメニューを作成する
     */
    createContextMenuTitle() {
        const menus = this.storage.menuTitle;
        Object.entries(menus).forEach(([key, val]) => {
            console.log(key, val);
            chrome.contextMenus.create({
                id: key,
                title: val.title,
                contexts: val.contexts,
            }, () => { });
        });
    }

    /**
     * コンテキストメニューのタイトルを更新する
     * @param {string} title - 新しいタイトル
     * @param {string} id - メニューID
     */
    updateContextMenuTitle(title, id) {
        const menuTitle = title || this.storage.menuTitle[id].title;
        console.log('update: menuTitle: ', menuTitle);
        setTimeout(() => {
            chrome.contextMenus.update(id, {
                "title": menuTitle
            });
        }, 1000);
    }
}

const extensionSettings = new ExtensionSettings();

/**
 * 拡張機能のインストール時または更新時にコンテキストメニューを作成
 */
chrome.runtime.onInstalled.addListener(function () {
    extensionSettings.createContextMenuTitle();
});

/**
 * ウィンドウが閉じられたときにメニュータイトルを更新
 */
chrome.windows.onRemoved.addListener(() => {
    console.log('Updating menu titles.');
    const menus = extensionSettings.storage.menuTitle;
    Object.keys(menus).forEach(id => {
        extensionSettings.updateContextMenuTitle(null, id);
    });
});

/**
 * メッセージを受信したときの処理
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('onMessage: ', request);
    if (request.action === 'notifyUser') {
        chrome.action.setBadgeText({ text: 'on' });
    }
    // ポップアップ画面クローズ時、またはメニュー作成
    if (request.action === "popupClosed" || request.action === "changeMenuTitle") {
        console.log('onMessage.text: ', request.text);
    }
});

/**
 * コンテキストメニューがクリックされたときの処理
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
    console.log('info/tab: ', info, tab);
    extensionSettings.getStorage()
        .then(() => {
            const STORAGE = extensionSettings.storage;
            const STORAGE_API = STORAGE.api;
            if (!STORAGE_API.gptKey && (!STORAGE_API.server || !STORAGE_API.server.url)) {
                chrome.tabs.create({ url: 'chrome-extension://' + chrome.runtime.id + '/html/options.html' });
            } else {
                requestToOpenAI(info, tab);
            }
        })
        .catch(error => {
            console.error('エラーが発生しました: ', error);
            if (tab && tab.id) {
                chrome.tabs.sendMessage(tab.id, { action: "tabactiveerror" });
            }
        });
});

/**
 * OpenAI APIにリクエストを送信する
 * @param {Object} info - コンテキストメニュー情報
 * @param {Object} tab - タブ情報
 */
function requestToOpenAI(info, tab) {
    console.log('info / tab', info, tab);
    const STORAGE = extensionSettings.storage;
    let requestOptions = {};
    let url = 'https://api.openai.com/v1/chat/completions';
    let prompt = createText(info);

    console.log('prompt: ', prompt);
    chrome.tabs.sendMessage(tab.id, { action: "loadingStart" }, () => {
        if (chrome.runtime.lastError) {
            console.log(chrome.runtime.lastError.message);
        }
    });

    if (STORAGE.api.type === 'server') {
        const token = STORAGE.api.server.token;
        let headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        url = STORAGE.api.server.url;
        requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                'text': prompt,
            }),
        };
    } else {
        requestOptions = getGptRequestParam(STORAGE.api.gptKey, prompt);
    }
    console.log('url: ', url);
    console.log('requestOptions: ', requestOptions);

    fetch(url, requestOptions)
        .then(response => response.json())
        .then(data => {
            console.log('response / data', data);
            const responseText = data.choices[0].message.content;

            // テキストをクリップボードにコピー
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: (text) => {
                    navigator.clipboard.writeText(text).then(() => {
                        console.log('Text successfully copied.');
                    }).catch(err => {
                        console.error('Failed to copy text: ', err);
                    });
                },
                args: [responseText]
            }, () => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                } else {
                    chrome.runtime.sendMessage({ message: 'Copied!' }, () => {
                        if (chrome.runtime.lastError) {
                            console.log(chrome.runtime.lastError.message);
                        }
                    });
                }
            });

            const context = STORAGE.context;
            let updatedContext = {
                selected: context.selected,
                input: context.input,
                response: responseText
            };
            console.log("updatedContext: ", updatedContext);
            STORAGE.context = updatedContext;

            chrome.storage.local.set({ context: updatedContext }, () => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError);
                }
            });
        })
        .catch(error => {
            chrome.tabs.sendMessage(tab.id, { action: "connectError" }, () => {
                if (chrome.runtime.lastError) {
                    console.log(chrome.runtime.lastError.message);
                }
            });
            console.log('An error has occurred:', error);
        });
}

/**
 * GPT APIを使用するためのリクエストパラメータを取得する
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
            'model': 'gpt-4',
            'messages': [{ "role": "user", "content": prompt }],
            'max_tokens': 1500,
            'temperature': 0.7,
            'top_p': 1,
            'frequency_penalty': 0.0,
            'presence_penalty': 0.6,
        }),
    };
}

/**
 * 選択されたテキストとプロンプトを組み合わせてテキストを作成する
 * @param {Object} info - コンテキストメニュー情報
 * @returns {string} 作成されたテキスト
 */
function createText(info) {
    const STORAGE = extensionSettings.storage;
    const menus = STORAGE.menuTitle;
    const prompt = menus[info.menuItemId].prompt;
    let text = info.selectionText || '';

    if (prompt) text = prompt + "\n---\n" + text;

    const requestText = {
        selected: STORAGE.context.selected,
        input: text,
        response: STORAGE.context.response,
    };
    extensionSettings.storage.context = requestText;
    return text;
}
