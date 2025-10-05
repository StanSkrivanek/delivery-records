// src/routes/dashboard/revenue/+page.server.ts
import { InvoiceService } from '$lib/invoice.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Get year from query param or use current year
	const yearParam = url.searchParams.get('year');
	const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

	try {
		// Get invoice summaries for the selected year
		const invoiceSummaries = await InvoiceService.getMonthlyInvoiceSummaries(year);

		return {
			invoiceSummaries,
			year
		};
	} catch (error) {
		console.error('Error loading revenue data:', error);
		return {
			invoiceSummaries: [],
			year,
			error: 'Failed to load revenue data'
		};
	}
};
