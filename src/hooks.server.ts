import { checkForChanges, createBackup } from '$lib/backup.server';
import type { Handle } from '@sveltejs/kit';

// Track last backup check time
let lastBackupDate: string | null = null;
let midnightCheckScheduled = false;

/**
 * Calculates milliseconds until next midnight
 */
function getMillisecondsUntilMidnight(): number {
	const now = new Date();
	const midnight = new Date(now);
	midnight.setHours(24, 0, 0, 0); // Next midnight
	return midnight.getTime() - now.getTime();
}

/**
 * Gets the current date as a string (YYYY-MM-DD)
 */
function getCurrentDateString(): string {
	const now = new Date();
	return now.toISOString().split('T')[0];
}

/**
 * Performs backup if database has changed
 */
async function performBackupIfChanged() {
	const today = getCurrentDateString();

	// Check if we already backed up today
	if (lastBackupDate === today) {
		console.log('⏭️  Backup already performed today');
		return;
	}

	// Check if there are changes
	if (!checkForChanges()) {
		console.log('ℹ️  No database changes detected, skipping backup');
		lastBackupDate = today; // Mark as checked for today
		return;
	}

	// Perform backup
	try {
		console.log('🔄 Database changes detected, starting backup...');
		const result = await createBackup();
		if (result.success) {
			lastBackupDate = today;
			console.log(`✅ Automatic backup completed: ${result.message}`);
		} else {
			console.error(`❌ Automatic backup failed: ${result.message}`);
		}
	} catch (error) {
		console.error('Error during automatic backup:', error);
	}
}

/**
 * Schedules the next midnight backup check
 */
function scheduleMidnightBackup() {
	if (midnightCheckScheduled) {
		return; // Already scheduled
	}

	const msUntilMidnight = getMillisecondsUntilMidnight();
	console.log(
		`⏰ Next backup check scheduled for midnight (in ${(msUntilMidnight / (1000 * 60 * 60)).toFixed(1)} hours)`
	);

	setTimeout(() => {
		midnightCheckScheduled = false;
		performBackupIfChanged();
		scheduleMidnightBackup(); // Schedule next midnight
	}, msUntilMidnight);

	midnightCheckScheduled = true;
}

// Perform initial backup check on server start (after 2 minutes delay)
setTimeout(() => {
	console.log('🚀 Running initial backup check...');
	performBackupIfChanged();
}, 120 * 1000);

// Schedule midnight backups
scheduleMidnightBackup();

export const handle: Handle = async ({ event, resolve }) => {
	return resolve(event);
};
