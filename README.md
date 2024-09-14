# Quick Query Question Chrome Extension

This tool allows you to easily proofread any text on your browser screen.  
You will need a Chat-GPT API key or your own server.

## Chrome Extension URL

- [Quick Query Question link](https://chromewebstore.google.com/detail/quick-query-question/gcnknkigeobkiihifkfeeklkpkaflgil?authuser=0&hl=ja)

## Features

- **Context Menu Integration**: Right-click on selected text to access AI-powered options directly from the context menu.
  - **校正依頼 (Proofreading Request)**: Improve the clarity and understanding of the selected text.
  - **要約依頼 (Summary Request)**: Summarize the main points of the selected text concisely.
  - **AIに質問 (Ask AI)**: Get explanations or answers about the selected text.
- **Customizable Prompts**: Define and manage your own prompts for personalized assistance.
- **API Configuration**: 
  - Use your own OpenAI API key.
  - Configure a custom server URL for API requests.
- **Clipboard Integration**: Automatically copies the AI's response to your clipboard.
- **User-Friendly UI**: Options and popup pages for easy configuration and usage.

## Installation

1. **Clone or Download the Repository**

   ```bash
   git clone git@github.com:nzw/quick-query-question_public.git
   ```

2. **Load the Extension in Chrome**

   - Open Google Chrome and navigate to `chrome://extensions/`.
   - Enable **Developer mode** by toggling the switch in the top right corner.
   - Click on **Load unpacked** and select the directory where you cloned/downloaded the extension.

## Usage

1. **Configure the Extension**

   - Click on the extension icon in the toolbar or navigate to the options page via `chrome://extensions/`.
   - Set your OpenAI API key or configure your custom server URL in the **Options** page.
   - Customize prompts if desired.

2. **Using Context Menu**

   - Select text on any webpage.
   - Right-click to open the context menu.
   - Choose one of the AI-powered options:
     - **校正依頼** (Proofreading Request)
     - **要約依頼** (Summary Request)
     - **AIに質問** (Ask AI)

3. **Receive AI Assistance**

   - The extension will process your request using the configured API.
   - The AI's response will be copied to your clipboard.
   - A notification will appear confirming the action.

## Directory Structure

```
.
├── css
│   ├── contents.css       # Styles for content scripts
│   ├── loader.css         # Styles for loading animations
│   ├── options.css        # Styles for the options page
│   └── popup.css          # Styles for the popup page
├── html
│   ├── options.html       # Options page HTML
│   └── popup.html         # Popup page HTML
├── icons                  # Icons for the extension
│   ├── 128.png
│   ├── 16.png
│   ├── 32.png
│   └── 48.png
├── images                 # Additional images used in the extension
│   ├── audio
│   │   ├── start.png
│   │   └── stop.png
│   ├── chrome_store.png
│   ├── loading.gif
│   ├── loading.png
│   └── set.png
├── js
│   ├── background.js      # Background script
│   ├── contents.js        # Content script
│   ├── options.js         # Options page script
│   ├── popup              # Scripts related to the popup
│   │   ├── constants.js
│   │   ├── events.js
│   │   ├── manager.js
│   │   └── uiController.js
│   ├── popup.js           # Popup page script
│   └── settings           # Settings management scripts
│       ├── eventManager.js
│       ├── messageManager.js
│       ├── storageManager.js
│       └── uiManager.js
├── manifest.json          # Extension manifest file
```

## Configuration

### API Settings

- **OpenAI API Key**: If you have an OpenAI API key, you can set it in the options page under **API Settings**.
- **Custom Server URL**: If you have a custom server that interfaces with OpenAI's API, you can set the server URL and token.

### Prompts

- Customize existing prompts or add new ones in the **Prompts** section of the options page.
- Enable or disable prompts as needed.

## Development

### Prerequisites

- Google Chrome browser
- Basic knowledge of JavaScript and Chrome extensions

### Building and Testing

- Since this is a simple Chrome extension, no build tools are required.
- After making changes, reload the extension in `chrome://extensions/` to see updates.

### Files Overview

- **background.js**: Handles background tasks, context menu creation, and communication between different parts of the extension.
- **contents.js**: Injected into webpages to interact with the page content and handle user selections.
- **options.js**: Manages the options page functionality.
- **popup.js**: Manages the popup window functionality.
- **settings/**: Contains scripts for managing settings, storage, UI updates, and messaging.

## Troubleshooting

- **Extension Not Working**: Ensure that you've set your API key or server URL correctly in the options page.
- **Error Messages**: If you encounter any errors, check the console logs in the background script or content script for more information.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request on GitHub.

## MIT License

This project is released under the [MIT License](LICENSE).

Copyright (c) 2024 nzw
>>>>>>> Stashed changes
