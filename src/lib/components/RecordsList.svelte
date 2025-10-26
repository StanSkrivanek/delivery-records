<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import ImageUpload from '$lib/components/ImageUpload.svelte';
	import Modal from '$lib/components/popups/Modal.svelte';

	let { records } = $props();

	let modalImages = $state<string[]>([]);
	let currentImageIndex = $state(0);
	let modalRecordId = $state<string | number>('');

	let editRecord = $state({
		id: undefined as number | undefined,
		loaded: 0,
		collected: 0,
		cutters: 0,
		returned: 0,
		missplaced: 0,
		expense: 0,
		expense_no_vat: 0,
		odometer: 0,
		note: '',
		entry_date: '',
		image_path: '',
		usage_mode: 'standard' as 'standard' | 'no_used' | 'other',
		distance_manual: 0,
		purpose: ''
	});

	// Separate state for the image file(s) in edit modal
	let editImageFiles = $state<File[]>([]);

	// Delete dialog state
	let recordIdToDelete = $state<number | null>(null);

	let showModal = $state(false);
	let showEditModal = $state(false);
	let showDeleteModal = $state(false);
	let showNoteModal = $state(false);
	let modalNote = $state('');

	/**
	 * Helper function to build editRecord object from record data
	 */
	function buildEditRecord(
		record: any,
		usage_mode: 'standard' | 'no_used' | 'other',
		distance_manual: number,
		purpose: string
	) {
		return {
			id: record.id ?? undefined,
			loaded: record.loaded,
			collected: record.collected,
			cutters: record.cutters,
			returned: record.returned,
			missplaced: record.missplaced ?? 0,
			expense: record.expense ?? 0,
			expense_no_vat: record.expense_no_vat ?? 0,
			odometer: record.odometer ?? 0,
			image_path: record.image_path ?? '',
			note: record.note || '',
			entry_date: record.entry_date,
			usage_mode,
			distance_manual,
			purpose
		};
	}

	/**
	 * Helper function to determine usage mode from record data
	 */
	function determineUsageMode(record: any): 'standard' | 'no_used' | 'other' {
		if (record.odometer && record.odometer > 0) {
			return 'standard';
		}
		return 'no_used';
	}

	/**
	 * @param {{ loaded: number; collected: number; cutters: number; returned: number; missplaced: number; expense: number; entry_date: string; image_path: string; }} record
	 */
	async function openEditModal(record: {
		id?: number;
		loaded: number;
		collected: number;
		cutters: number;
		returned: number;
		missplaced?: number;
		expense?: number;
		expense_no_vat?: number;
		odometer?: number;
		image_path?: string;
		note?: string;
		entry_date: string;
		created_at?: string;
	}) {
		// Set default values
		let usage_mode: 'standard' | 'no_used' | 'other' = 'standard';
		let distance_manual = 0;
		let purpose = '';

		try {
			// Fetch complete record data including vehicle usage from both tables
			const response = await fetch(`/api/records/${record.id}/full`);
			if (response.ok) {
				const fullRecord = await response.json();
				if (fullRecord) {
					// Use data from both tables
					record = fullRecord; // Update record with fresh data from database

					// Set vehicle usage data if it exists
					if (fullRecord.usage_mode) {
						usage_mode = fullRecord.usage_mode;
						distance_manual = fullRecord.distance_manual || 0;
						purpose = fullRecord.purpose || '';
					} else {
						// Fallback: determine usage mode based on record data if no vehicle usage log exists
						usage_mode = determineUsageMode(fullRecord);
					}
					console.log('Loaded complete record data:', fullRecord);
				} else {
					console.log('No record data found');
				}
			} else {
				console.log('API error when fetching record');
				// Fallback: determine usage mode based on record data
				usage_mode = determineUsageMode(record);
			}
		} catch (error) {
			console.error('Failed to fetch complete record data:', error);
			// Fallback: determine usage mode based on record data
			usage_mode = determineUsageMode(record);
		}

		// Build editRecord once at the end with all the gathered data
		editRecord = buildEditRecord(record, usage_mode, distance_manual, purpose);

		console.log('Final editRecord:', editRecord);
		editImageFiles = []; // Reset image files
		showEditModal = true;
	}

	const closeEditModal = () => {
		showEditModal = false;
		editImageFiles = [];
	};

	async function saveEdit() {
		try {
			const formData = new FormData();

			// Add base record fields
			const baseFields = {
				loaded: editRecord.loaded,
				collected: editRecord.collected,
				cutters: editRecord.cutters,
				returned: editRecord.returned,
				missplaced: editRecord.missplaced,
				expense: editRecord.expense,
				expense_no_vat: editRecord.expense_no_vat,
				odometer: editRecord.odometer,
				note: editRecord.note || '',
				entry_date: editRecord.entry_date,
				usage_mode: editRecord.usage_mode
			};

			Object.entries(baseFields).forEach(([key, value]) => {
				formData.append(key, value.toString());
			});

			// Add conditional vehicle usage data
			if (editRecord.usage_mode !== 'standard') {
				formData.append('distance_manual', editRecord.distance_manual.toString());
			}
			if (editRecord.usage_mode === 'other') {
				formData.append('purpose', editRecord.purpose);
			}

			// Add image files or existing path
			if (editImageFiles.length > 0) {
				editImageFiles.forEach((file) => formData.append('images', file));
			} else if (editRecord.image_path) {
				formData.append('existing_image_path', editRecord.image_path);
			}

			const res = await fetch(`/api/records/${editRecord.id}`, {
				method: 'PUT',
				body: formData
			});

			if (res.ok) {
				const updatedRecord = await res.json();
				const idx = records.findIndex((r: { id: number | undefined }) => r.id === editRecord.id);
				if (idx !== -1) {
					records[idx] = updatedRecord;
				}
				closeEditModal();
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

	// Helper to parse image paths (handles both JSON array and plain string)
	const getImagePaths = (imagePath: string | undefined): string[] => {
		if (!imagePath) return [];
		try {
			const parsed = JSON.parse(imagePath);
			return Array.isArray(parsed) ? parsed : [imagePath];
		} catch {
			return [imagePath];
		}
	};

	// Helper to check if record has images
	const hasImages = (imagePath: string | undefined): boolean => getImagePaths(imagePath).length > 0;

	const openImageModal = (imagePath: string, recordId: string | number) => {
		const paths = getImagePaths(imagePath);
		if (paths.length > 0) {
			modalImages = paths;
			currentImageIndex = 0;
			modalRecordId = recordId;
			showModal = true;
		}
	};

	const nextImage = () => {
		if (currentImageIndex < modalImages.length - 1) {
			currentImageIndex++;
		}
	};

	const prevImage = () => {
		if (currentImageIndex > 0) {
			currentImageIndex--;
		}
	};

	const handleImageKeydown = (event: KeyboardEvent) => {
		if (!showModal) return;
		if (event.key === 'ArrowRight') nextImage();
		if (event.key === 'ArrowLeft') prevImage();
	};

	const formatEntryDate = (dateString: string | number | Date) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	};

	const openDeleteModal = (recordId: number) => {
		recordIdToDelete = recordId;
		showDeleteModal = true;
	};

	const openNoteModal = (note: string) => {
		modalNote = note;
		showNoteModal = true;
	};

	async function confirmDeleteRecord() {
		if (recordIdToDelete !== null) {
			// Optimistically remove from local array for instant feedback
			records = records.filter((r: { id: number | undefined }) => r.id !== recordIdToDelete);

			const recordToDelete = recordIdToDelete;
			recordIdToDelete = null; // Reset immediately
			showDeleteModal = false; // Close modal immediately

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

	// Simplified image handlers using arrow functions
	const handleEditImageSelected = (files: File[]) => {
		editImageFiles = files;
	};

	const handleEditImageRemoved = (index: number) => {
		editImageFiles = editImageFiles.filter((_, i) => i !== index);
		if (editImageFiles.length === 0) {
			editRecord.image_path = '';
		}
	};
</script>

<svelte:window onkeydown={handleImageKeydown} />

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
									<span class="no-data">No note</span>
								{/if}</td
							>
							<td class="info-cell">
								{#if hasImages(record.image_path)}
									{@const imagePaths = getImagePaths(record.image_path)}
									<button
										type="button"
										class="btn blue"
										onclick={() => openImageModal(record.image_path, record.id)}
										title="View image"
									>
										{imagePaths.length > 1 ? `${imagePaths.length} Images` : 'Show Image'}
									</button>
								{:else}
									<span class="no-data">No image</span>
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
		<h2>
			Image Preview - Record #{modalRecordId}
			{#if modalImages.length > 1}
				<span class="image-counter">({currentImageIndex + 1} / {modalImages.length})</span>
			{/if}
		</h2>
	{/snippet}
	{#snippet children()}
		<div class="image-modal-content">
			{#if modalImages.length > 0}
				<img
					src="/{modalImages[currentImageIndex]}"
					alt="Record #{modalRecordId} image {currentImageIndex + 1}"
					class="modal-image"
				/>
			{/if}

			{#if modalImages.length > 1}
				<div class="image-navigation">
					<button
						type="button"
						class="nav-btn prev-btn"
						onclick={prevImage}
						disabled={currentImageIndex === 0}
						title="Previous image (←)"
					>
						← Previous
					</button>
					<button
						type="button"
						class="nav-btn next-btn"
						onclick={nextImage}
						disabled={currentImageIndex === modalImages.length - 1}
						title="Next image (→)"
					>
						Next →
					</button>
				</div>
			{/if}
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
			<button
				type="button"
				class="btn red"
				onclick={() => {
					showDeleteModal = false;
					recordIdToDelete = null;
				}}
			>
				Cancel
			</button>
			<button type="button" class="btn blue" onclick={confirmDeleteRecord}>Delete</button>
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
			<!-- Vehicle Usage Mode Selection -->
			<div class="usage-mode-section">
				<label>
					<input type="radio" bind:group={editRecord.usage_mode} value="standard" />
					Car delivery use
				</label>
				<label>
					<input type="radio" bind:group={editRecord.usage_mode} value="no_used" />
					Car Not Used <span>( other vehicle if Van in e.g. car in service )</span>
				</label>
				<label>
					<input type="radio" bind:group={editRecord.usage_mode} value="other" />
					Other use (e.g. personal)
				</label>
			</div>

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
						<span>Expense (no VAT):</span>
						<input type="number" bind:value={editRecord.expense_no_vat} min="0" step="0.01" />
					</label>

					<!-- Dynamic field based on usage mode -->
					{#if editRecord.usage_mode === 'standard'}
						<label class="form-field">
							<span>Odometer:</span>
							<input type="number" bind:value={editRecord.odometer} min="0" required />
						</label>
					{:else if editRecord.usage_mode === 'no_used'}
						<label class="form-field">
							<span>Manual Distance (km):</span>
							<input type="number" bind:value={editRecord.distance_manual} min="0" required />
						</label>
					{:else if editRecord.usage_mode === 'other'}
						<label class="form-field">
							<span>Purpose:</span>
							<select bind:value={editRecord.purpose}>
								<option value="">-- Select purpose --</option>
								<option value="service">Service</option>
								<option value="personal">Personal Use</option>
								<option value="testing">Testing</option>
								<option value="other">Other</option>
							</select>
						</label>
						<label class="form-field">
							<span>Manual Distance (km):</span>
							<input type="number" bind:value={editRecord.distance_manual} min="0" required />
						</label>
					{/if}
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
							{#if hasImages(editRecord.image_path) && (!editImageFiles || editImageFiles.length === 0)}
								{@const existingPaths = getImagePaths(editRecord.image_path)}
								<div class="current-images-grid">
									{#each existingPaths as imgPath, idx}
										<div class="current-image">
											<!-- svelte-ignore a11y_img_redundant_alt -->
											<img
												src="/{imgPath}"
												alt="Current image {idx + 1}"
												class="current-image-preview"
											/>
										</div>
									{/each}
								</div>
								<p class="current-image-text">{existingPaths.length} current image(s)</p>
								<button
									type="button"
									class="btn-remove-current"
									onclick={() => (editRecord.image_path = '')}
								>
									Remove all current images
								</button>
							{:else}
								<ImageUpload
									bind:selectedFiles={editImageFiles}
									onFilesSelected={handleEditImageSelected}
									onFileRemoved={handleEditImageRemoved}
								/>
							{/if}
						</div>
						{#if editImageFiles.length > 0}
							<p class="new-image-text">New image(s) will replace current image(s)</p>
						{/if}
					</div>
				</div>
			</div>
		</form>
	{/snippet}
	{#snippet footer()}
		<div class="edit-modal-actions">
			<button type="button" class="btn red" onclick={closeEditModal}>Cancel</button>
			<button type="button" class="btn blue" onclick={saveEdit}>Save Changes</button>
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

	.no-data {
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

	.usage-mode-section {
		margin-bottom: 1rem;
		padding: 1rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		background: #f8f9fa;
	}

	.usage-mode-section label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.usage-mode-section label:last-child {
		margin-bottom: 0;
	}

	.usage-mode-section span {
		font-size: 0.8rem;
		color: #6c757d;
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
				/* max-width: 100%; */
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

	.form-field select {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #dee2e6;
		border-radius: 4px;
		font-size: 0.9rem;
		background: white;
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

	.current-images-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 1rem;
		width: 100%;
		margin-bottom: 0.5rem;
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
		flex-direction: column;
		justify-content: center;
		align-items: center;
		padding: 1rem;
		gap: 1rem;
	}

	.modal-image {
		max-width: 100%;
		max-height: 70vh;
		object-fit: contain;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	}

	.image-counter {
		font-size: 0.9rem;
		font-weight: normal;
		color: var(--color-slate-600);
		margin-left: 0.5rem;
	}

	.image-navigation {
		display: flex;
		gap: 1rem;
		margin-top: 1rem;
	}

	.nav-btn {
		background: var(--color-blue-500);
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.75rem 1.5rem;
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.nav-btn:hover:not(:disabled) {
		background: var(--color-blue-600);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}

	.nav-btn:disabled {
		background: var(--color-slate-300);
		cursor: not-allowed;
		opacity: 0.6;
	}

	.nav-btn:active:not(:disabled) {
		transform: translateY(0);
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
		/* padding: 1rem; */
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
