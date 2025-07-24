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
	let selectedFile: File | null = $state(null);

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
			selectedFile = null;
			selectedDate = getCurrentDate(); // Reset to current date
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
	<h1>Data Entry Form</h1>

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

		<div class="form-grid">
			<div class="form-column">
				<div class="form-group date-section">
					<label for="date-input">Entry Date:</label>
					<div class="date-input-group">
						<input
							type="date"
							id="date-input"
							bind:value={selectedDate}
							disabled={loading}
							class="date-input"
						/>
						<!-- <div class="date-display">
							<span class="date-text">
								{formatDateForDisplay(selectedDate)}
							</span>
							{#if isToday(selectedDate)}
								<span class="today-badge">Today</span>
							{/if}
						</div> -->
					</div>
				</div>
				<div class="form-group">
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
						<label for="missplaced">missplaced:</label>
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
						<label for="expense">expense:</label>
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

	{#if form?.success}
		<div class="message success">Record saved successfully!</div>
	{/if}

	{#if form?.error}
		<div class="message error">
			{form.error}
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
		text-align: center;
		color: #333;
		margin-bottom: 2rem;
	}

	.date-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		/* background: #f8f9fa; */
		border-bottom: 1px solid #dee2e6;
		padding-bottom: 2rem;
		margin-bottom: 2rem;
	}

	.date-input-group {
		display: flex;
		/* flex-direction: column; */
		/* align-items: center;
    justify-content: center; */
		gap: 1rem;
		margin-top: 0.5rem;
	}

	.date-input {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
		background: white;
		cursor: pointer;
		min-width: 150px;
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

	.date-display {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
	}

	.date-text {
		font-weight: 500;
		color: #333;
		font-size: 1.1rem;
	}

	.today-badge {
		background: #28a745;
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}

	.form-grid {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.form-column {
		/* display: flex; */
		/* flex-direction: column; */
		/* align-items: flex-start; */
		/* justify-content: space-evenly; */
		/* gap: 1rem; */
	}
	.form-group {
		display: flex;
		/* flex-direction: column; */
		gap: 0.5rem;

		& .input-group {
			display: flex;
			flex-direction: column;
			width: 100%;
			gap: 0.5rem;
			padding-top: 1rem;
			/* margin-bottom: 1rem; */
		}
	}

	.image-section {
		/* height: 100%; */

		/* justify-content: stretch; */
		/* flex-direction: column; */

		grid-column: 2/ -1;
	}

	label {
		font-weight: 500;
		color: #333;
	}

	input[type='number'] {
		padding: 0.75rem;
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

	.form-actions {
		grid-column: 2/-1;
		/* display: flex; */
		/* justify-content: center; */
		/* margin-top: 2rem; */
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

		.date-input-group {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}

		/* .date-display {
			justify-content: center;
			text-align: center;
		} */
	}
	@media (max-width: 960px) {
		.form-grid {
			grid-template-columns: 1fr 1fr;
		}
		.form-column {
			/* flex-direction: column; */
			/* align-items: center; */
			gap: 1rem;
			.form-group {
				width: 100%;
				flex-direction: column;
			}
		}
	}
	@media (max-width: 768px) {
		.date-input-group {
			flex-direction: column;
			align-items: stretch;
			gap: 0.75rem;
		}
		.form-grid {
			grid-template-columns: 1fr;
			& .image-section {
				grid-column: 1 / -1;
			}
			& .form-actions {
				grid-column: 1 / -1;
			}
		}
	}

	@media (max-width: 480px) {
		h1 {
			font-size: 1.5rem;
		}

		.date-section {
			padding: 1rem;
		}

		/* .date-text {
			font-size: 1rem;
		} */
	}
</style>
