<script lang="ts">
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();
</script>

<svelte:head>
	<title>Register - Fleet Management</title>
</svelte:head>

<div class="auth-container">
	<div class="card">
		<h1>Create an account</h1>
		<p>Sign up to start using the app.</p>

		<form method="POST" class="form">
			{#if form?.error}
				<div class="error">{form.error}</div>
			{/if}

			<div class="row">
				<div>
					<label for="first_name">First name</label>
					<input id="first_name" name="first_name" required />
				</div>
				<div>
					<label for="last_name">Last name</label>
					<input id="last_name" name="last_name" required />
				</div>
			</div>

			<div class="row">
				<div class="full">
					<label for="email">Email</label>
					<input id="email" name="email" type="email" required />
				</div>
			</div>

			<div class="row">
				<div>
					<label for="password">Password</label>
					<input id="password" name="password" type="password" minlength="8" required />
				</div>
				<div>
					<label for="password_confirm">Confirm password</label>
					<input
						id="password_confirm"
						name="password_confirm"
						type="password"
						minlength="8"
						required
					/>
				</div>
			</div>

			<button type="submit">Create account</button>
		</form>

		<p class="hint">Already have an account? <a href="/auth/login">Sign in</a></p>
	</div>
</div>

<style>
	.auth-container {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 80vh;
		padding: 1rem;
	}
	.card {
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 2rem;
		width: 100%;
		max-width: 560px;
		box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
	}
	h1 {
		margin: 0 0 0.25rem 0;
		font-size: 1.6rem;
	}
	p {
		margin: 0 0 1.25rem 0;
		color: #6b7280;
	}
	.form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	.row .full {
		grid-column: 1 / -1;
	}
	label {
		display: block;
		margin-bottom: 0.4rem;
		color: #374151;
		font-weight: 500;
	}
	input {
		width: 100%;
		padding: 0.65rem 0.8rem;
		border: 1px solid #d1d5db;
		border-radius: 8px;
		font-size: 1rem;
	}
	button {
		margin-top: 0.5rem;
		padding: 0.8rem 1rem;
		background: #111827;
		color: white;
		border: 0;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}
	button:hover {
		background: #000;
	}
	.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #991b1b;
		padding: 0.75rem;
		border-radius: 8px;
	}
	.hint {
		color: #374151;
		margin-top: 1rem;
	}
	.hint a {
		color: #111827;
		font-weight: 600;
	}
	@media (max-width: 560px) {
		.row {
			grid-template-columns: 1fr;
		}
	}
</style>
