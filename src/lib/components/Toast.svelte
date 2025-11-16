<script lang="ts">
	import { onMount } from 'svelte';

	let {
		message = '',
		type = 'success',
		duration = 5000,
		onClose = () => {}
	}: {
		message: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		onClose?: () => void;
	} = $props();

	let visible = $state(true);
	let timeoutId: ReturnType<typeof setTimeout>;

	onMount(() => {
		if (duration > 0) {
			timeoutId = setTimeout(() => {
				visible = false;
				setTimeout(onClose, 300); // Wait for animation to complete
			}, duration);
		}

		return () => {
			if (timeoutId) clearTimeout(timeoutId);
		};
	});

	const handleClose = () => {
		if (timeoutId) clearTimeout(timeoutId);
		visible = false;
		setTimeout(onClose, 300);
	};
</script>

{#if visible}
	<div class="toast toast-{type}" role="alert">
		<div class="toast-content">
			<span class="toast-icon">
				{#if type === 'success'}
					✓
				{:else if type === 'error'}
					✕
				{:else if type === 'warning'}
					⚠
				{:else}
					ℹ
				{/if}
			</span>
			<span class="toast-message">{message}</span>
		</div>
		<button class="toast-close" onclick={handleClose} aria-label="Close"> ✕ </button>
	</div>
{/if}

<style>
	.toast {
		position: fixed;
		top: 20px;
		right: 20px;
		min-width: 300px;
		max-width: 500px;
		padding: 16px 20px;
		border-radius: 8px;
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.1),
			0 2px 4px rgba(0, 0, 0, 0.06);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		z-index: 9999;
		animation: slideIn 0.3s ease-out;
		backdrop-filter: blur(10px);
	}

	@keyframes slideIn {
		from {
			transform: translateX(100%);
			opacity: 0;
		}
		to {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.toast-content {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		font-size: 14px;
		font-weight: bold;
		flex-shrink: 0;
	}

	.toast-message {
		flex: 1;
		font-size: 14px;
		line-height: 1.5;
	}

	.toast-close {
		background: none;
		border: none;
		color: inherit;
		font-size: 18px;
		cursor: pointer;
		padding: 4px;
		line-height: 1;
		opacity: 0.7;
		transition: opacity 0.2s;
		flex-shrink: 0;
	}

	.toast-close:hover {
		opacity: 1;
	}

	.toast-success {
		background-color: rgba(34, 197, 94, 0.95);
		color: white;
	}

	.toast-success .toast-icon {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.toast-error {
		background-color: rgba(239, 68, 68, 0.95);
		color: white;
	}

	.toast-error .toast-icon {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.toast-warning {
		background-color: rgba(251, 146, 60, 0.95);
		color: white;
	}

	.toast-warning .toast-icon {
		background-color: rgba(255, 255, 255, 0.2);
	}

	.toast-info {
		background-color: rgba(59, 130, 246, 0.95);
		color: white;
	}

	.toast-info .toast-icon {
		background-color: rgba(255, 255, 255, 0.2);
	}

	@media (max-width: 640px) {
		.toast {
			top: 10px;
			right: 10px;
			left: 10px;
			min-width: auto;
		}
	}
</style>
