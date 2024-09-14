// popup/manager.js:

import { getStorage, setStorage } from '../settings/storageManager.js';
import { STORAGE_KEYS, DEFAULT_STORAGE } from './constants.js';

/**
 * PopupManagerクラスは、ポップアップのロジックを管理します。
 */
class PopupManager {
    constructor(uiController) {
        this.uiController = uiController;
        this.storage = {};  // 初期値を空のオブジェクトに設定
    }


    /**
     * 初期化処理
     */
    initialize() {
        // ローカルストレージからデータを取得
        console.log('DEFAULT_STORAGE:', DEFAULT_STORAGE.prompt.type);
        console.log('STORAGE_KEYS: ', STORAGE_KEYS);

        chrome.storage.local.get(STORAGE_KEYS, (storage) => {
            console.log('chrome.storage.local.get/storage: ', storage);

            if (storage.prompt && storage.prompt.type) {
                this.storage = storage;
                this.uiController.populatePromptSelectBox(this.storage.prompt.type);
            } else {
                console.warn('プロンプトデータが存在しないため、デフォルトのプロンプトデータを使用します。');
                this.storage = { ...DEFAULT_STORAGE, ...storage };
                chrome.storage.local.set({ prompt: DEFAULT_STORAGE.prompt }, () => {
                    this.uiController.populatePromptSelectBox(DEFAULT_STORAGE.prompt.type);
                });
            }

            // context.input の値がある場合、textarea に設定
            if (storage.context && storage.context.input) {
                console.log('context.input の値を textarea に設定します:', storage.context.input);
                this.uiController.setInputText(storage.context.input); // テキストエリアに値をセット
            }
        });
    }

    /**
     * 選択されたプロンプトを取得
     * @returns {Object} 選択されたプロンプト
     */
    getSelectedPrompt() {
        const selectedPromptIndex = this.uiController.UIElements.promptSelectBox.selectedIndex;

        // プロンプトデータが存在するか確認
        if (!this.storage.prompt || !this.storage.prompt.type) {
            console.error('プロンプトデータが存在しません');
            return null;  // データがない場合は null を返す
        }

        // インデックスが範囲内か確認
        if (selectedPromptIndex < 0 || selectedPromptIndex >= this.storage.prompt.type.length) {
            console.error('選択されたプロンプトのインデックスが無効です');
            return null;
        }

        // 選択されたプロンプトを返す
        return this.storage.prompt.type[selectedPromptIndex];
    }

    getPromptOptions() {
        if (!this.storage.prompt || !this.storage.prompt.type) {
            console.error('プロンプトデータが存在しません');
            this.storage.prompt = DEFAULT_STORAGE.prompt; // デフォルトのプロンプトを設定
            return this.storage.prompt.type;
        }

        return this.storage.prompt.type || [];
    }

    /**
     * コンテキストを保存する
     * @param {Object} context - 保存するコンテキストオブジェクト
     */
    saveContext(context) {
        this.storage.context = context;
        setStorage({ context }, () => {
            console.log('Context saved');
        });
    }

    /**
     * コンテキストを読み込み、UIに反映する
     */
    loadContext() {
        const context = this.storage.context;
        if (context) {
            this.uiController.setInputText(context.input || '');
            this.uiController.setResultText(context.response || '');
        }
    }

    /**
     * 現在のコンテキストを取得する
     * @returns {Object} 現在のコンテキストオブジェクト
     */
    getContext() {
        return this.storage.context;
    }

    /**
     * APIの設定情報を取得する
     * @returns {Object} API設定オブジェクト
     */
    getAPIConfig() {
        return this.storage.api;
    }
}

export default PopupManager;
