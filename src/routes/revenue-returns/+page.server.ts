import { InvoiceService } from '$lib/invoice.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	// Read selected year from query or default to current year
	const yearParam = url.searchParams.get('year');
	const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

	try {
		// Get monthly invoice summaries for the selected year
		const invoiceSummaries = await InvoiceService.getMonthlyInvoiceSummaries(year);

		return {
			year,
			invoiceSummaries
		};
	} catch (error) {
		console.error('Error loading revenue-returns data:', error);
		return {
			year,
			invoiceSummaries: [],
			error: 'Failed to load data'
		};
	}
};
