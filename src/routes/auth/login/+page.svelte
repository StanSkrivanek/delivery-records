<script lang="ts">
	import type { ActionData } from './$types';
	import { Truck } from 'lucide-svelte';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Login - Fleet Management</title>
</svelte:head>

<div class="login-container">
	<div class="login-card">
		<div class="login-header">
			<h1><Truck size={18} style="vertical-align:-3px;margin-right:6px;" /> Fleet Management</h1>
			<p>Sign in to your account</p>
		</div>

		<form method="POST" action="?/login" class="login-form">
			{#if form?.error}
				<div class="error-message">
					{form.error}
				</div>
			{/if}

			<div class="form-group">
				<label for="email">Email Address</label>
				<input
					type="email"
					id="email"
					name="email"
					value={form?.email || ''}
					required
					autocomplete="email"
					placeholder="admin@example.com"
				/>
			</div>

			<div class="form-group">
				<label for="password">Password</label>
				<input
					type="password"
					id="password"
					name="password"
					required
					autocomplete="current-password"
					placeholder="••••••••"
				/>
			</div>

			<button type="submit" class="login-button"> Sign In </button>
		</form>

		<div class="login-footer">
			<p class="demo-credentials">
				<strong>Demo Credentials:</strong><br />
				Email: admin@example.com<br />
				Password: admin123
			</p>
		</div>
	</div>
</div>

<style>
	.login-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		padding: 1rem;
	}

	.login-card {
		background: white;
		border-radius: 12px;
		box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
		width: 100%;
		max-width: 420px;
		overflow: hidden;
	}

	.login-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		text-align: center;
	}

	.login-header h1 {
		margin: 0 0 0.5rem 0;
		font-size: 1.75rem;
		font-weight: 700;
	}

	.login-header p {
		margin: 0;
		opacity: 0.9;
		font-size: 1rem;
	}

	.login-form {
		padding: 2rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #374151;
		font-size: 0.9rem;
	}

	.form-group input {
		width: 100%;
		padding: 0.75rem 1rem;
		border: 1px solid #d1d5db;
		border-radius: 6px;
		font-size: 1rem;
		transition: all 0.2s;
		box-sizing: border-box;
	}

	.form-group input:focus {
		outline: none;
		border-color: #667eea;
		box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
	}

	.error-message {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #dc2626;
		padding: 0.75rem 1rem;
		border-radius: 6px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}

	.login-button {
		width: 100%;
		padding: 0.875rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.login-button:hover {
		transform: translateY(-1px);
		box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
	}

	.login-button:active {
		transform: translateY(0);
	}

	.login-footer {
		background: #f9fafb;
		padding: 1.5rem 2rem;
		border-top: 1px solid #e5e7eb;
	}

	.demo-credentials {
		margin: 0;
		font-size: 0.85rem;
		color: #6b7280;
		text-align: center;
		line-height: 1.6;
	}

	.demo-credentials strong {
		color: #374151;
	}

	@media (max-width: 480px) {
		.login-header h1 {
			font-size: 1.5rem;
		}

		.login-form {
			padding: 1.5rem;
		}

		.login-footer {
			padding: 1rem 1.5rem;
		}
	}
</style>
