// src/routes/api/invoice/+server.ts
import { InvoiceService } from '$lib/invoice.server';
import { generateInvoiceHTML } from '$lib/pdfGenerator';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	try {
		const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString());
		const month = parseInt(url.searchParams.get('month') || (new Date().getMonth() + 1).toString());
		const format = url.searchParams.get('format') || 'json';

		const invoiceData = await InvoiceService.generateInvoiceData(year, month);

		if (format === 'html') {
			// Return HTML for PDF generation
			const html = generateInvoiceHTML(invoiceData);
			return new Response(html, {
				headers: {
					'Content-Type': 'text/html'
				}
			});
		}

		// Return JSON data
		return json(invoiceData);
	} catch (error) {
		console.error('Invoice generation error:', error);
		return json({ error: 'Failed to generate invoice' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { year, month, companyInfo } = await request.json();

		const invoiceData = await InvoiceService.generateInvoiceData(year, month);
		const html = generateInvoiceHTML(invoiceData, companyInfo);

		return new Response(html, {
			headers: {
				'Content-Type': 'text/html',
				'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.html"`
			}
		});
	} catch (error) {
		console.error('Invoice generation error:', error);
		return json({ error: 'Failed to generate invoice' }, { status: 500 });
	}
};
