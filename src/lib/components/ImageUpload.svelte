<script lang="ts">
	// Modern Svelte 5 approach using callback props instead of createEventDispatcher
	let {
		selectedFile = $bindable(),
		disabled = false,
		onFileSelected,
		onFileRemoved,
		imagePath = $bindable() 
	}: {
		selectedFile?: File | null;
		disabled?: boolean;
		onFileSelected?: (file: File) => void;
		onFileRemoved?: () => void;
		imagePath?: string;
	} = $props();

	let dragOver = $state(false);
	let fileInput: HTMLInputElement;

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

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;

		if (disabled) return;

		const files = event.dataTransfer?.files;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				selectedFile = file;
				onFileSelected?.(file);
			}
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		const files = target.files;
		if (disabled) return;
		if (files && files.length > 0) {
			const file = files[0];
			if (file.type.startsWith('image/')) {
				selectedFile = file;
				onFileSelected?.(file);
			}
		}
		// if (files && files.length > 0) {
		// 	selectedFile = files[0];
		// 	onFileSelected?.(files[0]);
		// 	// Do NOT reset target.value here; only reset on removeFile
		// }
	}

	function removeFile() {
		selectedFile = null;
		if (fileInput) fileInput.value = '';
		onFileRemoved?.();
	}

	function openFileDialog() {
		if (!disabled) {
			fileInput?.click();
		}
	}
</script>

<div class="image-upload">
	<div
		class="drop-zone"
		class:drag-over={dragOver}
		class:disabled
		class:has-file={selectedFile}
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDrop}
		onclick={openFileDialog}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && openFileDialog()}
	>
		{#if selectedFile}
			<div class="file-preview">
				<img src={URL.createObjectURL(selectedFile)} alt="Preview" class="preview-image" />
				<div class="file-info">
					<p class="file-name">{selectedFile.name}</p>
					<p class="file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
				</div>
				<button type="button" class="remove-btn" onclick={removeFile} {disabled}> ✕ </button>
			</div>
		{:else}
			<div class="drop-prompt">
				<p>Drag & drop an image here</p>
				<p class="or-text">or click to select</p>
			</div>
		{/if}
	</div>

	<input
		type="file"
		accept="image/*"
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
		/* margin: 0 auto; */
		height: 100%;
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

	.file-preview {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
		width: 100%;
		padding:12px;
	}
	
	.preview-image {
		/* width: 100%; */
		height: auto;
		max-width: 160px;
		max-height: 160px;
		object-fit: cover;
		border-radius: 4px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
	}

	.file-info {
		text-align: center;
	}

	.file-name {
		font-weight: 500;
		margin: 0;
		color: #333;
	}

	.file-size {
		font-size: 0.875rem;
		color: #666;
		margin: 0.25rem 0 0 0;
	}

	.remove-btn {
		position: absolute;
		top: 8px;
		right: 16px;
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
	}

	/* .upload-icon {
		font-size: 3rem;
		margin-bottom: 1rem;
	} */

	.or-text {
		font-size: 0.875rem;
		color: #999;
		margin: 0.5rem 0 0 0;
	}
</style>
