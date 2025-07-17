<script lang="ts">
	import { enhance } from '$app/forms';
	import ImageUpload from './ImageUpload.svelte';

	let {
		form,
		loading = $bindable(false)
	}: {
		form: any;
		loading?: boolean;
	} = $props();

	let loaded = $state(0);
	let collected = $state(0);
	let cutters = $state(0);
	let returned = $state(0);
	let selectedFile: File | null = $state(null);

	// Reset form after successful submission
	$effect(() => {
		if (form?.success) {
			loaded = 0;
			collected = 0;
			cutters = 0;
			returned = 0;
			selectedFile = null;
		}
	});

	// Callback functions for ImageUpload component
	function handleFileSelected(file: File) {
		selectedFile = file;
		console.log(`File selected: ${file.name}`);
	}

	function handleFileRemoved() {
		selectedFile = null;
	}
</script>

<div class="form-container">
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

			loading = true;

			return async ({ result, update }) => {
				loading = false;
				await update();
			};
		}}
	>
		<div class="form-grid">
			<div class="form-group">
				<label for="loaded">Loaded:</label>
				<input
					type="text"
					id="loaded"
					name="loaded"
					bind:value={loaded}
					min="0"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="collected">Collected:</label>
				<input
					type="text"
					id="collected"
					name="collected"
					bind:value={collected}
					min="0"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="cutters">Cutters:</label>
				<input
					type="text"
					id="cutters"
					name="cutters"
					bind:value={cutters}
					min="0"
					required
					disabled={loading}
				/>
			</div>

			<div class="form-group">
				<label for="returned">Returned:</label>
				<input
					type="text"
					id="returned"
					name="returned"
					bind:value={returned}
					min="0"
					required
					disabled={loading}
				/>
			</div>
		</div>

		<div class="form-group image-section">
			<!-- <label id="image-label"
			>Image (optional):
		</label> -->
				<div aria-labelledby="image-label">
					<ImageUpload
						bind:selectedFile
						disabled={loading}
						onFileSelected={handleFileSelected}
						onFileRemoved={handleFileRemoved}
					/>
				</div>
		</div>

		<div class="form-actions">
			<button type="submit" disabled={loading} class="submit-btn">
				{loading ? 'Saving...' : 'Submit'}
			</button>
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

<style>
	.form-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
	}

	h1 {
		text-align: center;
		color: #333;
		margin-bottom: 2rem;
	}

	.form-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.image-section {
		grid-column: 1 / -1;
	}

	label {
		font-weight: 500;
		color: #333;
	}

	input[type='text'] {
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	input[type='text']:focus {
		outline: none;
		border-color: #007bff;
		box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
	}

	input:disabled {
		background-color: #f8f9fa;
		cursor: not-allowed;
	}

	.form-actions {
		display: flex;
		justify-content: center;
		margin-top: 2rem;
	}

	.submit-btn {
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
</style>
