import { createBackup, deleteBackup, listBackups, restoreBackup } from '$lib/backup.server';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * GET /api/backup - List all backups
 * GET /api/backup?action=create - Create a new backup
 * GET /api/backup?action=list - List all backups (same as GET without params)
 */
export const GET: RequestHandler = async ({ url }) => {
	const action = url.searchParams.get('action');

	try {
		if (action === 'create') {
			const result = await createBackup();
			return json(result, { status: result.success ? 200 : 500 });
		}

		// Default: list backups
		const backups = listBackups();
		return json({
			success: true,
			backups,
			count: backups.length
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{
				success: false,
				message: `Backup operation failed: ${message}`
			},
			{ status: 500 }
		);
	}
};

/**
 * POST /api/backup - Create a new backup or restore from backup
 * Body: { action: 'create' | 'restore' | 'delete', filename?: string }
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		const { action, filename } = body;

		if (action === 'create') {
			const result = await createBackup();
			return json(result, { status: result.success ? 200 : 500 });
		}

		if (action === 'restore') {
			if (!filename) {
				return json(
					{
						success: false,
						message: 'Filename is required for restore action'
					},
					{ status: 400 }
				);
			}
			const result = await restoreBackup(filename);
			return json(result, { status: result.success ? 200 : 500 });
		}

		if (action === 'delete') {
			if (!filename) {
				return json(
					{
						success: false,
						message: 'Filename is required for delete action'
					},
					{ status: 400 }
				);
			}
			const result = await deleteBackup(filename);
			return json(result, { status: result.success ? 200 : 500 });
		}

		return json(
			{
				success: false,
				message: 'Invalid action. Use "create", "restore", or "delete"'
			},
			{ status: 400 }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json(
			{
				success: false,
				message: `Backup operation failed: ${message}`
			},
			{ status: 500 }
		);
	}
};
