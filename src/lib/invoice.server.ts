// src/lib/invoice.server.ts
import { RecordService } from '$lib/db.server';
import {
	PPU_COLLECTION,
	PPU_DELIVERY,
	TAX_RATE,
	WAN_B_DELIVERY,
	calculateTotalCollected,
	calculateTotalDelivered,
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
	wanBCount: number;
	deliverySubtotal: number;
	collectionSubtotal: number;
	wanBSubtotal: number;
	deliveryVAT: number;
	collectionVAT: number;
	wanBVAT: number;
	deliveryTotal: number;
	collectionTotal: number;
	wanBTotal: number;
	grandTotal: number;
	records: DeliveryRecord[];
}
export class InvoiceService {
	/**
	 * Generate invoice data for a specific month
	 */
	static async generateInvoiceData(
		year: number,
		month: number,
		wanBCount: number = 0
	): Promise<InvoiceData> {
		const records = await RecordService.getRecordsByMonth(year, month);

		// Calculate totals
		let totalDeliveries = calculateTotalDelivered(records);
		const totalCollections = calculateTotalCollected(records);

		// Adjust deliveries for WanB
		// WanB items are subtracted from total deliveries as they have a different rate
		if (wanBCount > 0) {
			totalDeliveries = Math.max(0, totalDeliveries - wanBCount);
		}

		// Calculate financial values
		const deliverySubtotal = totalDeliveries * PPU_DELIVERY;
		const collectionSubtotal = totalCollections * PPU_COLLECTION;
		const wanBSubtotal = wanBCount * WAN_B_DELIVERY;

		const deliveryVAT = deliverySubtotal * TAX_RATE;
		const collectionVAT = collectionSubtotal * TAX_RATE;
		const wanBVAT = wanBSubtotal * TAX_RATE;

		const deliveryTotal = deliverySubtotal + deliveryVAT;
		const collectionTotal = collectionSubtotal + collectionVAT;
		const wanBTotal = wanBSubtotal + wanBVAT;

		const grandTotal = deliveryTotal + collectionTotal + wanBTotal;

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
			wanBCount,
			deliverySubtotal,
			collectionSubtotal,
			wanBSubtotal,
			deliveryVAT,
			collectionVAT,
			wanBVAT,
			deliveryTotal,
			collectionTotal,
			wanBTotal,
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
