// src/lib/pdfGenerator.ts
import type { InvoiceData } from '$lib/invoice.server';
import { formatCurrency, formatDate, getMonthName } from '$lib/utils';

export function generateInvoiceHTML(
	invoiceData: InvoiceData,
	companyInfo?: {
		name?: string;
		address?: string;
		email?: string;
		phone?: string;
		vatNumber?: string;
	}
): string {
	const {
		invoiceNumber,
		invoiceDate,
		month,
		year,
		totalDeliveries,
		totalCollections,
		deliverySubtotal,
		collectionSubtotal,
		deliveryVAT,
		collectionVAT,
		deliveryTotal,
		collectionTotal,
		grandTotal
	} = invoiceData;

	// Default company info
	const company = {
		name: companyInfo?.name || 'Your Company Name',
		address: companyInfo?.address || 'Your Company Address\nCity, Country',
		email: companyInfo?.email || 'contact@yourcompany.com',
		phone: companyInfo?.phone || '+353 XX XXX XXXX',
		vatNumber: companyInfo?.vatNumber || 'IE1234567X'
	};

	return `
<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Invoice ${invoiceNumber}</title>
	<style>
		* {
			margin: 0;
			padding: 0;
			box-sizing: border-box;
		}
		
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			color: #333;
			background: #fff;
			font-size: 12px;
		}
		
		.invoice-container {
			max-width: 800px;
			margin: 0 auto;
			padding: 30px;
			background: #fff;
		}
		
		.header {
			display: flex;
			justify-content: space-between;
			align-items: flex-start;
			margin-bottom: 40px;
			border-bottom: 2px solid #eee;
			padding-bottom: 20px;
		}
		
		.company-info h1 {
			color: #000000;
			font-size: 28px;
			margin-bottom: 10px;
			font-weight: 700;
		}
		
		.company-info p {
			margin-bottom: 4px;
			color: #666;
		}
		
		.invoice-details {
			text-align: right;
		}
		
		.invoice-details h2 {
			font-size: 32px;
			color: #1f2937;
			margin-bottom: 10px;
			font-weight: 300;
		}
		
		.invoice-meta {
			background: #f8fafc;
			padding: 20px;
			border-radius: 8px;
			margin-bottom: 30px;
		}
		
		.meta-row {
			display: flex;
			justify-content: space-between;
			margin-bottom: 8px;
		}
		
		.meta-row:last-child {
			margin-bottom: 0;
		}
		
		.meta-label {
			font-weight: 600;
			color: #374151;
		}
		
		.meta-value {
			color: #2c2e33;
		}
		
		.services-table {
			width: 100%;
			border-collapse: collapse;
			margin-bottom: 30px;
			box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
			border-radius: 8px;
			overflow: hidden;
		}
		
		.services-table th {
			background: #eee;
			color: black;
			padding: 15px 12px;
			text-align: left;
			font-weight: 600;
			font-size: 11px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}
		
		.services-table td {
			padding: 12px;
			border-bottom: 1px solid #e5e7eb;
		}
		
		.services-table tr:last-child td {
			border-bottom: none;
		}
		
		.services-table tr:nth-child(even) {
			background: #f9fafb;
		}
		
		.text-right {
			text-align: right;
		}
		
		.font-medium {
			font-weight: 500;
		}
		
		.totals-section {
			float: right;
			width: 300px;
			margin-top: 20px;
		}
		
		.totals-table {
			width: 100%;
			border-collapse: collapse;
		}
		
		.totals-table td {
			padding: 8px 12px;
			border-bottom: 1px solid #a1a1a1;
		}
		
		.totals-table tr:last-child td {
			border-bottom: 2px solid #1f2937;
			font-weight: 700;
			background: #f3f4f6;
			font-size: 14px;
		}
		
		.subtotal-row td {
			color: #1b1d21;
		}
		
		.vat-row td {
			color: #2b2b2b;
			font-style: italic;
		}
		
		.footer {
			clear: both;
			margin-top: 60px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
			text-align: center;
			color: #9ca3af;
			font-size: 11px;
		}
		
			.payment-terms {
			margin-top: 30px;
			padding: 20px;
			background: #f1f1f1;
			border-left: 4px solid #383736;
			border-radius: 0 4px 4px 0;
		}
		
		.payment-terms h3 {
			color: #323232;
			margin-bottom: 8px;
			font-size: 14px;
		}
		
		.payment-terms p {
			color: #3a3a3a;
			font-size: 11px;
		}
		
		@media print {
			body {
				font-size: 11px;
			}
			
			.invoice-container {
				padding: 20px;
			}
			
			.payment-terms {
				break-inside: avoid;
			}
		}
	</style>
</head>
<body>
	<div class="invoice-container">
		<div class="header">
			<div class="company-info">
				<h1>${company.name}</h1>
				<p>${company.address.replace(/\n/g, '<br>')}</p>
				<p>Email: ${company.email}</p>
				<p>Phone: ${company.phone}</p>
				<p>VAT Number: ${company.vatNumber}</p>
			</div>
			<div class="invoice-details">
				<h2>INVOICE</h2>
				<p><strong>Invoice #:</strong> ${invoiceNumber}</p>
				<p><strong>Date:</strong> ${formatDate(invoiceDate)}</p>
			</div>
		</div>
		
		<div class="invoice-meta">
			<div class="meta-row">
				<span class="meta-label">Billing Period:</span>
				<span class="meta-value">${getMonthName(month)} ${year}</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Service Type:</span>
				<span class="meta-value">Courier & Delivery Services</span>
			</div>
			<div class="meta-row">
				<span class="meta-label">Total Days with Service:</span>
				<span class="meta-value">${invoiceData.records.length} days</span>
			</div>
		</div>
		
		<table class="services-table">
			<thead>
				<tr>
					<th>Description</th>
					<th>Quantity</th>
					<th>Unit Price</th>
					<th>Subtotal</th>
					<th>VAT (23%)</th>
					<th>Total</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>
						<strong>Parcel Delivery Services</strong><br>
						<small>Monthly parcel delivery services for ${getMonthName(month)} ${year}</small>
					</td>
					<td class="text-right">${totalDeliveries.toLocaleString()}</td>
					<td class="text-right">${formatCurrency(4.0)}</td>
					<td class="text-right">${formatCurrency(deliverySubtotal)}</td>
					<td class="text-right">${formatCurrency(deliveryVAT)}</td>
					<td class="text-right font-medium">${formatCurrency(deliveryTotal)}</td>
				</tr>
				<tr>
					<td>
						<strong>Parcel Collection Services</strong><br>
						<small>Monthly parcel collection services for ${getMonthName(month)} ${year}</small>
					</td>
					<td class="text-right">${totalCollections.toLocaleString()}</td>
					<td class="text-right">${formatCurrency(1.0)}</td>
					<td class="text-right">${formatCurrency(collectionSubtotal)}</td>
					<td class="text-right">${formatCurrency(collectionVAT)}</td>
					<td class="text-right font-medium">${formatCurrency(collectionTotal)}</td>
				</tr>
			</tbody>
		</table>
		
		<div class="totals-section">
			<table class="totals-table">
				<tr class="subtotal-row">
					<td>Subtotal:</td>
					<td class="text-right">${formatCurrency(deliverySubtotal + collectionSubtotal)}</td>
				</tr>
				<tr class="vat-row">
					<td>VAT (23%):</td>
					<td class="text-right">${formatCurrency(deliveryVAT + collectionVAT)}</td>
				</tr>
				<tr>
					<td><strong>Total Amount:</strong></td>
					<td class="text-right"><strong>${formatCurrency(grandTotal)}</strong></td>
				</tr>
			</table>
		</div>
		
		<div class="payment-terms">
			<h3>Payment Terms</h3>
			<p>Payment is due within 7 days of invoice date. Late payments may be subject to interest charges. Thank you for your business!</p>
		</div>
		
		<div class="footer">
			<p>This invoice was generated automatically on ${formatDate(invoiceDate)}</p>
			<p>For any questions regarding this invoice, please contact ${company.email}</p>
		</div>
	</div>
</body>
</html>`;
}
