
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
* [Visitimer on Chrome Web Store](https://chromewebstore.google.com/detail/visitimer/hnicenbfjcbcjjamehaclepifddoaapm) (if your browser does not redirect, please copy and paste this URL: https://chromewebstore.google.com/detail/visitimer/hnicenbfjcbcjjamehaclepifddoaapm)

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

## V1.5 Updates

- Improved the time picker UI by replacing native `input[type="time"]` with a flatpickr-based time-only selector, ensuring consistent font size and appearance across Chrome versions.
- Time inputs now accept both `:` and `.` as separators (e.g., `9:23` or `9.23`) and are normalized to `HH:MM`, while clearly rejecting invalid times (hours > 23 or minutes ≥ 60) with inline and toast error messages instead of silently adjusting them.
- Enhanced validation and localized toast notifications for invalid URLs, missing URL/time combinations, out-of-range auto-close durations, and inconsistent open/close times.
- Refined layout styles: narrower time input fields with centered text to make each schedule row more compact and readable.

## What's new in v1.5 (user experience improvement)
- New, clearer time picker with larger, easier-to-read time options and a cleaner layout.
- Time input is more forgiving: you can type times using either : or . (e.g. 9:23 or 9.23), and Visitimer will convert them to a consistent format while preventing accidental invalid times.
- Improved error messages and pop-up tips make it much easier to see why a schedule can’t be saved (invalid URL, missing time, out-of-range duration, etc.).
- Multiple websites can now be scheduled in the same row using commas or semicolons, and each one will open in its own tab at the scheduled time.
- Refined design of the schedule rows with tighter, centered time fields for a more compact and readable interface.