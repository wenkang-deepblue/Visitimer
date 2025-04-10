# Privacy Policy for Visitimer Chrome Extension

**Effective Date:** **April 10, 2025**

Thank you for using Visitimer ("the Extension"), a Chrome extension designed to help you automatically open and close webpages based on a schedule you define. Your privacy is important to us. This Privacy Policy explains what information the Extension collects, how it's used and stored, and your choices regarding that information.

## 1. Information We Collect

**FIRST OF ALL: The Extension will not transmit any data out from your browser. Your data used by this Extersion keeps in your browser on your computer.**  
Visitimer is designed to function entirely on your local device. The Extension collects and store only the information you provide directly within the Extension's interface, which is necessary for its core functionality:

*   **Scheduled Task Data:**
    *   URLs (web addresses) you want to open.
    *   Scheduled time (HH:MM) to open the URL.
    *   Auto-close preference ("Don't auto-close", "Close after duration", "Close at specific time").
    *   Close duration (if applicable, in minutes).
    *   Specific close time (if applicable, HH:MM).

*   **Temporary State Data:**
    *   Information about tabs that have been opened by the Extension and are scheduled to be automatically closed (including the Tab ID and the scheduled closing time). This data is temporary and removed once the tab is closed or the task is otherwise completed or invalidated.

**We DO NOT collect any other personal information**, such as your name, email address, IP address (other than what you might enter *as a URL to visit*), browsing history (beyond the URLs you explicitly schedule), location data, or any other sensitive information.

## 2. How We Use Information

The information collected is used **exclusively** for the following purposes:

*   To store your configured schedules.
*   To set alarms within the Chrome browser to trigger the opening of the specified URLs at the scheduled times.
*   To manage the optional automatic closing of tabs based on your configured duration or specific time, including setting temporary alarms for tab closure.
*   To display your configured schedules within the Extension's interface.

The Extension **does not** use your information for tracking, analytics, advertising, or any purpose other than its core scheduling functionality.

## 3. Data Storage

*   **Schedule Data Storage (`chrome.storage.sync`):** Your schedule configurations (URLs, times, close settings) are stored using Chrome's `storage.sync` API. This means the data is stored locally within your Chrome browser profile and may be automatically synchronized by Google across other Chrome instances where you are logged in with the same Google account. This data is managed by your browser and Google's sync mechanisms; the Extension developer does not have access to it.
*   **Temporary State Data Storage (`chrome.storage.local`):** Information about tabs pending closure is stored using Chrome's `storage.local` API. This data is stored strictly locally on the specific browser instance where the Extension is running and is *not* synchronized. This data is automatically cleaned up as tabs are closed or related tasks complete.

**All data resides within your browser's secure storage.**

## 4. Data Sharing

**We DO NOT share any of the collected information (your schedules or temporary tab state) with the developer or any third parties.** The Extension operates entirely locally, and no data is transmitted from your browser to any external servers controlled by the developer or others.

## 5. Security

We rely on the security mechanisms provided by the Google Chrome browser and its storage APIs to protect the data stored locally.

## 6. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. If we make changes, we will update the "Effective Date" at the top of this policy. We encourage you to review this Privacy Policy periodically. Your continued use of the Extension after any changes constitutes your acceptance of the new Privacy Policy.

## 7. Contact Us

If you have any questions or concerns about this Privacy Policy or the Extension's privacy practices, please contact us by the email provided on the Visitimer page of Chrome Web Store.