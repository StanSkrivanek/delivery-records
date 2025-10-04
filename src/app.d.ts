import type { User } from '$lib/db.server';

// See https://svelte.dev/docs/kit/types#app.d.ts
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user?: User;
			session?: {
				id: string;
				user_id: number;
				expires_at: string;
			};
		}
		interface PageData {
			user?: User;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
