<!-- src/lib/components/RecordsList.svelte -->
<script lang="ts">
	import type { Record } from '$lib/db.server';
	import { formatDate } from '$lib/utils';

	let { records }: { records: Record[] } = $props();

	let showModal = $state(false);
	let modalImage = $state('');
	let modalAlt = $state('');

	// Edit modal state
	let showEditModal = $state(false);
	let editRecord = $state<Record>({
		loaded: 0,
		collected: 0,
		cutters: 0,
		returned: 0,
		image_path: '',
		date_created: ''
	});

	function openEditModal(record: Record) {
		// Create a copy of the record with string values for text inputs
		editRecord = {
			...record,
			loaded: record.loaded.toString(),
			collected: record.collected.toString(),
			cutters: record.cutters.toString(),
			returned: record.returned.toString()
		};
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
	}

	async function saveEdit() {
		// Convert string values back to numbers before saving
		const recordToSave = {
			...editRecord,
			loaded: parseInt(editRecord.loaded as string) || 0,
			collected: parseInt(editRecord.collected as string) || 0,
			cutters: parseInt(editRecord.cutters as string) || 0,
			returned: parseInt(editRecord.returned as string) || 0
		};

		// Immediately update the local records array for immediate UI feedback
		const idx = records.findIndex((r) => r.id === editRecord.id);
		if (idx !== -1) {
			// Create a new array with the updated record
			records = [...records.slice(0, idx), recordToSave, ...records.slice(idx + 1)];
		}

		// Close modal early to improve perceived performance
		showEditModal = false;

		// Then send the update to the server
		const res = await fetch(`/api/records/${editRecord.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(recordToSave)
		});

		// If the server request fails, show an error and potentially revert the change
		if (!res.ok) {
			alert('Failed to update record on the server. The page may show outdated data.');
			// Optionally, you could refetch the data here to ensure UI consistency
			// Or implement a more sophisticated rollback mechanism
		}
	}

	// calculate total for D-total column - ensure it works with both number and string types
	function calculateTotal(record: Record): number {
		// Convert values to numbers if they're strings
		const loadedValue =
			typeof record.loaded === 'string' ? parseInt(record.loaded) || 0 : record.loaded;
		const returnedValue =
			typeof record.returned === 'string' ? parseInt(record.returned) || 0 : record.returned;

		// loaded - returned
		return loadedValue - returnedValue;
	}

	function openImageModal(imagePath: string, recordId: number) {
		modalImage = `/${imagePath}`;
		modalAlt = `Record #${recordId} image`;
		showModal = true;
	}

	function closeModal() {
		showModal = false;
		modalImage = '';
		modalAlt = '';
	}

	// Close modal on escape key
	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && showModal) {
			closeModal();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="records-container">
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
						<th>Date</th>
						<th>Loaded</th>
						<th>Collected</th>
						<th>Cutters</th>
						<th>Returned</th>
						<th>D-total</th>
						<th>Image</th>
						<th>Edit</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record (record.id)}
						<tr>
							<td class="date-cell">{formatDate(record.date_created!)}</td>
							<td class="td-cell">{record.loaded}</td>
							<td class="td-cell">{record.collected}</td>
							<td class="td-cell">{record.cutters}</td>
							<td class="td-cell">{record.returned}</td>
							<td class="td-cell">{calculateTotal(record)}</td>
							<td class="td-cell">
								{#if record.image_path}
									<button
										type="button"
										class="td-btn"
										onclick={() => openImageModal(record.image_path!, record.id!)}
										title="View image">View Image</button
									>
								{:else}
									<span class="no-image">No image</span>
								{/if}
							</td>
							<td class="td-cell">
								<button class="td-btn" onclick={() => openEditModal(record)}>Edit</button>
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
				<h3>Edit Record</h3>
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
						<input type="text" bind:value={editRecord.loaded} required />
					</label>
					<label class="form-field">
						<span>Collected:</span>
						<input type="text" bind:value={editRecord.collected} required />
					</label>
					<label class="form-field">
						<span>Cutters:</span>
						<input type="text" bind:value={editRecord.cutters} required />
					</label>
					<label class="form-field">
						<span>Returned:</span>
						<input type="text" bind:value={editRecord.returned} required />
					</label>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn-danger" onclick={closeEditModal}>Cancel</button>
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
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') closeModal();
		}}
	>
		<div
			class="modal-container"
			role="dialog"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
			tabindex="0"
			onkeydown={(e) => {
				// Prevent propagation for keyboard events inside modal
				e.stopPropagation();
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
	.records-container {
		max-width: 1200px;
		margin: 2rem auto;
		padding: 0 2rem;
	}

	h2 {
		color: #333;
		margin-bottom: 1.5rem;
		font-size: 1.5rem;
		font-weight: 600;
	}

	.no-records {
		text-align: center;
		padding: 3rem;
		background: white;
		border-radius: 8px;
		border: 1px solid #ddd;
	}

	.no-records p {
		color: #666;
		font-style: italic;
		margin: 0;
		font-size: 1.1rem;
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
		text-align: center;
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
		/* vertical-align: middle; */
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
		font-size: 0.85rem;
		/* width: 140px; */
	}

	.td-cell {
		text-align: center;
		font-weight: 500;
		/* width: 100px; */
	}

	/* .image-cell { */
	/* text-align: center; */
	/* width: 120px; */
	/* } */

	.td-btn {
		background: #28a745;
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

	.td-btn:hover {
		background: #218838;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.td-btn:active {
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
		padding: 1rem;
		border-top: 1px solid #dee2e6;
		display: flex;
		justify-content: flex-end;
		gap: 1rem;
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
.btn-danger {
		background: #dc4832;
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

	/* Responsive Design */
	@media (max-width: 768px) {
		.records-container {
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

		.date-cell {
			font-size: 0.75rem;
		}

		.td-btn {
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

		.td-btn {
			font-size: 0.65rem;
			padding: 0.3rem 0.5rem;
		}

		h2 {
			font-size: 1.25rem;
		}
	}
</style>
