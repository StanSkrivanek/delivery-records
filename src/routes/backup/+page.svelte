<script lang="ts">
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let isLoading = $state(false);
	let message = $state('');
	let messageType: 'success' | 'error' = $state('success');
	let backups = $state(data.backups);

	async function createBackup() {
		isLoading = true;
		message = '';

		try {
			const response = await fetch('/api/backup?action=create');
			const result = await response.json();

			if (result.success) {
				messageType = 'success';
				message = result.message;
				// Reload backups list
				await reloadBackups();
			} else {
				messageType = 'error';
				message = result.message;
			}
		} catch (error) {
			messageType = 'error';
			message = error instanceof Error ? error.message : 'Failed to create backup';
		} finally {
			isLoading = false;
			// Auto-dismiss message after 5 seconds
			setTimeout(() => {
				message = '';
			}, 5000);
		}
	}

	async function restoreBackup(filename: string) {
		if (
			!confirm(
				`Are you sure you want to restore from "${filename}"?\n\nThis will replace your current database. A safety backup will be created automatically.`
			)
		) {
			return;
		}

		isLoading = true;
		message = '';

		try {
			const response = await fetch('/api/backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'restore', filename })
			});
			const result = await response.json();

			if (result.success) {
				messageType = 'success';
				message = result.message;
			} else {
				messageType = 'error';
				message = result.message;
			}
		} catch (error) {
			messageType = 'error';
			message = error instanceof Error ? error.message : 'Failed to restore backup';
		} finally {
			isLoading = false;
			// Auto-dismiss message after 8 seconds
			setTimeout(() => {
				message = '';
			}, 8000);
		}
	}

	async function deleteBackup(filename: string) {
		if (
			!confirm(`Are you sure you want to delete "${filename}"?\n\nThis action cannot be undone.`)
		) {
			return;
		}

		isLoading = true;
		message = '';

		try {
			const response = await fetch('/api/backup', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'delete', filename })
			});
			const result = await response.json();

			if (result.success) {
				messageType = 'success';
				message = result.message;
				// Reload backups list
				await reloadBackups();
			} else {
				messageType = 'error';
				message = result.message;
			}
		} catch (error) {
			messageType = 'error';
			message = error instanceof Error ? error.message : 'Failed to delete backup';
		} finally {
			isLoading = false;
			// Auto-dismiss message after 5 seconds
			setTimeout(() => {
				message = '';
			}, 5000);
		}
	}

	async function reloadBackups() {
		try {
			const response = await fetch('/api/backup');
			const result = await response.json();
			if (result.success) {
				backups = result.backups;
			}
		} catch (error) {
			console.error('Failed to reload backups:', error);
		}
	}

	function formatDate(date: Date | string): string {
		const d = typeof date === 'string' ? new Date(date) : date;
		return d.toLocaleString('en-GB', {
			year: 'numeric',
			month: 'short',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Database Backups - Delivery Records</title>
</svelte:head>

<div class="backup-page">
	<header class="page-header">
		<h1>Database Backups</h1>
		<p class="subtitle">
			Automatic daily backups are enabled. You can also create manual backups or restore from
			previous backups.
		</p>
	</header>

	{#if message}
		<div class="message {messageType}">
			{message}
		</div>
	{/if}

	<div class="actions">
		<button class="btn btn-primary" onclick={createBackup} disabled={isLoading}>
			{isLoading ? 'Creating...' : '📦 Create Backup Now'}
		</button>
	</div>

	<div class="backups-section">
		<h2>Available Backups ({backups.length})</h2>

		{#if backups.length === 0}
			<div class="empty-state">
				<p>No backups found.</p>
				<p class="help-text">
					Backups are stored at: <code>/Volumes/HD-700/SQL/delivery-backups</code>
				</p>
			</div>
		{:else}
			<div class="backups-list">
				<table>
					<thead>
						<tr>
							<th>Filename</th>
							<th>Created</th>
							<th>Size</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each backups as backup}
							<tr>
								<td class="filename">{backup.filename}</td>
								<td>{formatDate(backup.created)}</td>
								<td>{backup.size}</td>
								<td class="actions-cell">
									<button
										class="btn btn-small btn-secondary"
										onclick={() => restoreBackup(backup.filename)}
										disabled={isLoading}
										title="Restore this backup"
									>
										↻ Restore
									</button>
									<button
										class="btn btn-small btn-danger"
										onclick={() => deleteBackup(backup.filename)}
										disabled={isLoading}
										title="Delete this backup"
									>
										🗑️ Delete
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<div class="info-section">
		<h3>ℹ️ Backup Information</h3>
		<ul>
			<li>
				<strong>Automatic Backups:</strong> Daily backups are created automatically when the server is
				running
			</li>
			<li><strong>Backup Location:</strong> <code>/Volumes/HD-700/SQL/delivery-backups</code></li>
			<li>
				<strong>Retention:</strong> Last 30 backups are kept (older ones are automatically deleted)
			</li>
			<li>
				<strong>Manual Backup:</strong> Run <code>pnpm backup</code> in terminal for a manual backup
			</li>
			<li>
				<strong>Safety:</strong> When restoring, a safety backup of the current database is created automatically
			</li>
		</ul>
	</div>
</div>

<style>
	.backup-page {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
		color: #1a1a1a;
	}

	.subtitle {
		color: #666;
		font-size: 1rem;
	}

	.message {
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-weight: 500;
	}

	.message.success {
		background-color: #d4edda;
		color: #155724;
		border: 1px solid #c3e6cb;
	}

	.message.error {
		background-color: #f8d7da;
		color: #721c24;
		border: 1px solid #f5c6cb;
	}

	.actions {
		margin-bottom: 2rem;
	}

	.backups-section {
		margin-bottom: 2rem;
	}

	.backups-section h2 {
		font-size: 1.5rem;
		font-weight: 600;
		margin-bottom: 1rem;
		color: #1a1a1a;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		background: #f8f9fa;
		border-radius: 8px;
		color: #666;
	}

	.help-text {
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	code {
		background: #e9ecef;
		padding: 0.2rem 0.4rem;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.9em;
	}

	.backups-list {
		overflow-x: auto;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		background: white;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	thead {
		background: #f8f9fa;
	}

	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #e9ecef;
	}

	th {
		font-weight: 600;
		color: #495057;
		font-size: 0.875rem;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	tbody tr:hover {
		background: #f8f9fa;
	}

	tbody tr:last-child td {
		border-bottom: none;
	}

	.filename {
		font-family: 'Courier New', monospace;
		font-size: 0.9rem;
		color: #495057;
	}

	.actions-cell {
		white-space: nowrap;
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn-primary {
		background: #007bff;
		color: white;
	}

	.btn-primary:hover:not(:disabled) {
		background: #0056b3;
		transform: translateY(-1px);
		box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
	}

	.btn-small {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
		margin-right: 0.5rem;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
	}

	.btn-secondary:hover:not(:disabled) {
		background: #545b62;
	}

	.btn-danger {
		background: #dc3545;
		color: white;
	}

	.btn-danger:hover:not(:disabled) {
		background: #c82333;
	}

	.info-section {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border-left: 4px solid #007bff;
	}

	.info-section h3 {
		margin-top: 0;
		margin-bottom: 1rem;
		color: #1a1a1a;
	}

	.info-section ul {
		margin: 0;
		padding-left: 1.5rem;
	}

	.info-section li {
		margin-bottom: 0.5rem;
		color: #495057;
	}
</style>
