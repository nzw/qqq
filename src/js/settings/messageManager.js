// settings/messageManager.js

export function showMessage(id, message, timer) {
    const isError = id.includes('Error');
    if (document.getElementById(id)) return;

    const messageElement = document.createElement("div");
    messageElement.id = id;
    messageElement.innerHTML = message;
    messageElement.classList.add('message-element', isError ? 'message-error' : 'message-default');

    document.body.appendChild(messageElement);

    setTimeout(() => {
        messageElement.classList.add('fade-out');
    }, timer - 500);

    setTimeout(() => {
        if (document.body.contains(messageElement)) {
            document.body.removeChild(messageElement);
        }
    }, timer);
}
