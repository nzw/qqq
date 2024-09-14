// popup/events.js:

import { requestToOpenAI } from './openai.js';
import { DEFAULT_STORAGE, STORAGE_KEYS } from './constants.js';

/**
 * ポップアップのイベントをバインドする関数
 * @param {UIController} uiController - UIコントローラーのインスタンス
 * @param {PopupManager} popupManager - ポップアップマネージャーのインスタンス
 */
export function bindEvents(uiController, popupManager) {
    const { UIElements } = uiController;

    // UIElements と popupManager の存在を確認
    if (!UIElements || !popupManager) {
        console.error('UIElementsまたはpopupManagerが初期化されていません');
        return;
    }

    // プロンプトの選択が変更されたときのイベント
    UIElements.promptSelectBox.addEventListener('change', () => {
        const selectedPromptIndex = UIElements.promptSelectBox.selectedIndex;

        // ローカルストレージから prompt データを取得
        chrome.storage.local.get(['prompt'], (storage) => {
            const promptData = storage.prompt || DEFAULT_STORAGE.prompt;

            // 既存の prompt データに selected のみを更新
            promptData.selected = selectedPromptIndex;

            // ローカルストレージに prompt データを保存
            chrome.storage.local.set({ prompt: promptData }, () => {
                console.log(`prompt: ${promptData.selected} を保存しました`);
            });

            // 新しく選択されたプロンプトをテキストエリアにセット
            const selectedPrompt = popupManager.getSelectedPrompt();
            if (selectedPrompt) {
                //uiController.setInputText(selectedPrompt.text);
            }
        });
    });

    // 入力テキストが変更されたときのイベント
    UIElements.inputText.textArea.addEventListener('input', () => {
        const inputText = uiController.getInputText();
        const context = popupManager.getContext();
        if (context) {
            context.input = inputText;
            popupManager.saveContext(context);

            // 入力されたテキストをローカルストレージに保存
            chrome.storage.local.set({ context: { input: inputText } });
            console.log(`context.input: ${inputText} を保存しました`);
        } else {
            console.error('コンテキストが取得できません');
        }
    });

    UIElements.textInsertButton.addEventListener('click', () => {
        console.log('textInsertButton was clicked');
        uiController.textInsert();
    });

    // 生成ボタンがクリックされたときのイベント
    UIElements.generateButton.addEventListener('click', async () => {
        const inputText = uiController.getInputText();
        const selectedPrompt = popupManager.getSelectedPrompt();
        if (!selectedPrompt) {
            console.error('プロンプトが選択されていません');
            return;
        }

        uiController.showLoading();

        try {
            const apiConfig = popupManager.getAPIConfig();
            const responseText = await requestToOpenAI(apiConfig, inputText);

            uiController.setResultText(responseText);
            const context = popupManager.getContext();
            if (context) {
                context.response = responseText;
                popupManager.saveContext(context);
            }
        } catch (error) {
            console.error('応答生成エラー:', error);
            uiController.setResultText('エラーが発生しました。時間をおいて再度お試しください。');
        } finally {
            uiController.hideLoading();
        }
    });

    // 挿入ボタンがクリックされたときのイベント
    UIElements.promptInsertButton.addEventListener('click', () => {
        console.log('promptInsertButton was clicked');
        const selectedPromptIndex = UIElements.promptSelectBox.selectedIndex;
        const selectedPromptTitle = UIElements.promptSelectBox.options[selectedPromptIndex].text;
    
        if (!selectedPromptTitle) {
            console.error('選択されたプロンプトのタイトルが見つかりません');
            return;
        }
    
        const matchedPrompt = DEFAULT_STORAGE.prompt.type.find(prompt => prompt.title === selectedPromptTitle);
    
        if (matchedPrompt) {
            const selectedPromptText = matchedPrompt.text;
            const currentText = UIElements.inputText.textArea.value;
            const newText = selectedPromptText + "\n---\n" + currentText;
            UIElements.inputText.textArea.value = newText;
    
            // 既存のストレージデータを取得し、上書きしないようにマージ
            chrome.storage.local.get('context', (result) => {
                const existingContext = result.context || {};  // 既存のcontextデータを取得
    
                // 新しいinputデータを既存のcontextにマージ
                const updatedContext = {
                    ...existingContext,
                    input: newText
                };
    
                // 更新されたcontextデータをストレージに保存
                chrome.storage.local.set({ context: updatedContext }, () => {
                    console.log(`context.input: ${newText} を保存しました`);
                });
            });
        } else {
            console.error('一致するプロンプトが見つかりません');
        }
    });
    
    // 入力テキストをコピーするボタンのイベント
    UIElements.inputText.copyButton.addEventListener('click', () => {
        uiController.handleCopyInput();
    });

    // 結果テキストをコピーするボタンのイベント
    UIElements.resultText.copyButton.addEventListener('click', () => {
        uiController.handleCopyResult();
    });
}
