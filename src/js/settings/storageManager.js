// settings/storageManager.js

export function getStorage(keys, callback) {
    chrome.storage.local.get(keys, (items) => {
        if (chrome.runtime.lastError) {
            console.error('Error getting storage:', chrome.runtime.lastError);
            return;
        }
        callback(items);
    });
}

export function setStorage(data, callback) {
    chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
            console.error('ストレージ保存エラー:', chrome.runtime.lastError);
        } else {
            console.log('ストレージにデータが保存されました。', data);
        }
        if (callback) callback();
    });
}
