// popup/openai.js

/**
 * OpenAI APIにリクエストを送信する関数
 * @param {Object} apiConfig - API設定オブジェクト
 * @param {string} promptText - プロンプトテキスト
 * @returns {Promise<string>} 応答テキスト
 */
export async function requestToOpenAI(apiConfig, promptText) {
    let requestOptions = {};
    let url = 'https://api.openai.com/v1/chat/completions';

    if (apiConfig.type === 'server') {
        const token = apiConfig.server.token;
        let headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        url = apiConfig.server.url;
        requestOptions = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                'text': promptText,
            }),
        };
    } else {
        requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiConfig.gptKey}`
            },
            body: JSON.stringify({
                'model': 'gpt-4',
                'messages': [{ "role": "user", "content": promptText }],
                'max_tokens': 1500,
                'temperature': 0.7,
                'top_p': 1,
                'frequency_penalty': 0.0,
                'presence_penalty': 0.6
            }),
        };
    }

    const response = await fetch(url, requestOptions);
    const data = await response.json();
    if (data.error) {
        throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
}
