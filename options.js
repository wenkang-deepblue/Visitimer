const schedulesContainer = document.getElementById('schedules-container');
const addScheduleButton = document.getElementById('add-schedule');
const saveButton = document.getElementById('save-settings');
const cancelButton = document.getElementById('cancel-settings');
const statusMessage = document.getElementById('status-message');
const scheduleTemplate = document.getElementById('schedule-template');
const clearAllButton = document.getElementById('clear-all');

// Toast Notification Logic
const toastElement = document.getElementById('toast');
let toastTimeoutId = null;

function initTimePicker(inputElem, initialValue) {
    if (!inputElem || typeof flatpickr === 'undefined') return;
    if (initialValue) {
        inputElem.value = initialValue;
    }
    flatpickr(inputElem, {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        allowInput: true,
        // Custom parsing logic: only accept 0–23 o'clock, 0–59 minutes
        parseDate: (dateStr, format) => {
            const raw = dateStr ? dateStr.trim() : '';
            if (!raw) return undefined;

            const normalized = normalizeTimeString(raw);
            const match = /^(\d{1,2}):(\d{2})$/.exec(normalized);
            if (!match) {
                showToast('invalidTime', [], 3000, 'error');
                return undefined;
            }

            const h = parseInt(match[1], 10);
            const m = parseInt(match[2], 10);
            if (isNaN(h) || isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
                showToast('invalidTime', [], 3000, 'error');
                return undefined;
            }

            // Construct a time for the current day
            const d = new Date();
            d.setHours(h, m, 0, 0);
            return d;
        }
    });
}

// Shows a toast message, localizing the message key
function showToast(messageKey, substitutions = [], duration = 3000, type = 'success') {
    if (!toastElement) return;

    // Clear any existing hide timer
    if (toastTimeoutId) {
        clearTimeout(toastTimeoutId);
    }

    // Get localized message
    const message = chrome.i18n.getMessage(messageKey, substitutions);

    toastElement.textContent = message;
    
    // Remove all type classes
    toastElement.classList.remove('success', 'error', 'warning', 'info');
    // Add the specified type class
    toastElement.classList.add(type);
    // Activate the toast
    toastElement.classList.add('active');

    // Set a timer to hide the toast
    toastTimeoutId = setTimeout(() => {
        toastElement.classList.remove('active');
        toastTimeoutId = null;
    }, duration);
}

// --- Localization Helper ---
function applyLocalization() {
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (elem.children.length === 0 || elem.tagName === 'OPTION' || elem.tagName === 'TITLE' || elem.tagName === 'BUTTON') {
            elem.textContent = chrome.i18n.getMessage(key);
        } else if (elem.tagName === 'SPAN' && !elem.querySelector('*')) {
             elem.textContent = chrome.i18n.getMessage(key);
        }
    });
     document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-placeholder');
        elem.placeholder = chrome.i18n.getMessage(key);
    });
     document.querySelectorAll('[data-i18n-title]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-title');
        elem.title = chrome.i18n.getMessage(key);
    });
    const titleElem = document.querySelector('title[data-i18n]');
    if(titleElem) {
        const titleKey = titleElem.getAttribute('data-i18n');
        document.title = chrome.i18n.getMessage(titleKey);
    }
}

// --- Handle auto-close option change ---
function handleAutoCloseChange(selectElem) {
    const row = selectElem.closest('.schedule-row');
    const durationContainer = row.querySelector('.duration-container');
    const timeCloseContainer = row.querySelector('.time-close-container');
    
    // Hide all input items
    durationContainer.style.display = 'none';
    timeCloseContainer.style.display = 'none';
    
    // Show the corresponding input item based on the selection
    if (selectElem.value === 'after-duration') {
        durationContainer.style.display = 'flex';
    } else if (selectElem.value === 'at-time') {
        timeCloseContainer.style.display = 'flex';
    }
}

// --- Schedule Row Management ---

function createScheduleRow(schedule = { url: '', time: '', autoClose: 'no-close', closeDuration: 30, closeTime: '' }, index) {
    const newRow = scheduleTemplate.cloneNode(true);
    newRow.removeAttribute('id');
    newRow.style.display = 'flex';

    const indexSpan = newRow.querySelector('.index');
    const urlInput = newRow.querySelector('.url-input');
    const timeInput = newRow.querySelector('.time-input');
    const autoCloseSelect = newRow.querySelector('.auto-close-select');
    const durationInput = newRow.querySelector('.duration-input');
    const closeTimeInput = newRow.querySelector('.close-time-input');
    const removeButton = newRow.querySelector('.remove-schedule');

    indexSpan.textContent = index + 1;
    urlInput.value = schedule.url;

    initTimePicker(timeInput, schedule.time);

    // Set auto-close related values
    autoCloseSelect.value = schedule.autoClose || 'no-close';
    durationInput.value = schedule.closeDuration || 30;

    initTimePicker(closeTimeInput, schedule.closeTime || '');
    
    // Initialize auto-close option display
    handleAutoCloseChange(autoCloseSelect);
    
    // Auto-close option change event listener
    autoCloseSelect.addEventListener('change', function() {
        handleAutoCloseChange(this);
    });

    // Apply localization to the cloned row's elements that need it
    newRow.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        if (elem.tagName === 'BUTTON' || elem.tagName === 'SPAN' || elem.tagName === 'OPTION') {
            elem.textContent = chrome.i18n.getMessage(key);
        }
    });
    
    newRow.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-placeholder');
        elem.placeholder = chrome.i18n.getMessage(key);
    });

    removeButton.addEventListener('click', () => {
        newRow.remove();
        updateIndices();
    });

    // Basic validation hints
    urlInput.addEventListener('input', () => {
      urlInput.setCustomValidity('');
    });
    
    timeInput.addEventListener('input', () => {
        timeInput.setCustomValidity('');
    });

    // Set input field limits and event handling
    durationInput.addEventListener('input', function() {
        const val = parseInt(this.value, 10);
        if (isNaN(val)) {
            this.value = 30;
        } else if (val > 999) {
            this.value = 999;
            // Show warning message
            const warnMsg = chrome.i18n.getMessage('maxDurationWarning');
            statusMessage.textContent = warnMsg;
            statusMessage.className = 'status warning';
            showToast('maxDurationWarning', [], 3000, 'warning');
            // Set timer to clear message
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = 'status';
            }, 3000);
        }
    });
    
    // Add focus event, show message when user clicks input field
    durationInput.addEventListener('focus', function() {
        const infoMsg = chrome.i18n.getMessage('maxDurationInfo');
        statusMessage.textContent = infoMsg;
        statusMessage.className = 'status info';
        showToast('maxDurationInfo', [], 3000, 'info');
        // Set timer to clear message
        setTimeout(() => {
            statusMessage.textContent = '';
            statusMessage.className = 'status';
        }, 3000);
    });

    schedulesContainer.appendChild(newRow);
}

function updateIndices() {
    const rows = schedulesContainer.querySelectorAll('.schedule-row:not(#schedule-template)');
    rows.forEach((row, index) => {
        row.querySelector('.index').textContent = index + 1;
    });
}

// --- Load and Save ---

function loadSchedules() {
    chrome.storage.sync.get(['schedules'], (result) => {
        schedulesContainer.innerHTML = ''; // Clear existing rows before loading
        const schedules = result.schedules || [];
        if (schedules.length === 0) {
            // Add one empty, visible row if storage is empty
             createScheduleRow({ url: '', time: '', autoClose: 'no-close', closeDuration: 30, closeTime: '' }, 0); // Provide default empty values
        } else {
            schedules.forEach((schedule, index) => {
                createScheduleRow(schedule, index);
            });
        }
    });
}

// Normalize time string to "HH:MM" format
function normalizeTimeString(raw) {
    if (!raw) return '';
    // Replace the first dot with a colon (user习惯输入 9.23 / 00.00)
    let s = raw.trim().replace('.', ':');
    const parts = s.split(':');
    if (parts.length !== 2) return s;

    let [h, m] = parts;
    if (!h || !m) return s;
    if (!/^\d{1,2}$/.test(h) || !/^\d{1,2}$/.test(m)) return s;

    let hour = parseInt(h, 10);
    let minute = parseInt(m, 10);
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        return s;
    }

    // 0 o'clock is displayed as "00", 1–9 o'clock is displayed as "1"–"9", 10 and above is two digits
    const hourStr = (hour === 0 || hour > 9) ? String(hour).padStart(2, '0') : String(hour);
    const minuteStr = String(minute).padStart(2, '0');
    return `${hourStr}:${minuteStr}`;
}

function saveSchedules() {
    const rows = schedulesContainer.querySelectorAll('.schedule-row:not(#schedule-template)');
    const schedulesToSave = [];
    let hasError = false;
    statusMessage.textContent = '';
    statusMessage.className = 'status';

    rows.forEach((row, index) => {
        const displayIndex = index + 1;
        const urlInput = row.querySelector('.url-input');
        const timeInput = row.querySelector('.time-input');
        const autoCloseSelect = row.querySelector('.auto-close-select');
        const durationInput = row.querySelector('.duration-input');
        const closeTimeInput = row.querySelector('.close-time-input');
        
        let url = urlInput.value.trim();
        timeInput.value = normalizeTimeString(timeInput.value);
        const time = timeInput.value;
        const autoClose = autoCloseSelect.value;
        const closeDuration = durationInput.value;
        closeTimeInput.value = normalizeTimeString(closeTimeInput.value);
        const closeTime = closeTimeInput.value;

        // Reset previous errors visually
        urlInput.style.borderColor = '';
        timeInput.style.borderColor = '';
        urlInput.setCustomValidity('');
        timeInput.setCustomValidity('');

        // Basic Validation for empty fields (Allow empty row only if it's the only one)
        if (!url && !time) {
            if (rows.length > 1) {
                return; // Skip saving this empty row if others exist
            } else if (rows.length === 1) {
                hasError = true;
                const invalidUrlMsg = chrome.i18n.getMessage('invalidUrl') || chrome.i18n.getMessage('saveError');
                statusMessage.textContent = invalidUrlMsg;
                statusMessage.classList.add('error');
                urlInput.style.borderColor = 'red';
                urlInput.setCustomValidity(invalidUrlMsg);
                showToast('invalidUrl', [], 3000, 'error');
                return; // Stop processing this row
            }
        }
         // Check if only one field is filled
        if ((!url && time) || (url && !time)) {
            hasError = true;
            const msgKey = (!url && time) ? 'invalidUrl' : 'invalidTime';
            const baseMsg = chrome.i18n.getMessage(msgKey) || chrome.i18n.getMessage('saveError');
            statusMessage.textContent = `${baseMsg} (Row ${displayIndex})`;
            statusMessage.classList.add('error');
            urlInput.style.borderColor = !url ? 'red' : '';
            timeInput.style.borderColor = !time ? 'red' : '';
            showToast(msgKey, [], 3000, 'error');
            return;
        }

        // Validate time format (redundant for type="time", but good practice)
        if (time && !/^\d{1,2}:\d{2}$/.test(time)) {
            hasError = true;
            const invalidTimeMsg = chrome.i18n.getMessage('invalidTime');
            statusMessage.textContent = `${invalidTimeMsg} (Row ${displayIndex})`;
            statusMessage.classList.add('error');
            timeInput.style.borderColor = 'red';
            timeInput.setCustomValidity(invalidTimeMsg);
            showToast('invalidTime', [], 3000, 'error');
            return;
        }

        // Validate close time
        if (autoClose === 'at-time' && (!closeTime || !/^\d{1,2}:\d{2}$/.test(closeTime))) {
            hasError = true;
            const invalidTimeMsg = chrome.i18n.getMessage('invalidTime');
            statusMessage.textContent = `${invalidTimeMsg} (Row ${displayIndex}, close time)`;
            statusMessage.classList.add('error');
            closeTimeInput.style.borderColor = 'red';
            showToast('invalidTime', [], 3000, 'error');
            return;
        }

        // Compare open and close times
        if (autoClose === 'at-time' && time && closeTime) {
            // Parse time strings to hours and minutes
            const [openHours, openMinutes] = time.split(':').map(Number);
            const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
            
            // Convert to minutes for comparison
            const openTimeMinutes = openHours * 60 + openMinutes;
            const closeTimeMinutes = closeHours * 60 + closeMinutes;
            
            // If close time is before open time, show warning message
            if (closeTimeMinutes < openTimeMinutes) {
                statusMessage.textContent = chrome.i18n.getMessage("closeTimeBeforeOpenTime");
                statusMessage.className = 'status warning';
                showToast('closeTimeBeforeOpenTime', [], 4000, 'warning');
                // Do not set hasError, allow saving
            }
        }
        
        // Validate close duration
        if (autoClose === 'after-duration') {
            const duration = parseInt(closeDuration, 10);
            if (isNaN(duration) || duration < 1 || duration > 999) {
                hasError = true;
                const durationMsg = chrome.i18n.getMessage('maxDurationWarning') || 'Invalid duration (1-999)';
                statusMessage.textContent = `${durationMsg} (Row ${displayIndex})`;
                statusMessage.classList.add('error');
                durationInput.style.borderColor = 'red';
                showToast('maxDurationWarning', [], 3000, 'error');
                return;
            }
        }

        // Add http(s):// prefix if missing and validate URL
        // Support multiple URLs separated by semicolons or commas
        let urlList = url
            .split(/[;,]/)          // semicolon or comma separated
            .map(u => u.trim())
            .filter(u => u);

        let validUrls = [];
        if (urlList.length > 0) {
            for (const rawUrl of urlList) {
                const fullUrl = addHttpPrefix(rawUrl);
                if (!isValidHttpUrl(fullUrl)) {
                    hasError = true;
                    const invalidUrlMsg = chrome.i18n.getMessage('invalidUrl');
                    statusMessage.textContent = `${invalidUrlMsg} (Row ${displayIndex})`;
                    statusMessage.classList.add('error');
                    urlInput.style.borderColor = 'red';
                    urlInput.setCustomValidity(invalidUrlMsg);
                    showToast('invalidUrl', [], 3000, 'error');
                    return;
                }
                validUrls.push(fullUrl);
            }
        }

        // If passed all checks for this row
        if (validUrls.length > 0 && time) { // Only add if at least one URL and time are valid
            schedulesToSave.push({ 
                url: validUrls.join(';'),   // Store URLs separated by semicolons
                time: time,
                autoClose: autoClose,
                closeDuration: closeDuration,
                closeTime: closeTime
            });
        }
    });

    // Final check if the only row was empty
    if (rows.length === 1 && schedulesToSave.length === 0 && !hasError) {
        const urlInput = rows[0].querySelector('.url-input');
        const timeInput = rows[0].querySelector('.time-input');
        if (!urlInput.value.trim() && !timeInput.value) {
                // It was indeed the empty single row case
        } else if (!hasError) {
                // Single row had content but failed validation, error should have been set
                // If somehow error wasn't set, set a generic one
            hasError = true;
            if (!statusMessage.textContent) {
                statusMessage.textContent = chrome.i18n.getMessage('saveError');
                statusMessage.classList.add('error');
                showToast('saveError', [], 3000, 'error');
            }
        }
    }


    if (hasError) {
        return; // Don't save if errors were found
    }

    // --- Proceed to Save ---
    chrome.storage.sync.set({ schedules: schedulesToSave }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving schedules:", chrome.runtime.lastError);
            statusMessage.textContent = chrome.i18n.getMessage('saveError') + ' ' + chrome.runtime.lastError.message;
            statusMessage.classList.add('error');
            showToast('saveError', [], 3000, 'error');
        } else {
            // If there is no time comparison message, show save success message
            if (statusMessage.className !== 'status warning') {
                showToast('saveSuccess', [], 3000, 'success');
                // Optional: clear status message area
                statusMessage.textContent = '';
                statusMessage.className = 'status';
            } else {
                // If there is a time comparison warning message, keep it displayed longer
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status';
                }, 5000);
            }
        }
    });
}

function addHttpPrefix(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        if (url.includes('.') && !url.includes(' ') && !url.startsWith('/')) {
            return 'https://' + url;
        }
    }
    return url;
}

function isValidHttpUrl(string) {
    if (!string) return false; // Empty string is not a valid URL here
    let url;
    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }
    return url.protocol === "http:" || url.protocol === "https:";
}


// --- Event Listeners ---

document.addEventListener('DOMContentLoaded', () => {
    applyLocalization();
    loadSchedules();
});

addScheduleButton.addEventListener('click', () => {
    const currentRowCount = schedulesContainer.querySelectorAll('.schedule-row:not(#schedule-template)').length;
    createScheduleRow({ url: '', time: '', autoClose: 'no-close', closeDuration: 30, closeTime: '' }, currentRowCount); // Add new empty row
    updateIndices();
});

saveButton.addEventListener('click', saveSchedules);

if (cancelButton) {
    cancelButton.addEventListener('click', () => {
        window.close(); // Close the popup/options page
    });
}

// Function to clear all schedules
function clearAllSchedules() {
    // Clear container
    schedulesContainer.innerHTML = '';
    
    // Add a blank row
    createScheduleRow({ url: '', time: '', autoClose: 'no-close', closeDuration: 30, closeTime: '' }, 0);
    
    // Show success toast
    showToast('clearAllSuccess', [], 3000, 'success');
    
    // Auto save empty data
    chrome.storage.sync.set({ schedules: [] }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving empty data:", chrome.runtime.lastError);
            showToast('saveError', [], 3000, 'error');
        }
    });
}

// Add clear button listener in event listeners section
if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllSchedules);
}