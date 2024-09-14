// popup/constants.js

export const STORAGE_KEYS = ['prompt', 'context', 'api'];
export const DEFAULT_STORAGE = {
    context: { selected: null, input: null, response: null },
    prompt: {
        type: [
            { title: "-", text: "-", enabled: 1 },
            { title: "英語翻訳", text: "下記の文章を英語に翻訳してください。", enabled: 1 },
            { title: "日本語翻訳", text: "下記の文章を日本語に翻訳してください。", enabled: 1 },
            { title: "要約", text: "下記の文章を提供された情報を、短く明確に伝えることが目的です。修正お願いします。", enabled: 1 },
            { title: "GPTに質問", text: "下記の文章の意味が理解できません。要求事項を指定しながら明確な説明をお願いします。", enabled: 1 },
            { title: "文章の指摘", text: "もし下記の文章内にエラーや間違いがあれば、それらを修正するために教えてください。", enabled: 1 }
        ],
        selected: 0,
        setPrompt: true
    },
    api: { type: 'gptKey', gptKey: null, server: { url: null, method: 'post', url2: '', token: '' } }
};
