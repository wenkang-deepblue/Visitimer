
# <center> ![Visitimer Logo](icons/icon30.png)&nbsp;&nbsp;Visitimer </center>
### <center> A Schedule Tool To Automatically Open & Close Chrome Tab For Visiting Webpages </center>

**Visitimer** is a Chrome extension that automatically opens and closes webpages at scheduled times. It's perfect for people who need to visit specific webpages regularly, like checking email, news, or work-related pages.

## Features

- **Schedule webpage Visits**: Set specific times to automatically open specific webpages
- **Auto-Close Options**: Configure tabs to close automatically after:
  - A specified duration (e.g., 30 minutes after opening)
  - At a specific time
  - Or keep them open indefinitely
- **Daily Repetition**: All schedules automatically repeat daily
- **Multiple Schedules**: Add as many scheduled webpage visits as you need
- **Simple Interface**: Easy-to-use schedule management
- **Multilingual Support**: Available in: *English (en)*, *Simplified Chinese (zh_CN)*, *Traditional Chinese (zh_TW)*, *Korean (ko)*, *Japanese (ja)*, *French (fr)*, *German (de)*, *Italian (it)*, *Spanish (es)*, *Portuguese (pt)*。

## Installation

### Manual Installation
1. Download this repository, unzip the pack to a regular directory (or clone this repository, if you do not know how, google it)
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the extension directory you did in step 1
5. The extension icon should appear in your browser toolbar

### From Chrome Web Store
* Coming soon

## Usage

### Adding a Scheduled webpage

1. Click the Visitimer icon in your browser toolbar (if you can not find it in your browser toolbar, navigate to `chrome://extensions/`, find Visitimer and click "Details", then find "Pin to toolbar", enable it)
2. Click "Add New" to add a new webpage schedule
3. Enter the webpage URL (e.g., `example.com` or `https://example.com` or IP address like `127.0.0.1`)
4. Set the time when you want the webpage to open
5. Configure auto-close options (if desired):
   - "Don't auto-close page" - The page will remain open
   - "Close page after duration" - Close after a specified number of minutes, countdown from opening
   - "Close page at specific time" - Close at a specific time
6. Click "Save" to activate your schedule

### Managing Your Schedules

- **Edit**: Simply update the values and click "Save"
- **Remove**: Click the "Remove" button next to any schedule you want to delete
- **Clear All**: Use the "Clear All" button to remove all schedules at once

## How It Works

- Visitimer runs in the background, but please keep Chrome running
- When the scheduled time arrives, Chrome will open and load the specified webpage(s)
- If auto-close is enabled, the tab will be automatically closed according at the time you specified
- All schedules repeat daily

## Browser Compatibility

This extension is designed for:
- Google Chrome
- **NOTE** NOT TESTED on other Chromium-based browsers (Microsoft Edge, Brave, Opera, etc.)

## License

This project is licensed under the GNU General Public License v3.0.


## Privacy

Visitimer operates entirely on your local device:
- All schedule data is stored in your browser's local storage
- No data is sent to any remote servers
- No analytics or tracking is implemented

## Contributing

Contributions are welcome! If you'd like to improve Visitimer:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Support

If you encounter any issues/bugs or have questions, please open an issue on the GitHub repository.
