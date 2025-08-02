<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import Modal from '$lib/components/popups/Modal.svelte';

	let { records } = $props();

	let modalImage = $state('');
	let modalAlt = $state('');

	let editRecord = $state({
		id: undefined as number | undefined,
		loaded: 0,
		collected: 0,
		cutters: 0,
		returned: 0,
		missplaced: 0,
		expense: 0,
		odometer: 0,
		note: '',
		entry_date: '',
		image_path: ''
	});

	// Separate state for the image file in edit modal
	let editImageFile = $state<File | null>(null);

	// Delete dialog state
	let recordIdToDelete = $state<number | null>(null);

	let showModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showNoteModal = $state(false);
	let modalNote = $state('');

	/**
	 * @param {{ loaded: number; collected: number; cutters: number; returned: number; missplaced: number; expense: number; entry_date: string; image_path: string; }} record
	 */
	function openEditModal(record: {
		id?: number;
		loaded: number;
		collected: number;
		cutters: number;
		returned: number;
		missplaced?: number;
		expense?: number;
		odometer?: number;
		image_path?: string;
		note?: string;
		entry_date: string;
		created_at?: string;
	}) {
		editRecord = {
			id: record.id ?? undefined,
			loaded: record.loaded,
			collected: record.collected,
			cutters: record.cutters,
			returned: record.returned,
			missplaced: record.missplaced ?? 0,
			expense: record.expense ?? 0,
			odometer: record.odometer ?? 0,
			image_path: record.image_path ?? '',
			note: record.note || '',
			entry_date: record.entry_date
		};
		editImageFile = null; // Reset image file
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editImageFile = null;
	}

	async function saveEdit() {
		try {
			// Create FormData to handle both regular data and file upload
			const formData = new FormData();
			formData.append('loaded', editRecord.loaded.toString());
			formData.append('collected', editRecord.collected.toString());
			formData.append('cutters', editRecord.cutters.toString());
			formData.append('returned', editRecord.returned.toString());
			formData.append('missplaced', editRecord.missplaced.toString());
			formData.append('expense', editRecord.expense.toString());
			formData.append('odometer', editRecord.odometer.toString());
			formData.append('note', editRecord.note || '');
			formData.append('entry_date', editRecord.entry_date);

			// Add image file if a new one was selected
			if (editImageFile) {
				formData.append('image', editImageFile);
			}

			// Add existing image path if no new image was selected
			if (!editImageFile && editRecord.image_path) {
				formData.append('existing_image_path', editRecord.image_path);
			}

			const res = await fetch(`/api/records/${editRecord.id}`, {
				method: 'PUT',
				body: formData // Send FormData instead of JSON
			});

			if (res.ok) {
				const updatedRecord = await res.json();
				const idx = records.findIndex((r: { id: number | undefined }) => r.id === editRecord.id);
				if (idx !== -1) {
					records[idx] = updatedRecord;
				}
				closeEditModal(); // Explicitly close modal
				await invalidateAll();
			} else {
				const error = await res.text();
				console.error('API Error:', error);
				alert(`Failed to update record: ${error}`);
			}
		} catch (error) {
			console.error('Error updating record:', error);
			alert('Failed to update record.');
		}
	}

	function openImageModal(imagePath: string, recordId: string | number) {
		modalImage = `/${imagePath}`;
		modalAlt = `Record #${recordId} image`;
		showModal = true;
	}

	function closeNoteModal() {
		showNoteModal = false;
		modalNote = '';
	}
	function handleKeydown(event: { key: string }) {
		// Keyboard navigation can be handled by the universal Modal component
	}

	function formatEntryDate(dateString: string | number | Date) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	}

	function openDeleteModal(recordId: number) {
		recordIdToDelete = recordId;
		showDeleteModal = true;
	}
	function openNoteModal(note: string) {
		modalNote = note;
		showNoteModal = true;
	}
	function closeDeleteModal() {
		showDeleteModal = false;
		recordIdToDelete = null;
	}

	async function confirmDeleteRecord() {
		if (recordIdToDelete !== null) {
			// Optimistically remove from local array for instant feedback
			records = records.filter((r: { id: number | undefined }) => r.id !== recordIdToDelete);

			const recordToDelete = recordIdToDelete;
			closeDeleteModal(); // Close modal immediately

			try {
				const res = await fetch(`/api/records/${recordToDelete}`, { method: 'DELETE' });
				if (!res.ok) {
					alert('Failed to delete record. The page may show outdated data.');
				}
				await invalidateAll();
			} catch (error) {
				console.error('Error deleting record:', error);
				alert('Failed to delete record.');
			}
		}
	}

	// Handle image file selection in edit modal
	function handleEditImageSelected(file: File | null) {
		editImageFile = file;
	}

	function handleEditImageRemoved() {
		editImageFile = null;
		editRecord.image_path = ''; // Also clear the existing image path
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="main-container">
	<div class="header">
		<h2>Recent Records</h2>
	</div>

	{#if records.length === 0}
		<div class="no-records">
			<p>No records found.</p>
		</div>
	{:else}
		<div class="table-container">
			<table class="records-table">
				<thead>
					<tr>
						<th class="date-cell">Date</th>
						<th class="number-cell">Loaded</th>
						<th class="number-cell">Collected</th>
						<th class="number-cell">Cutters</th>
						<th class="number-cell">Returned</th>
						<th class="number-cell">Missplaced</th>
						<th class="number-cell">Expense</th>
						<th class="number-cell">Odometer</th>
						<th class="info-cell">Note</th>
						<th class="info-cell">Image</th>
						<th class="info-cell">Edit</th>
						<th class="info-cell">Delete</th>
					</tr>
				</thead>
				<tbody>
					{#each records as record (record.id)}
						<tr>
							<td class="date-cell">
								{formatEntryDate(record.entry_date || record.date_created)}
							</td>
							<td class="number-cell">{record.loaded}</td>
							<td class="number-cell">{record.collected}</td>
							<td class="number-cell">{record.cutters}</td>
							<td class="number-cell">{record.returned}</td>
							<td class="number-cell">{record.missplaced || 0}</td>
							<td class="number-cell">{record.expense || 0}</td>
							<td class="number-cell">{record.odometer || 0}</td>
							<td class="info-cell"
								>{#if record.note}<button
										type="button"
										class="btn purple"
										onclick={() => openNoteModal(record.note)}>View Note</button
									>{:else}
									No Note
								{/if}</td
							>
							<td class="info-cell">
								{#if record.image_path}
									<button
										type="button"
										class="btn blue"
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
								<button class="btn green" onclick={() => openEditModal(record)}>Edit</button>
							</td>
							<td>
								<button
									class="btn red"
									onclick={() => record.id !== undefined && openDeleteModal(record.id)}
									title="Delete record"
								>
									Delete
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<!-- Image Modal using universal Modal -->
<Modal bind:showModal>
	{#snippet header()}
		<h2>Image Preview</h2>
	{/snippet}
	{#snippet children()}
		<div class="image-modal-content">
			<img src={modalImage} alt={modalAlt} class="modal-image" />
		</div>
	{/snippet}
</Modal>

<!-- Delete Confirmation Modal using universal Modal -->
<Modal bind:showModal={showDeleteModal}>
	{#snippet header()}
		<h2>Confirm Delete</h2>
	{/snippet}
	{#snippet children()}
		<div class="delete-modal-content">
			<p>Are you sure you want to delete this record?</p>
		</div>
	{/snippet}
	{#snippet footer()}
		<div class="delete-modal-actions">
			<button type="button" class="btn red" onclick={() => closeDeleteModal()}>Cancel</button>
			<button type="button" class="btn blue" onclick={() => confirmDeleteRecord()}>Delete</button>
		</div>
	{/snippet}
</Modal>

<!-- Edit Modal using universal Modal -->
<Modal bind:showModal={showEditModal}>
	{#snippet header()}
		<h2>Edit Record | {formatEntryDate(editRecord.entry_date)}</h2>
	{/snippet}
	{#snippet children()}
		<form class="edit-form">
			<div class="edit-fields">
				<div class="edit-group">
					<label class="form-field">
						<span>Entry Date:</span>
						<input type="date" bind:value={editRecord.entry_date} required />
					</label>
					<label class="form-field">
						<span>Loaded:</span>
						<input type="number" bind:value={editRecord.loaded} min="0" required />
					</label>
					<label class="form-field">
						<span>Collected:</span>
						<input type="number" bind:value={editRecord.collected} min="0" required />
					</label>
					<label class="form-field">
						<span>Cutters:</span>
						<input type="number" bind:value={editRecord.cutters} min="0" required />
					</label>
				</div>
				<div class="edit-group">
					<label class="form-field">
						<span>Returned:</span>
						<input type="number" bind:value={editRecord.returned} min="0" required />
					</label>
					<label class="form-field">
						<span>Missplaced:</span>
						<input type="number" bind:value={editRecord.missplaced} min="0" />
					</label>
					<label class="form-field">
						<span>Expense:</span>
						<input type="number" bind:value={editRecord.expense} min="0" step="0.01" />
					</label>
					<label class="form-field">
						<span>Odometer:</span>
						<input type="number" bind:value={editRecord.odometer} min="0" required />
					</label>
				</div>
				<div class="edit-group">
					<label class="form-field">
						<span>Note:</span>
						<textarea bind:value={editRecord.note} rows="16" placeholder="Enter note (optional)"
						></textarea>
					</label>
				</div>

				<!-- Image Upload Section -->
				<div class="form-field image-upload-section">
					<div>
						<span>Image:</span>
						<div class="image-upload-wrapper">
							{#if editRecord.image_path && !editImageFile}
								<div class="current-image">
									<!-- svelte-ignore a11y_img_redundant_alt -->
									<img
										src="/{editRecord.image_path}"
										alt="Current image"
										class="current-image-preview"
									/>
									<p class="current-image-text">Current image</p>
									<button
										type="button"
										class="btn-remove-current"
										onclick={() => (editRecord.image_path = '')}
									>
										Remove current image
									</button>
								</div>
							{:else}
								<ImageUpload
									bind:selectedFile={editImageFile}
									onFileSelected={handleEditImageSelected}
									onFileRemoved={handleEditImageRemoved}
								/>
							{/if}
						</div>
						{#if editImageFile}
							<p class="new-image-text">New image will replace current image</p>
						{/if}
					</div>
				</div>
			</div>
		</form>
	{/snippet}
	{#snippet footer()}
		<div class="edit-modal-actions">
			<button type="button" class="btn red" onclick={closeEditModal}>Cancel</button>
			<button type="button" class="btn blue" onclick={() => saveEdit()}>Save Changes</button>
		</div>
	{/snippet}
</Modal>
<!-- Note Modal using universal Modal -->
<Modal bind:showModal={showNoteModal}>
	{#snippet header()}
		<h2>Note Preview</h2>
	{/snippet}
	{#snippet children()}
		<div class="note-modal-content">
			<p>{modalNote}</p>
		</div>
	{/snippet}
</Modal>

<style>
	.main-container {
		max-width: var(--max-w, 1200px);
		margin: 2rem auto;
		padding: 0 2rem;
	}
	.header {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 2rem;
		& h2 {
			/* justify-content: ; */
			margin-bottom: 1.5rem;
			font-size: 3rem;
		}
	}

	.no-records {
		text-align: center;
		/* color: #666; */
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
		text-align: center;
		/* border-bottom: 2px solid #dee2e6; */
	}

	.records-table th {
		padding: 1rem 0.75rem;
		/* text-align: left; */
		font-weight: 600;
		/* color: #333; */
		border-bottom: 2px solid #dee2e6;
		position: sticky;
		top: 0;
		background: #f8f9fa;
		z-index: 10;
		/* text-align: center; */
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

	.date-cell {
		/* color: #666; */
		font-size: 0.9rem;
		font-weight: 500;
		text-align: left;
	}

	.number-cell {
		text-align: right;
		font-weight: 500;
	}

	.info-cell {
		text-align: center;
	}

	.btn {
		/* background: #719ffb; */
		/* color: black; */
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

	.btn:hover {
		/* background: #3f5bb5; */
		color: white;
		transform: translateY(-1px);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	.btn:active {
		transform: translateY(0);
	}

	.no-image {
		color: var(--color-slate-400);
		font-style: italic;
		font-size: 0.8rem;
	}

	/* Edit Form Styles */
	.edit-form {
		padding: 0;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
	}

	.edit-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
		& .edit-group {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			height: 100%;
			& textarea {
				resize: none;
				min-height: 100px;
				max-width: 100%;
				padding: 0.6rem;
				border: 1px solid #dee2e6;
				border-radius: 4px;
				font-size: 0.9rem;
			}
		}
	}

	.form-field {
		display: flex;
		flex-direction: column;
		/* align-items: center; */
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

	/* Image Upload Styles */
	.image-upload-section {
		flex-direction: column;
		align-items: stretch;
		gap: 1rem;
	}

	.image-upload-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 0.75rem;
	}

	.current-image {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		background: #f8f9fa;
	}

	.current-image-preview {
		max-width: 150px;
		max-height: 150px;
		object-fit: cover;
		border-radius: 4px;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.current-image-text {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.btn-remove-current {
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.4rem 0.8rem;
		font-size: 0.8rem;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.btn-remove-current:hover {
		background: #c82333;
	}

	.blue {
		background: var(--color-blue-500);
		color: white;
	}
	.purple {
		background: #c686ff;
		color: white;
	}
	.green {
		background: var(--color-emerald-500);
		color: white;
	}

	.red {
		background: var(--color-red-500);
		color: white;
	}

	.new-image-text {
		margin: 0;
		font-size: 0.85rem;
		color: #28a745;
		font-weight: 500;
	}

	/* Modal content styles */
	.image-modal-content {
		display: flex;
		justify-content: center;
		align-items: center;
		padding: 1rem;
	}

	.modal-image {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.delete-modal-content {
		text-align: center;
		padding: 1rem;
	}

	.delete-modal-actions {
		display: flex;
		justify-content: center;
		gap: 1rem;
	}

	.note-modal-content {
		padding: 1rem;
		max-height: 300px;
		overflow-y: auto;
	}

	.edit-modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
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
			min-width: 800px;
		}

		.records-table th,
		.records-table td {
			padding: 0.5rem 0.4rem;
		}

		.btn {
			font-size: 0.7rem;
			padding: 0.4rem 0.6rem;
		}

		/* .edit-modal {
			width: 90vw;
			margin: 1rem;
		} */

		.form-field {
			flex-direction: column;
			align-items: stretch;
		}

		.form-field span {
			min-width: auto;
		}
	}
</style>
