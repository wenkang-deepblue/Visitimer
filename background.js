// --- Storage Lock Mechanism ---
// Try to acquire a lock using exponential backoff strategy
async function acquireStorageLock(lockName, maxAttempts = 10, initialWaitMs = 50) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Check lock status
        const result = await new Promise(resolve => {
            chrome.storage.local.get([lockName], resolve);
        });

        const lock = result[lockName];
        const now = Date.now();

        // If lock doesn't exist or has expired (15 second timeout protection)
        if (!lock || (now - lock.timestamp > 15000)) {
            // Try to acquire lock
            const newLock = {
                acquired: true,
                timestamp: now,
                owner: `worker_${now}_${Math.random().toString(36).substring(2, 9)}`
            };

            await new Promise(resolve => {
                chrome.storage.local.set({ [lockName]: newLock }, resolve);
            });

            // Verify lock acquisition
            const verification = await new Promise(resolve => {
                chrome.storage.local.get([lockName], resolve);
            });

            if (verification[lockName] && verification[lockName].owner === newLock.owner) {
                return newLock.owner; // Successfully acquired lock, return owner ID
            }
        }

        // Failed to acquire lock, wait before retrying
        const waitTime = initialWaitMs * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    throw new Error(`Unable to acquire lock ${lockName}`);
}

// Release a lock
async function releaseStorageLock(lockName, ownerId) {
    const result = await new Promise(resolve => {
        chrome.storage.local.get([lockName], resolve);
    });

    const lock = result[lockName];

    // Only the lock owner can release it
    if (lock && lock.owner === ownerId) {
        await new Promise(resolve => {
            chrome.storage.local.remove(lockName, resolve);
        });
        return true;
    } else if (!lock) {
        return true;
    } else {
        return false;
    }
}

// Perform storage operation with lock protection
async function withStorageLock(lockName, operation) {
    let lockOwner = null;
    try {
        lockOwner = await acquireStorageLock(lockName);
        return await operation();
    } finally {
        if (lockOwner) {
            await releaseStorageLock(lockName, lockOwner);
        }
    }
}

// --- Tab Closing Logic ---

// Schedule a tab to be closed at specified time
async function scheduleTabClose(tabId, closeTimeMs) {
    const timestamp = Date.now();
    const alarmName = `close_tab_${tabId}_${timestamp}`;
    
    // Use lock mechanism to protect storage operations
    await withStorageLock('tabsToCloseLock', async () => {
        // Get current task list
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['tabsToClose'], resolve);
        });
        
        const tabsToClose = result.tabsToClose || [];
        
        // Add new task
        tabsToClose.push({
            tabId: tabId,
            closeTime: closeTimeMs,
            alarmName: alarmName,
            createdAt: timestamp
        });
        
        // Save updated list
        await new Promise(resolve => {
            chrome.storage.local.set({ tabsToClose: tabsToClose }, resolve);
        });
    });
    
    // Create alarm to close the tab
    chrome.alarms.create(alarmName, {
        when: closeTimeMs
    });
}

// Handle tab closing alarm
async function handleCloseTabAlarm(alarm) {
    if (!alarm.name.startsWith('close_tab_')) {
        return;
    }
    
    let tabEntry = null;
    
    // Use lock mechanism to protect storage operations
    await withStorageLock('tabsToCloseLock', async () => {
        // Get current task list
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['tabsToClose'], resolve);
        });
        
        const tabsToClose = result.tabsToClose || [];
        
        // Find the corresponding task
        const tabEntryIndex = tabsToClose.findIndex(entry => entry.alarmName === alarm.name);
        
        if (tabEntryIndex === -1) {
            return;
        }
        
        // Save task information for use outside the lock
        tabEntry = tabsToClose[tabEntryIndex];
        
        // Remove the task
        tabsToClose.splice(tabEntryIndex, 1);
        
        // Save updated list
        await new Promise(resolve => {
            chrome.storage.local.set({ tabsToClose: tabsToClose }, resolve);
        });
    });
    
    // Close the tab outside the lock (if task was found)
    if (tabEntry) {
        chrome.tabs.remove(tabEntry.tabId, () => {
            if (chrome.runtime.lastError) {
                console.warn(`cannot close tab ${tabEntry.tabId}: ${chrome.runtime.lastError.message}`);
            }
        });
    }
}

// Function: Remove tab from close list
async function removeTabFromCloseList(tabId) {
    // Use lock mechanism to protect storage operations
    await withStorageLock('tabsToCloseLock', async () => {
        // Get current task list
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['tabsToClose'], resolve);
        });
        
        const tabsToClose = result.tabsToClose || [];
        
        // Find relevant tasks
        const tabEntries = tabsToClose.filter(entry => entry.tabId === tabId);
        
        if (tabEntries.length === 0) {
            return;
        }
        
        // Clear corresponding alarms
        for (const entry of tabEntries) {
            chrome.alarms.clear(entry.alarmName);
        }
        
        // Remove all relevant tasks
        const updatedTabsToClose = tabsToClose.filter(entry => entry.tabId !== tabId);
        
        // Save updated list
        await new Promise(resolve => {
            chrome.storage.local.set({ tabsToClose: updatedTabsToClose }, resolve);
        });
    });
}

// Check and recreate tab closing alarms
async function checkTabsToClose() {
    // Use lock mechanism to protect storage operations
    await withStorageLock('tabsToCloseLock', async () => {
        // Get current task list
        const result = await new Promise(resolve => {
            chrome.storage.local.get(['tabsToClose'], resolve);
        });
        
        const tabsToClose = result.tabsToClose || [];
        const now = Date.now();
        
        // Tasks to keep
        const entriesToKeep = [];
        
        // Check each task
        for (const entry of tabsToClose) {
            try {
                // Check if tab exists
                const tab = await new Promise((resolve, reject) => {
                    chrome.tabs.get(entry.tabId, tab => {
                        if (chrome.runtime.lastError) {
                            reject(new Error());
                        } else {
                            resolve(tab);
                        }
                    });
                });
                
                // Tab exists, check closing time
                if (entry.closeTime > now) {
                    // Tab scheduled to close in the future
                    
                    // Create alarm
                    chrome.alarms.create(entry.alarmName, {
                        when: entry.closeTime
                    });
                    
                    // Keep task
                    entriesToKeep.push(entry);
                } else {
                    // Tab should already be closed
                    chrome.tabs.remove(entry.tabId);
                    // Don't keep task
                }
            } catch (error) {
                // Tab doesn't exist
                
                // Clear corresponding alarm
                chrome.alarms.clear(entry.alarmName);
                // Don't keep task
            }
        }
        
        // Save updated list
        if (entriesToKeep.length !== tabsToClose.length) {
            await new Promise(resolve => {
                chrome.storage.local.set({ tabsToClose: entriesToKeep }, resolve);
            });
        }
    });
}

// --- Alarm Scheduling Logic ---

// Calculate timestamp for the next occurrence of HH:MM
function getNextTimestamp(timeString) { // timeString is "HH:MM"
    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    let nextOccurrence = new Date();
    nextOccurrence.setHours(hours, minutes, 0, 0); // Set target time for today

    // If the time has already passed for today, schedule it for tomorrow
    if (nextOccurrence <= now) {
        nextOccurrence.setDate(nextOccurrence.getDate() + 1);
    }

    return nextOccurrence.getTime();
}

// Calculate timestamp for a specific time
function getSpecificTimeTimestamp(timeString) {
    if (!timeString || typeof timeString !== 'string' || !timeString.includes(':')) {
        return null;
    }
    
    try {
        const now = new Date();
        const [hours, minutes] = timeString.split(':').map(Number);
        
        if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            return null;
        }
        
        const targetTime = new Date();
        targetTime.setHours(hours, minutes, 0, 0);
        
        // If target time has passed, set for tomorrow
        if (targetTime <= now) {
            targetTime.setDate(targetTime.getDate() + 1);
        }
        
        return targetTime.getTime();
    } catch (error) {
        return null;
    }
}

// Clear all existing alarms and set new ones based on storage
function scheduleAllAlarms() {
    chrome.storage.sync.get(['schedules'], (result) => {
        const schedules = result.schedules || [];

        // Clear all previous alarms related to this extension first
        chrome.alarms.getAll(existingAlarms => {
            existingAlarms.forEach(alarm => {
                if (alarm.name.startsWith('schedule_')) {
                    chrome.alarms.clear(alarm.name);
                }
            });

            // Create new alarms
            schedules.forEach((schedule, index) => {
                 if (schedule.url && schedule.time) { // Ensure valid entry
                     const alarmName = `schedule_${index}`; // Unique name for each schedule item
                     const nextTimestamp = getNextTimestamp(schedule.time);

                     chrome.alarms.create(alarmName, {
                         when: nextTimestamp
                     });
                 }
            });
        });
    });
}

// --- Event Listeners ---

// Run when the extension is first installed or updated
chrome.runtime.onInstalled.addListener(() => {
    scheduleAllAlarms();
    
    // Initialize tabsToClose list
    chrome.storage.local.get(['tabsToClose'], result => {
        if (!result.tabsToClose) {
            chrome.storage.local.set({ tabsToClose: [] });
        }
    });
});

// Run on browser startup (alarms might persist, but rescheduling ensures correctness)
chrome.runtime.onStartup.addListener(() => {
    scheduleAllAlarms();
    
    // Check and recreate tab closing alarms
    checkTabsToClose();
});

// Listen for changes in storage (when options are saved)
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && changes.schedules) {
        scheduleAllAlarms();
    }
});

// Listen for when an alarm fires
chrome.alarms.onAlarm.addListener((alarm) => {
    // Handle tab closing alarms
    if (alarm.name.startsWith('close_tab_')) {
        handleCloseTabAlarm(alarm);
        return;
    }

    if (alarm.name.startsWith('schedule_')) {
        const indexStr = alarm.name.split('_')[1];
        const index = parseInt(indexStr, 10);

        if (!isNaN(index)) {
            // Get the latest schedules from storage, in case they changed since the alarm was set
            chrome.storage.sync.get(['schedules'], (result) => {
                const schedules = result.schedules || [];
                const schedule = schedules[index];

                if (schedule && schedule.url && schedule.time) {
                    chrome.tabs.create({ url: schedule.url }, (tab) => {
                        // Handle auto-close
                        if (schedule.autoClose === 'after-duration') {
                            const closeDurationMs = parseInt(schedule.closeDuration, 10) * 60 * 1000;
                            if (!isNaN(closeDurationMs) && closeDurationMs > 0) {
                                const closeTimeMs = Date.now() + closeDurationMs;
                                scheduleTabClose(tab.id, closeTimeMs);
                            }
                        } else if (schedule.autoClose === 'at-time' && schedule.closeTime) {
                            const closeTimeMs = getSpecificTimeTimestamp(schedule.closeTime);
                            
                            if (closeTimeMs !== null) {
                                scheduleTabClose(tab.id, closeTimeMs);
                            }
                        }
                    });

                    // Reschedule for the next day
                    const nextTimestamp = getNextTimestamp(schedule.time);
                    // Ensure the new next timestamp is definitely in the future
                    let nextFireTime = new Date(nextTimestamp);
                    if (nextFireTime <= new Date()) { // If somehow it's still in the past/present
                        nextFireTime.setDate(nextFireTime.getDate() + 1); // Move to tomorrow
                    }

                    // Clear the just-fired alarm and create for next occurrence
                    chrome.alarms.clear(alarm.name, () => {
                        chrome.alarms.create(alarm.name, {
                            when: nextFireTime.getTime()
                        });
                    });
                } else {
                    // Clear orphaned alarm
                    chrome.alarms.clear(alarm.name);
                }
            });
        }
    }
});

// Listen for tab removals to clean up any pending close alarms for that tab
chrome.tabs.onRemoved.addListener((tabId) => {
    removeTabFromCloseList(tabId);
});

// Listen for clicks on the browser action icon to open the options page
chrome.action.onClicked.addListener(() => {
  chrome.runtime.openOptionsPage();
});