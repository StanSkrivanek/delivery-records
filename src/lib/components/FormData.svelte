<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import ImageUpload from './ImageUpload.svelte';

	let { form, loading = $bindable(false) } = $props();

	let loaded = $state(0);
	let collected = $state(0);
	let cutters = $state(0);
	let returned = $state(0);
	let missplaced = $state(0);
	let expense = $state(0);
	let expense_no_vat = $state(0);
	let odometer = $state(0);
	let selectedFile: File | null = $state(null);
	let note = $state('');
	let usage_mode = $state('standard');
	let odometer_end = $state(0);
	let distance_manual = $state(0);
	let purpose = $state('');
	// Date picker functionality - simplified
	let selectedDate = $state(getCurrentDate());

	function getCurrentDate() {
		const now = new Date();
		// Format as YYYY-MM-DD for HTML date input
		const year = now.getFullYear();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}

	function formatDateForDisplay(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function isToday(dateString: string) {
		const selected = new Date(dateString);
		const today = new Date();
		return selected.toDateString() === today.toDateString();
	}

	// Reset form after successful submission
	$effect(() => {
		if (form?.success) {
			loaded = 0;
			collected = 0;
			cutters = 0;
			returned = 0;
			missplaced = 0;
			expense = 0;
			expense_no_vat = 0;
			odometer = 0;
			selectedFile = null;
			selectedDate = getCurrentDate(); // Reset to current date
			usage_mode = 'standard';
			distance_manual = 0;
			purpose = '';
			note = '';
		}
	});

	// Callback functions for ImageUpload component
	function handleFileSelected(file: File | null) {
		selectedFile = file;
	}

	function handleFileRemoved() {
		selectedFile = null;
	}
</script>

<div class="main-container">
	<h1>Add New Record</h1>

	<form
		method="POST"
		action="?/create"
		enctype="multipart/form-data"
		use:enhance={({ formData }) => {
			// Add the image file to form data if selected
			if (selectedFile) {
				formData.append('image', selectedFile);
			}

			// Add the selected date to form data
			formData.append('selectedDate', selectedDate);
			formData.set('odometer', odometer.toString());
			formData.set('expense_no_vat', expense_no_vat.toString());

			// Add vehicle usage data
			formData.set('usage_mode', usage_mode);
			if (usage_mode !== 'standard') {
				formData.set('distance_manual', distance_manual.toString());
			}
			if (usage_mode === 'other') {
				formData.set('purpose', purpose);
			}

			loading = true;

			return async ({ result, update }) => {
				loading = false;
				await update();

				// Invalidate all data to refresh overview page and records list
				if (result.type === 'success') {
					await invalidateAll();
				}
			};
		}}
	>
		<!-- Date Selection Section -->

		<label>
			<input type="radio" bind:group={usage_mode} value="standard" />
			Car delivery use
		</label>
		<label>
			<input type="radio" bind:group={usage_mode} value="no_used" />
			Car Not Used <span>( other vehicle if Van in e.g. car in service )</span>
		</label>
		<label>
			<input type="radio" bind:group={usage_mode} value="other" />
			Other use (e.g. personal)
		</label>
		<div class="form-grid">
			<div class="form-column">
				<div class="form-group">
					<div class="input-group">
						<label for="date-input">Entry Date:</label>
						<input
							type="date"
							id="date-input"
							bind:value={selectedDate}
							disabled={loading}
							class="date-input"
						/>
					</div>
					<div class="input-group">
						<label for="loaded">Loaded:</label>
						<input
							type="number"
							id="loaded"
							name="loaded"
							bind:value={loaded}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<div class="input-group">
						<label for="collected">Collected:</label>
						<input
							type="number"
							id="collected"
							name="collected"
							bind:value={collected}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<div class="input-group">
						<label for="cutters">Cutters:</label>
						<input
							type="number"
							id="cutters"
							name="cutters"
							bind:value={cutters}
							min="0"
							required
							disabled={loading}
						/>
					</div>
				</div>
				<div class="form-group">
					<div class="input-group">
						<label for="returned">Returned:</label>
						<input
							type="number"
							id="returned"
							name="returned"
							bind:value={returned}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<div class="input-group">
						<label for="missplaced">Missplaced:</label>
						<input
							type="number"
							id="missplaced"
							name="missplaced"
							bind:value={missplaced}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<div class="input-group">
						<label for="expense">Expense:</label>
						<input
							type="number"
							id="expense"
							name="expense"
							bind:value={expense}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<div class="input-group">
						<label for="expense_no_vat">Expense (no VAT):</label>
						<input
							type="number"
							id="expense_no_vat"
							name="expense_no_vat"
							bind:value={expense_no_vat}
							min="0"
							required
							disabled={loading}
						/>
					</div>
					<!-- <div class="input-group">
						<label for="odometer">Odometer:</label>
						<input
							class="number-input"
							type="number"
							id="odometer"
							name="odometer"
							bind:value={odometer}
							min="0"
							required
							disabled={loading}
						/>
					</div> -->
					{#if usage_mode === 'standard'}
						<div class="input-group">
							<label for="odometer">Odometer:</label>
							<input
								class="number-input"
								type="number"
								id="odometer"
								name="odometer"
								bind:value={odometer}
								min="0"
								required
								disabled={loading}
							/>
						</div>
					{:else if usage_mode === 'no_used'}
						<div class="input-group">
							<label for="distance_manual">Manual Distance in km: <span>( e.g. 250 )</span></label>
							<input
								class="number-input"
								type="number"
								id="distance_manual"
								name="odometer"
								bind:value={distance_manual}
								min="0"
								required
								disabled={loading}
							/>
						</div>
						<!-- <div class="input-group">
						<label for="distance_manual">Manual Distance:</label>
						<input
							type="number"
							bind:value={distance_manual}
							placeholder="Manual distance (e.g. backup vehicle)"
						/> -->
					{:else if usage_mode === 'other'}
						<div class="input-group">
							<label for="purpose">Purpose:</label>
							<select id="purpose" bind:value={purpose} disabled={loading}>
								<option value="">-- Select purpose --</option>
								<option value="service">Service</option>
								<option value="personal">Personal Use</option>
								<option value="testing">Testing</option>
								<option value="other">Other</option>
							</select>
						</div>
						<div class="input-group">
							<label for="odometer_end">Manual Distance in km: <span>( e.g. 250 )</span></label>
							<input
								class="number-input"
								type="number"
								id="odometer_end"
								name="odometer_end"
								bind:value={distance_manual}
								min="0"
								required
								disabled={loading}
							/>
						</div>
						<!-- <input type="number" bind:value={distance_manual} placeholder="Distance (optional)" /> -->
					{/if}
				</div>
				<div class="form-group textarea-section">
					<div class="input-group">
						<label for="note">Note:</label>
						<textarea
							id="note"
							name="note"
							bind:value={note}
							rows="6"
							placeholder="Add any additional notes here..."
							disabled={loading}
						></textarea>
					</div>
				</div>
			</div>
			<div class="form-column image-section">
				<!-- Additional fields can be added here if needed -->
				<ImageUpload
					bind:selectedFile
					disabled={loading}
					onFileSelected={handleFileSelected}
					onFileRemoved={handleFileRemoved}
				/>
			</div>
			<div class="form-actions">
				<button type="submit" disabled={loading} class="submit-btn">
					{loading ? 'Saving...' : 'Save Record Data'}
				</button>
			</div>
		</div>
	</form>
	<!-- close msg after 5s -->
	{#if form?.success || form?.error}
		<div class="message">
			{#if form.success}
				<div class="message success">Record saved successfully!</div>
			{:else if form.error}
				<div class="message error">
					{form.error}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Same CSS as before... -->
<style>
	.main-container {
		max-width: var(--max-w, 800px);
		margin: 0 auto;
		padding: 2rem;
		border-bottom: 1px solid #ddd;
		margin-bottom: 2rem;
		background: #f8f9fa;
	}

	h1 {
		margin-bottom: 2rem;
		border-bottom: 1px solid #dee2e6;
	}

	.date-input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		background: white;
		cursor: pointer;
		min-width: 120px;
	}

	.date-input:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	.date-input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.form-column {
		gap: 1rem;
		.form-group {
			width: 100%;
			flex-direction: column;
		}
	}
	.form-group {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 0.5rem;

		& .input-group {
			display: flex;
			flex-direction: column;
			width: 100%;
			gap: 0.5rem;
			padding-top: 1rem;
		}
	}
	.form-group.textarea-section {
		border-radius: 4px;
		font-size: 1rem;
		resize: vertical;
		grid-column: 1 / -1; /* Make the whole group span all columns */
		display: grid;
		grid-template-columns: repeat(4, 1fr);
	}
	.form-group.textarea-section .input-group {
		grid-column: 1 / -1; /* Make input-group span all columns */
	}
	.form-group.textarea-section textarea {
		grid-column: 1 / -1; /* Make textarea span all columns */
		max-width: 100%;
		font-size: 1.2rem;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		resize: none;
	}
	.image-section {
		grid-column: 2/ -1;
	}

	label {
		font-weight: 500;
	}

	input[type='number'] {
		padding: 0.85rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	input[type='number']:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
	}
	span {
		font-size: 0.7rem;
		color: #6c757d;
	}
	.form-actions {
		grid-column: 2/-1;
	}

	.submit-btn {
		width: 100%;
		background: #007bff;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.75rem 2rem;
		font-size: 1rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.2s;
	}

	.submit-btn:hover:not(:disabled) {
		background: #0056b3;
	}

	.submit-btn:disabled {
		background: #6c757d;
		cursor: not-allowed;
	}

	.message {
		margin-top: 1rem;
		padding: 1rem;
		border-radius: 4px;
		text-align: center;
	}

	.success {
		background: #d4edda;
		border: 1px solid #c3e6cb;
		color: #155724;
	}

	.error {
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		color: #721c24;
	}

	@media (max-width: 1024px) {
		.main-container {
			padding: 1rem;
		}
	}
	@media (max-width: 960px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-group {
			grid-template-columns: 1fr;
		}
		.form-group.textarea-section {
			grid-template-columns: 1fr;
		}
		.image-section {
			grid-column: 1 / -1;
		}
		.form-actions {
			grid-column: 1 / -1;
		}
	}
	@media (max-width: 768px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-group {
			grid-template-columns: 1fr;
		}
		.form-group.textarea-section {
			grid-template-columns: 1fr;
		}
	}
	@media (max-width: 480px) {
		.form-grid {
			grid-template-columns: 1fr;
		}
		.form-group {
			grid-template-columns: 1fr;
		}
		.form-group.textarea-section {
			grid-template-columns: 1fr;
		}
	}
</style>
