// src/routes/api/invoice/+server.ts
import { InvoiceService } from '$lib/invoice.server';
import { generateInvoiceHTML } from '$lib/pdfGenerator';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireUser } from '$lib/server/authz';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		// Require authentication
		requireUser(locals.user);
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
	} catch (error: any) {
		if (error?.code === 401) return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
		if (error?.code === 403) return json({ error: 'FORBIDDEN' }, { status: 403 });
		console.error('Invoice generation error:', error);
		return json({ error: 'Failed to generate invoice' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Require authentication
		requireUser(locals.user);
		const { year, month, companyInfo, invoiceReceiver } = await request.json();

		const invoiceData = await InvoiceService.generateInvoiceData(year, month);
		const html = generateInvoiceHTML(invoiceData, companyInfo, invoiceReceiver);

		return new Response(html, {
			headers: {
				'Content-Type': 'text/html',
				'Content-Disposition': `attachment; filename="invoice-${invoiceData.invoiceNumber}.html"`
			}
		});
	} catch (error: any) {
		if (error?.code === 401) return json({ error: 'UNAUTHENTICATED' }, { status: 401 });
		if (error?.code === 403) return json({ error: 'FORBIDDEN' }, { status: 403 });
		console.error('Invoice generation error:', error);
		return json({ error: 'Failed to generate invoice' }, { status: 500 });
	}
};
