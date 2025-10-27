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
		bank?: {
			name?: string;
			iban?: string;
			bic?: string;
		};
	},
	invoiceReceiver?: {
		name?: string;
		address?: string;
		email?: string;
		phone?: string;
		vatNumber?: string;
	},
	options?: {
		dueDays?: number;
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

	// Calculate due date (7 days from invoice date by default)
	const dueDays = options?.dueDays || 14;
	const dueDate = new Date(invoiceDate);
	dueDate.setDate(dueDate.getDate() + dueDays);
	const dueDateString = dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD

	// Default company info
	const company = {
		name: companyInfo?.name || '',
		address: companyInfo?.address || '',
		email: companyInfo?.email || '',
		phone: companyInfo?.phone || '',
		vatNumber: companyInfo?.vatNumber || '',
		bank: {
			name: companyInfo?.bank?.name || '',
			iban: companyInfo?.bank?.iban || '',
			bic: companyInfo?.bank?.bic || ''
		}
	};

	// Default receiver info
	const receiver = {
		name: invoiceReceiver?.name || '',
		address: invoiceReceiver?.address || '',
		email: invoiceReceiver?.email || '',
		phone: invoiceReceiver?.phone || '',
		vatNumber: invoiceReceiver?.vatNumber || ''
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
			font-size: 32px;
			margin-bottom: 10px;
			font-weight: 700;
			text-align: left;
		}
		
		.company-info p {
			margin-bottom: 4px;
			color: #666;
		}
		
		.invoice-details {
			text-align: right;
		}
		
		.invoice-details p {
			margin-bottom: 6px;
			font-size: 14px;
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
			text-align: right;
			font-weight: 600;
			font-size: 8px;
			text-transform: uppercase;
			letter-spacing: 0.5px;
            &:first-child {
                text-align: left;
            }
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
			// float: right;
			// width: 300px;
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
			color: #4b5563;
			font-size: 12px;
		}
		
		.footer p {
			margin-bottom: 5px;
			font-weight: 500;
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
		
		.invoice-parties {
			display: flex;
			justify-content: space-between;
			margin-bottom: 30px;
		}
		
		.from-section, .to-section {
			width: 48%;
		}
		
		.to-section {
			padding-top: 15px;
		}
		
		.section-title {
			font-weight: 600;
			color: #6b7280;
			text-transform: uppercase;
			font-size: 12px;
			margin-bottom: 10px;
			letter-spacing: 0.5px;
		}
		
		.bank-info {

		}
		
		.bank-info p {
			margin: 4px 0;
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
            
            .footer {
				color: #4b5563 !important;
				-webkit-print-color-adjust: exact;
				print-color-adjust: exact;
			}
			
			.footer p {
				color: #4b5563 !important;
                font-size: 10px !important;
			}
		}
	</style>
</head>
<body>
	<div class="invoice-container">
		<div class="header">
			<div class="company-info">
				<h1>INVOICE</h1>
			</div>
			<div class="invoice-details">
				<p><strong>Invoice #:</strong> ${invoiceNumber}</p>
				<p><strong>Issued Date:</strong> ${formatDate(invoiceDate)}</p>
				<p><strong>Due Date:</strong> ${formatDate(dueDateString)}</p>
			</div>
		</div>
		
		<div class="invoice-parties">
			<div class="from-section">
				<div class="section-title">From:</div>
				<p><strong>${company.name}</strong></p>
				<p>${company.address.replace(/,\s*/g, '<br>').replace(/\n/g, '<br>')}</p>
				${company.email ? `<p>Email: ${company.email}</p>` : ''}
				${company.phone ? `<p>Phone: ${company.phone}</p>` : ''}
				${company.vatNumber ? `<p>VAT: ${company.vatNumber}</p>` : ''}
				
				<div class="to-section">
					<div class="section-title">Bill To:</div>
					<p><strong>${receiver.name}</strong></p>
					<p>${receiver.address.replace(/,\s*/g, '<br>').replace(/\n/g, '<br>')}</p>
					${receiver.email ? `<p>Email: ${receiver.email}</p>` : ''}
					${receiver.phone ? `<p>Phone: ${receiver.phone}</p>` : ''}
					${receiver.vatNumber ? `<p>VAT: ${receiver.vatNumber}</p>` : ''}
				</div>
			</div>
			
			<div class="from-section">
					<div class="section-title">Bank Details:</div>
					<p><strong>Bank:</strong> ${company.bank.name}</p>
					<p><strong>IBAN:</strong> ${company.bank.iban}</p>
					<p><strong>BIC:</strong> ${company.bank.bic}</p>
				
			</div>
		</div>
		
		<div class="invoice-meta">
			<div class="meta-row">
				<span class="meta-label">Billing Period:</span>
				<span class="meta-value">${getMonthName(month - 1)} ${year}</span>
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
						<small>Monthly parcel delivery services for ${getMonthName(month - 1)} ${year}</small>
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
						<small>Monthly parcel collection services for ${getMonthName(month - 1)} ${year}</small>
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
				<tr>
					<td><strong>Total Amount:</strong></td>
					<td class="text-right"><strong>${formatCurrency(grandTotal)}</strong></td>
				</tr>
			</table>
		</div>
		
		<div class="footer">
			<p>Thank you for your business!</p>
			${company.email ? `<p>For any questions regarding this invoice, please contact ${company.email}</p>` : ''}
		</div>
	</div>
</body>
</html>`;
}
