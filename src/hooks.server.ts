import { createBackup } from '$lib/backup.server';
import type { Handle } from '@sveltejs/kit';

// Track last backup time
let lastBackupTime = 0;
const BACKUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Checks if a backup should be performed and creates one if needed
 */
async function checkAndPerformBackup() {
	const now = Date.now();

	// Only perform backup if enough time has passed
	if (now - lastBackupTime >= BACKUP_INTERVAL) {
		try {
			const result = await createBackup();
			if (result.success) {
				lastBackupTime = now;
				console.log(`✅ Automatic backup completed: ${result.message}`);
			} else {
				console.error(`❌ Automatic backup failed: ${result.message}`);
			}
		} catch (error) {
			console.error('Error during automatic backup:', error);
		}
	}
}

// Perform initial backup on server start (after 1 minute delay)
setTimeout(() => {
	checkAndPerformBackup();
}, 60 * 1000);

// Set up interval for daily backups
setInterval(() => {
	checkAndPerformBackup();
}, BACKUP_INTERVAL);

export const handle: Handle = async ({ event, resolve }) => {
	// Perform the backup check on each request (but it will only backup once per day)
	// This ensures backups happen even if the server is idle
	checkAndPerformBackup();

	return resolve(event);
};
