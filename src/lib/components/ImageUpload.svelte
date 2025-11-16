<script lang="ts">
	// Modern Svelte 5 approach using callback props instead of createEventDispatcher
	// Supports multiple image uploads with sequential numbering
	import { optimizeImages, type SquooshOptions } from '$lib/squoosh';
	import { onMount } from 'svelte';

	let {
		selectedFiles = $bindable(),
		disabled = false,
		onFilesSelected,
		onFileRemoved,
		imagePaths = $bindable()
	}: {
		selectedFiles?: File[];
		disabled?: boolean;
		onFilesSelected?: (files: File[]) => void;
		onFileRemoved?: (index: number) => void;
		imagePaths?: string[];
	} = $props();

	let dragOver = $state(false);
	let fileInput: HTMLInputElement;
	let squooshSettings: SquooshOptions | null = $state(null);
	let isOptimizing = $state(false);

	// Fetch Squoosh settings on mount
	onMount(async () => {
		try {
			const response = await fetch('/api/squoosh-settings');
			if (response.ok) {
				squooshSettings = await response.json();
			}
		} catch (error) {
			console.error('Failed to fetch Squoosh settings:', error);
		}
	});

	async function processFiles(files: File[]): Promise<File[]> {
		if (!squooshSettings || !squooshSettings.enabled) {
			return files;
		}

		isOptimizing = true;
		try {
			const optimizedFiles = await optimizeImages(files, squooshSettings);
			return optimizedFiles;
		} catch (error) {
			console.error('Error optimizing images:', error);
			return files; // Return original files if optimization fails
		} finally {
			isOptimizing = false;
		}
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		if (!disabled) {
			dragOver = true;
		}
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
			if (imageFiles.length > 0) {
				const processed = await processFiles(imageFiles);
				selectedFiles = [...(selectedFiles || []), ...processed];
				onFilesSelected?.(selectedFiles);
			}
		}
	}

	async function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (disabled) return;
		if (files && files.length > 0) {
			const imageFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
			if (imageFiles.length > 0) {
				const processed = await processFiles(imageFiles);
				selectedFiles = [...(selectedFiles || []), ...processed];
				onFilesSelected?.(selectedFiles);
			}
		}
	}

	function removeFile(index: number) {
		selectedFiles = selectedFiles?.filter((_, i) => i !== index) || [];
		if (fileInput) fileInput.value = '';
		onFileRemoved?.(index);
	}

	function openFileDialog() {
		if (!disabled) {
			fileInput?.click();
		}
	}
</script>

<div class="image-upload">
	{#if isOptimizing}
		<div class="optimizing-overlay">
			<div class="spinner"></div>
			<p>Optimizing images...</p>
		</div>
	{/if}

	<div
		class="drop-zone"
		class:drag-over={dragOver}
		class:disabled
		class:has-files={selectedFiles && selectedFiles.length > 0}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={openFileDialog}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
	>
		{#if selectedFiles && selectedFiles.length > 0}
			<div class="files-grid">
				{#each selectedFiles as file, index (file.name + '-' + index)}
					<div class="file-preview">
						<img src={URL.createObjectURL(file)} alt="Preview {index + 1}" class="preview-image" />
						<div class="file-info">
							<p class="file-name">{file.name}</p>
							<p class="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
						</div>
						<button
							type="button"
							class="remove-btn"
							onclick={(e) => {
								e.stopPropagation();
								removeFile(index);
							}}
							{disabled}
						>
							✕
						</button>
					</div>
				{/each}
			</div>
		{:else}
			<div class="drop-prompt">
				<p>Drag & drop images here</p>
				<p class="or-text">or click to select (multiple files supported)</p>
			</div>
		{/if}
	</div>

	<input
		type="file"
		accept="image/*"
		multiple
		bind:this={fileInput}
		onchange={handleFileSelect}
		style="display: none;"
		{disabled}
	/>
</div>

<style>
	.image-upload {
		width: auto;
		max-width: 100%;
		height: 100%;
		position: relative;
	}

	.optimizing-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(255, 255, 255, 0.9);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 1rem;
		z-index: 1000;
		border-radius: 8px;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f3f3f3;
		border-top: 4px solid #007bff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	.optimizing-overlay p {
		margin: 0;
		font-weight: 500;
		color: #333;
	}

	.drop-zone {
		border: 2px dashed #ddd;
		border-radius: 8px;
		text-align: center;
		cursor: pointer;
		transition: all 0.3s ease;
		min-height: 200px;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.drop-zone:hover:not(.disabled) {
		border-color: #007bff;
		background-color: #f8f9fa;
	}

	.drop-zone.drag-over {
		border-color: #007bff;
		background-color: #e3f2fd;
	}

	.drop-zone.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.files-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 1rem;
		width: 100%;
		padding: 1rem;
		max-height: 500px;
		overflow-y: auto;
	}

	.file-preview {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 12px;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		background: white;
	}

	.preview-image {
		height: auto;
		max-width: 160px;
		max-height: 160px;
		object-fit: cover;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.file-info {
		text-align: center;
		word-break: break-word;
		width: 100%;
	}

	.file-name {
		font-weight: 500;
		margin: 0;
		color: #333;
		font-size: 0.875rem;
	}

	.file-size {
		font-size: 0.75rem;
		color: #666;
		margin: 0.25rem 0 0 0;
	}

	.remove-btn {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #dc3545;
		color: white;
		border: none;
		border-radius: 50%;
		width: 24px;
		height: 24px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		line-height: 1;
		z-index: 10;
	}

	.remove-btn:hover:not(:disabled) {
		background: #c82333;
	}

	.remove-btn:disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.drop-prompt {
		color: #666;
		padding: 2rem;
	}

	.drop-prompt p {
		margin: 0.5rem 0;
	}

	.or-text {
		font-size: 0.875rem;
		color: #999;
	}
</style>
