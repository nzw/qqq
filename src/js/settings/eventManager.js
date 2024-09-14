// settings/eventManager.js

export function bindEvents(uiManager) {
    const { UIElements } = uiManager;

    UIElements.gptKeyInput.addEventListener('input', uiManager.validateInputs.bind(uiManager));
    UIElements.urlInput.addEventListener('input', uiManager.validateInputs.bind(uiManager));
    UIElements.urlInput2.addEventListener('input', uiManager.validateInputs.bind(uiManager));
    UIElements.addHeaderBtn.addEventListener('click', uiManager.addHeader.bind(uiManager));
    UIElements.removeHeaderBtn.addEventListener('click', uiManager.removeHeader.bind(uiManager));
    UIElements.saveBtn.addEventListener('click', uiManager.saveSettings.bind(uiManager));
    UIElements.saveBtn2.addEventListener('click', uiManager.saveSettings.bind(uiManager));

    document.querySelectorAll('input[name="settingType"]').forEach((input) => {
        input.addEventListener('change', () => {
            uiManager.updateUI();
            uiManager.validateInputs();
        });
    });

    // プロンプト要素の全てのcheckbox、テキスト、テキストエリアを処理
    document.querySelectorAll(".prompt").forEach((promptDiv) => {
        const checkbox = promptDiv.querySelector("input[type='checkbox']");
        const textInput = promptDiv.querySelector("input[type='text']");
        const textarea = promptDiv.querySelector("textarea");

        // checkboxが存在するか確認してからイベントを追加
        if (checkbox) {
            checkbox.addEventListener("change", () => {
                uiManager.toggleInputState(checkbox, promptDiv.id, textInput, textarea);
            });
        }
    });

}
