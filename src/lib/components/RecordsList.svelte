<!-- src/lib/components/RecordsList.svelte - CLEAN VERSION -->
<script lang="ts">
	import type { Record } from '$lib/db.server';

	let { records }: { records: Record[] } = $props();

	let showModal = $state(false);
	let modalImage = $state('');
	let modalAlt = $state('');

	let showEditModal = $state(false);
	let editRecord = $state<Record>({
		loaded: 0,
		collected: 0,
		cutters: 0,
		returned: 0,
		expense: 0,
		entry_date: '',
		image_path: ''
	});

	function openEditModal(record: Record) {
		editRecord = { ...record };
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
	}

	async function saveEdit() {
		const res = await fetch(`/api/records/${editRecord.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(editRecord)
		});
		if (res.ok) {
			const idx = records.findIndex((r) => r.id === editRecord.id);
			if (idx !== -1) records[idx] = { ...editRecord };
			showEditModal = false;
		} else {
			alert('Failed to update record.');
		}
	}

	function openImageModal(imagePath: any, recordId: any) {
		modalImage = `/${imagePath}`;
		modalAlt = `Record #${recordId} image`;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		modalImage = '';
		modalAlt = '';
	}

	function handleKeydown(event: { key: string }) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}

	function formatEntryDate(dateString: string | number | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			// year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="main-container">
	<h2>Recent Records</h2>

	{#if records.length === 0}
		<div class="no-records">
			<p>No records found.</p>
		</div>
	{:else}
		<div class="table-container">
			<table class="records-table">
				<thead>
					<tr>
						<!-- <th>ID</th> -->
						<th>Date</th>
						<th>Loaded</th>
						<th>Collected</th>
						<th>Cutters</th>
						<th>Returned</th>
						<th>Zong</th>
						<th>Expense</th>
						<th>Image</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record (record.id)}
						<tr>
							<!-- <td class="id-cell">#{record.id}</td> -->
							<td class="date-cell">
								{formatEntryDate(record.entry_date || record.entry_date)}
							</td>
							<td class="number-cell">{record.loaded}</td>
							<td class="number-cell">{record.collected}</td>
							<td class="number-cell">{record.cutters}</td>
							<td class="number-cell">{record.returned}</td>
							<td class="number-cell">{record.zong}</td>
							<td class="number-cell">{record.expense}</td>
							<td class="image-cell">
								{#if record.image_path}
									<button
										type="button"
										class="image-btn"
										onclick={() => openImageModal(record.image_path, record.id)}
										title="View image"
									>
										show Image
									</button>
								{:else}
									<span class="no-image">No image</span>
								{/if}
							</td>
							<td>
								<button class="image-btn" onclick={() => openEditModal(record)}>Edit</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Edit Modal -->
{#if showEditModal}
	<div
		class="modal-overlay"
		role="dialog"
		aria-modal="true"
		onclick={closeEditModal}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') closeEditModal();
		}}
		tabindex="0"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div class="modal-container edit-modal" role="document" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Edit Record | {formatEntryDate(editRecord.entry_date || editRecord.entry_date)}</h3>
				<button type="button" class="close-btn" onclick={closeEditModal} title="Close (Esc)"
					>✕</button
				>
			</div>
			<form
				class="modal-body edit-form"
				onsubmit={(e) => {
					e.preventDefault();
					saveEdit();
				}}
			>
				<div class="edit-fields">
					<label class="form-field">
						<span>Loaded:</span>
						<input type="number" bind:value={editRecord.loaded} min="0" />
					</label>
					<label class="form-field">
						<span>Collected:</span>
						<input type="number" bind:value={editRecord.collected} min="0" />
					</label>
					<label class="form-field">
						<span>Cutters:</span>
						<input type="number" bind:value={editRecord.cutters} min="0" />
					</label>
					<label class="form-field">
						<span>Returned:</span>
						<input type="number" bind:value={editRecord.returned} min="0" />
					</label>
					<label class="form-field">
						<span>Zong:</span>
						<input type="number" bind:value={editRecord.zong} min="0"/>
					</label>
					<label class="form-field">
						<span>Expense:</span>
						<input type="number" bind:value={editRecord.expense} min="0" />
					</label>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn-secondary" onclick={closeEditModal}>Cancel</button>
					<button type="submit" class="btn-primary">Save Changes</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Image Modal -->
{#if showModal}
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Close modal"
		onclick={closeModal}
		onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && closeModal()}
	>
		<div
			class="modal-container"
			role="dialog"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
			tabindex="0"
			onkeydown={(e) => {
				if (e.key === 'Escape') closeModal();
			}}
		>
			<div class="modal-header">
				<h3>Image Preview</h3>
				<button type="button" class="close-btn" onclick={closeModal} title="Close (Esc)">
					✕
				</button>
			</div>
			<div class="modal-body">
				<img src={modalImage} alt={modalAlt} class="modal-image" />
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" onclick={closeModal}> Close </button>
			</div>
		</div>
	</div>
{/if}

<style>
	.main-container {
		max-width: var(--max-w, 800px);
		margin: 2rem auto;
		padding: 0 2rem;
	}

	h2 {
		color: #333;
		margin-bottom: 1.5rem;
	}

	.no-records {
		text-align: center;
		color: #666;
		font-style: italic;
		padding: 2rem;
	}

	.table-container {
		background: white;
		border-radius: 8px;
		border: 1px solid #ddd;
		overflow: hidden;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.records-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.9rem;
	}

	.records-table thead {
		background: #f8f9fa;
	}

	.records-table th {
		padding: 1rem 0.75rem;
		text-align: left;
		font-weight: 600;
		color: #333;
		border-bottom: 2px solid #dee2e6;
		position: sticky;
		top: 0;
		background: #f8f9fa;
		z-index: 10;
	}

	.records-table td {
		padding: 0.75rem;
		border-bottom: 1px solid #dee2e6;
		vertical-align: middle;
	}

	.records-table tbody tr:hover {
		background-color: #f8f9fa;
	}

	.records-table tbody tr:last-child td {
		border-bottom: none;
	}

	/* .id-cell {
		font-weight: 600;
		color: #007bff;
		width: 80px;
	} */

	.date-cell {
		color: #666;
		font-size: 0.9rem;
		width: 120px;
		font-weight: 500;
	}

	.number-cell {
		text-align: center;
		font-weight: 500;
		width: 90px;
	}

	.image-cell {
		text-align: center;
		width: 120px;
	}

	.image-btn {
		background: #286ca7;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
	}

	.image-btn:hover {
		background: #218838;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.image-btn:active {
		transform: translateY(0);
	}

	.no-image {
		color: #999;
		font-style: italic;
		font-size: 0.8rem;
	}

	/* Modal Styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.8);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-container {
		background: white;
		border-radius: 8px;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		animation: modalAppear 0.2s ease-out;
	}

	@keyframes modalAppear {
		from {
			opacity: 0;
			transform: scale(0.9) translateY(-20px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid #dee2e6;
	}

	.modal-header h3 {
		margin: 0;
		color: #333;
		font-size: 1.25rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #666;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.close-btn:hover {
		background: #f8f9fa;
		color: #333;
	}

	.modal-body {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		overflow: hidden;
	}

	.modal-image {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.modal-footer {
		padding: 1rem 1.5rem;
		border-top: 1px solid #dee2e6;
		display: flex;
		justify-content: flex-end;
	}

	.btn-secondary {
		background: #6c757d;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.btn-secondary:hover {
		background: #5a6268;
	}
	/* Edit Form Styles */
	.edit-modal {
		width: 400px;
		max-width: 90vw;
	}

	.edit-form {
		padding: 1.5rem;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
	}

	.edit-fields {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.form-field {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.75rem;
		justify-content: space-between;
	}

	.form-field span {
		font-weight: 500;
		min-width: 80px;
	}

	.form-field input {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.form-field input:focus {
		outline: none;
		border-color: #80bdff;
		box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
	}
	.btn-primary {
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 1rem;
		cursor: pointer;
		transition:
			background-color 0.2s ease,
			transform 0.1s ease;
		font-weight: 500;
	}

	.btn-primary:hover {
		background: #0069d9;
		transform: translateY(-1px);
	}

	.btn-primary:active {
		transform: translateY(0);
	}
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 0;
	}
	.modal-footer button {
		padding: 0.5rem 1rem;
		font-size: 0.9rem;
		border-radius: 4px;
		border: none;
		cursor: pointer;
	}
	.modal-footer .btn-secondary {
		background: #f85733;
		color: white;
	}
	/* Responsive Design */
	@media (max-width: 768px) {
		.main-container {
			padding: 0 1rem;
		}

		.table-container {
			overflow-x: auto;
		}

		.records-table {
			min-width: 600px;
		}

		.records-table th,
		.records-table td {
			padding: 0.5rem 0.4rem;
		}

		.image-btn {
			font-size: 0.7rem;
			padding: 0.4rem 0.6rem;
		}

		.modal-container {
			margin: 1rem;
			max-width: calc(100vw - 2rem);
			max-height: calc(100vh - 2rem);
		}

		.modal-header {
			padding: 0.75rem 1rem;
		}

		.modal-body {
			padding: 0.75rem;
		}

		.modal-image {
			max-height: 60vh;
		}
	}

	@media (max-width: 480px) {
		.records-table {
			font-size: 0.8rem;
		}

		.records-table th,
		.records-table td {
			padding: 0.4rem 0.3rem;
		}

		.image-btn {
			font-size: 0.65rem;
			padding: 0.3rem 0.5rem;
		}

		h2 {
			font-size: 1.25rem;
		}
	}
</style>
