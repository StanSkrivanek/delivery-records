<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ImageUpload from './ImageUpload.svelte';

	let { records } = $props();
	console.log("🚀 ~ records:", records)

	let showModal = $state(false);
	let modalImage = $state('');
	let modalAlt = $state('');

	let showEditModal = $state(false);
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
	let showDeleteModal = $state(false);
	let recordIdToDelete = $state(null);

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
			note: record.note ?? '',
			entry_date: record.entry_date,
		};
		editImageFile = null; // Reset image file
		showEditModal = true;
	}

	function closeEditModal() {
		showEditModal = false;
		editImageFile = null;
	}
	// function to format number 123.456

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
				showEditModal = false;
				editImageFile = null;
				await invalidateAll();
			} else {
				const error = await res.text();
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
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	}

	function openDeleteModal(recordId: null) {
		recordIdToDelete = recordId;
		showDeleteModal = true;
	}

	function closeDeleteModal() {
		showDeleteModal = false;
		recordIdToDelete = null;
	}

	async function confirmDeleteRecord() {
		if (recordIdToDelete !== null) {
			// Optimistically remove from local array for instant feedback
			records = records.filter((r: { id: null }) => r.id !== recordIdToDelete);
			showDeleteModal = false;

			try {
				const res = await fetch(`/api/records/${recordIdToDelete}`, { method: 'DELETE' });
				if (!res.ok) {
					alert('Failed to delete record. The page may show outdated data.');
				}
				await invalidateAll();
			} catch (error) {
				console.error('Error deleting record:', error);
				alert('Failed to delete record.');
			}

			recordIdToDelete = null;
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
						<th>Date</th>
						<th>Loaded</th>
						<th>Collected</th>
						<th>Cutters</th>
						<th>Returned</th>
						<th>Missplaced</th>
						<th>Expense</th>
						<th>Odometer</th>
						<th>Note</th>
						<th>Image</th>
						<th>Edit</th>
						<th>Delete</th>
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
							<td class="note-cell">{record.note || ' --- '}</td>
							<td class="image-cell">
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

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-overlay" role="dialog" aria-modal="true" tabindex="0">
		<dialog class="modal-container" open>
			<div class="modal-header">
				<h3>Confirm Delete</h3>
			</div>
			<div class="modal-body">
				<p>Are you sure you want to delete this record?</p>
			</div>
			<div class="modal-footer">
				<button class="btn red" onclick={closeDeleteModal}>Cancel</button>
				<button class="btn blue" onclick={confirmDeleteRecord}>Delete</button>
			</div>
		</dialog>
	</div>
{/if}

<!-- Edit Modal -->
{#if showEditModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="modal-overlay" role="dialog" aria-modal="true" onclick={closeEditModal} tabindex="0">
		<dialog class="modal-container" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h3>Edit Record | {formatEntryDate(editRecord.entry_date)}</h3>
				<button type="button" class="btn red" onclick={closeEditModal} title="Close (Esc)">✕</button
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
							<textarea bind:value={editRecord.note} rows="16" required></textarea>
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
				<div class="modal-footer">
					<button type="button" class="btn red" onclick={closeEditModal}>Cancel</button>
					<button type="submit" class="btn blue">Save Changes</button>
				</div>
			</form>
		</dialog>
	</div>
{/if}

<!-- Image Modal -->
{#if showModal}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_interactive_supports_focus -->
	<div
		class="modal-overlay"
		role="button"
		tabindex="0"
		aria-label="Close modal"
		onclick={closeModal}
	>
		>
		<div
			class="modal-container"
			role="dialog"
			aria-modal="true"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="modal-header">
				<h3>Image Preview</h3>
				<button type="button" class="close-btn" onclick={closeModal} title="Close (Esc)">✕</button>
			</div>
			<div class="modal-body">
				<img src={modalImage} alt={modalAlt} class="modal-image" />
			</div>
			<div class="modal-footer">
				<button type="button" class="btn-secondary" onclick={closeModal}>Close</button>
			</div>
		</div>
	</div>
{/if}

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
	}

	.records-table th {
		padding: 1rem 0.75rem;
		text-align: left;
		font-weight: 600;
		/* color: #333; */
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

	.date-cell {
		/* color: #666; */
		font-size: 0.9rem;
		font-weight: 500;
	}

	.number-cell {
		text-align: center;
		font-weight: 500;
	}

	.image-cell {
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

	.btn-danger {
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.5rem 0.75rem;
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.btn-danger:hover {
		background: #c82333;
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
		width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
		animation: modalAppear 0.2s ease-out;
	}

	.modal-container form {
		display: flex;
		flex-direction: column;
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
		/* color: #333; */
		font-size: 1.25rem;
	}

	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		/* color: #666; */
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
		/* color: #333; */
	}

	.modal-body {
		padding: 1rem;
		display: flex;
		justify-content: center;
		align-items: center;
		flex: 1;
		/* overflow: hidden; */
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
		gap: 0.75rem;
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

	.btn-primary {
		/* background: #007bff; */
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
		/* background: #0069d9; */
		transform: translateY(-1px);
	}

	.btn-primary:active {
		transform: translateY(0);
	}

	/* Edit Form Styles */
	/* .edit-modal {
		width: 500px;
		max-width: 90vw;
		max-height: 90vh;
		overflow-y: auto;
	} */

	.edit-form {
		padding: 1.5rem;
		flex-direction: column;
		align-items: stretch;
		justify-content: flex-start;
	}

	.edit-fields {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		/* flex-direction: column; */
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
