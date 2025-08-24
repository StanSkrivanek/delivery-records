// src/lib/invoice.server.ts
import { RecordService } from '$lib/db.server';
import {
	PPU_DELIVERY,
	PPU_COLLECTION,
	TAX_RATE,
	calculateTotalDelivered,
	calculateTotalCollected,
	type DeliveryRecord
	// dlvPd
} from '$lib/utils';

export interface InvoiceData {
	invoiceNumber: string;
	invoiceDate: string;
	month: number;
	year: number;
	totalDeliveries: number;
	totalCollections: number;
	deliverySubtotal: number;
	collectionSubtotal: number;
	deliveryVAT: number;
	collectionVAT: number;
	deliveryTotal: number;
	collectionTotal: number;
	grandTotal: number;
	records: DeliveryRecord[];
}
export class InvoiceService {
	/**
	 * Generate invoice data for a specific month
	 */
	static async generateInvoiceData(year: number, month: number): Promise<InvoiceData> {
		const records = await RecordService.getRecordsByMonth(year, month);

		// Calculate totals
		const totalDeliveries = calculateTotalDelivered(records);
		const totalCollections = calculateTotalCollected(records);

		// Calculate financial values
		const deliverySubtotal = totalDeliveries * PPU_DELIVERY;
		const collectionSubtotal = totalCollections * PPU_COLLECTION;

		const deliveryVAT = deliverySubtotal * TAX_RATE;
		const collectionVAT = collectionSubtotal * TAX_RATE;

		const deliveryTotal = deliverySubtotal + deliveryVAT;
		const collectionTotal = collectionSubtotal + collectionVAT;

		const grandTotal = deliveryTotal + collectionTotal;

		// Generate invoice number (format: YYYY-MM-001)
		const invoiceNumber = `${year}-${String(month).padStart(2, '0')}-001`;
		const invoiceDate = new Date().toISOString().split('T')[0];

		return {
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
			grandTotal,
			records
		};
	}

	/**
	 * Get monthly summary for multiple months (for comparison)
	 */
	static async getMonthlyInvoiceSummaries(year: number): Promise<InvoiceData[]> {
		const summaries: InvoiceData[] = [];

		for (let month = 1; month <= 12; month++) {
			try {
				const invoiceData = await this.generateInvoiceData(year, month);
				if (invoiceData.records.length > 0) {
					summaries.push(invoiceData);
				}
			} catch (error) {
				console.error(`Error generating invoice for ${year}-${month}:`, error);
			}
		}

		return summaries;
	}
}