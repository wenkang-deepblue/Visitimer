const schedulesContainer = document.getElementById('schedules-container');
const addScheduleButton = document.getElementById('add-schedule');
const saveButton = document.getElementById('save-settings');
const cancelButton = document.getElementById('cancel-settings');
const statusMessage = document.getElementById('status-message');
const scheduleTemplate = document.getElementById('schedule-template');
const clearAllButton = document.getElementById('clear-all');

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
    timeInput.value = schedule.time;
    
    // Set auto-close related values
    autoCloseSelect.value = schedule.autoClose || 'no-close';
    durationInput.value = schedule.closeDuration || 30;
    closeTimeInput.value = schedule.closeTime || '';
    
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
            statusMessage.textContent = chrome.i18n.getMessage('maxDurationWarning') || '最大输入值为999分钟';
            statusMessage.className = 'status warning';
            // Set timer to clear message
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = 'status';
            }, 3000);
        }
    });
    
    // Add focus event, show message when user clicks input field
    durationInput.addEventListener('focus', function() {
        statusMessage.textContent = chrome.i18n.getMessage('maxDurationInfo') || '请输入1-999之间的分钟数';
        statusMessage.className = 'status info';
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
        const time = timeInput.value;
        const autoClose = autoCloseSelect.value;
        const closeDuration = durationInput.value;
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
                schedulesToSave = []; // Prepare to save empty array
                return; // Stop processing this row
            }
        }
         // Check if only one field is filled
        if ((!url && time) || (url && !time)) {
            hasError = true;
            statusMessage.textContent = `${chrome.i18n.getMessage('saveError')} (Row ${displayIndex})`;
            statusMessage.classList.add('error');
            urlInput.style.borderColor = !url ? 'red' : '';
            timeInput.style.borderColor = !time ? 'red' : '';
            return;
        }

        // Validate time format (redundant for type="time", but good practice)
        if (time && !/^\d{2}:\d{2}$/.test(time)) {
            hasError = true;
            statusMessage.textContent = `${chrome.i18n.getMessage('invalidTime')} (Row ${displayIndex})`;
            statusMessage.classList.add('error');
            timeInput.style.borderColor = 'red';
            timeInput.setCustomValidity(chrome.i18n.getMessage('invalidTime'));
            return;
        }

        // Validate close time
        if (autoClose === 'at-time' && (!closeTime || !/^\d{2}:\d{2}$/.test(closeTime))) {
            hasError = true;
            statusMessage.textContent = `${chrome.i18n.getMessage('invalidTime')} (Row ${displayIndex}, close time)`;
            statusMessage.classList.add('error');
            closeTimeInput.style.borderColor = 'red';
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
                // Do not set hasError, allow saving
            }
        }
        
        // Validate close duration
        if (autoClose === 'after-duration') {
            const duration = parseInt(closeDuration, 10);
            if (isNaN(duration) || duration < 1 || duration > 999) {
                hasError = true;
                statusMessage.textContent = `Invalid duration (1-999) (Row ${displayIndex})`;
                statusMessage.classList.add('error');
                durationInput.style.borderColor = 'red';
                return;
            }
        }

        // Add http(s):// prefix if missing and validate URL
        if (url) {
            url = addHttpPrefix(url);
            if (!isValidHttpUrl(url)) {
                hasError = true;
                statusMessage.textContent = `${chrome.i18n.getMessage('invalidUrl')} (Row ${displayIndex})`;
                statusMessage.classList.add('error');
                urlInput.style.borderColor = 'red';
                urlInput.setCustomValidity(chrome.i18n.getMessage('invalidUrl'));
                return;
            }
        }


        // If passed all checks for this row
        if(url && time) { // Only add if both fields are valid
            schedulesToSave.push({ 
                url: url, 
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
        } else {
            // If there is no time comparison message, show save success message
            if (!statusMessage.textContent) {
                statusMessage.textContent = chrome.i18n.getMessage('saveSuccess');
                statusMessage.classList.add('success');
                setTimeout(() => {
                    statusMessage.textContent = '';
                    statusMessage.className = 'status';
                }, 3000);
                } else {
                // If there is a time comparison message, keep it displayed longer
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
    
    // Show success message
    statusMessage.textContent = chrome.i18n.getMessage('clearAllSuccess');
    statusMessage.className = 'status success';
    
    // Auto save empty data
    chrome.storage.sync.set({ schedules: [] }, () => {
        if (chrome.runtime.lastError) {
            console.error("Error saving empty data:", chrome.runtime.lastError);
            statusMessage.textContent = chrome.i18n.getMessage('saveError') + ' ' + chrome.runtime.lastError.message;
            statusMessage.className = 'status error';
        } else {
            // Clear status message after 3 seconds
            setTimeout(() => {
                statusMessage.textContent = '';
                statusMessage.className = 'status';
            }, 3000);
        }
    });
}

// Add clear button listener in event listeners section
if (clearAllButton) {
    clearAllButton.addEventListener('click', clearAllSchedules);
}