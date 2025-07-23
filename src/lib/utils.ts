import fs from 'fs';
import path from 'path';

export function createImagePath(file: File): string {
	const now = new Date();
	const year = now.getFullYear();
	const month = now.toLocaleDateString('en-US', { month: 'short' }); // jan, feb, etc.

	const folderPath = path.join(process.cwd(), 'static', 'images', year.toString(), month);

	// Create directory if it doesn't exist
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath, { recursive: true });
	}

	// Generate unique filename
	const timestamp = Date.now();
	const extension = path.extname(file.name);
	const filename = `${timestamp}${extension}`;

	return path.join('images', year.toString(), month, filename);
}

export async function saveImageFile(file: File, relativePath: string): Promise<void> {
	const fullPath = path.join(process.cwd(), 'static', relativePath);
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(fullPath, buffer);
}

export function deleteImageFile(relativePath: string): void {
	try {
		const fullPath = path.join(process.cwd(), 'static', relativePath);
		if (fs.existsSync(fullPath)) {
			fs.unlinkSync(fullPath);
		}
	} catch (error) {
		console.error('Failed to delete image:', error);
	}
}

export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		// year: 'numeric',
		month: 'short',
		day: 'numeric'
		// hour: '2-digit',
		// minute: '2-digit'
	});
}

export function formatDateOnly(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

//Calculates analytics from delivery records
// @param records Array of delivery records
// @returns Object containing calculated analytics
//
export interface DeliveryRecord {
	loaded: number;
	returned: number;
	missplaced?: number;
	collected?: number;
	cutters?: number;
	expense?: number;
}

const PPU_DELIVERY = 4; // Price per delivery without tax
const PPU_COLLECTION = 1; // Price per collection without tax
const TAX_RATE = 0.23; // Tax rate (23%)

export function calculateAnalytics(records: DeliveryRecord[]) {
	// Basic metrics
	const totalDelivered = records.reduce(
		(sum, record) =>
			sum +
			(record.loaded -
				((record.collected || 0) + (record.cutters || 0)) -
				(record.returned + (record.missplaced || 0)) || 0),
		0
	);

	const totalCollected = records.reduce((sum, record) => sum + (record.collected || 0), 0);

	const averagePerDay = records.length > 0 ? totalDelivered / records.length : 0;

	// Financial calculations
	// const deliveryRate = 4 * 1.23; // Price per delivery with tax
	// const collectionRate = 1 * 1.23; // Price per collection with tax

	const deliverySum = records.reduce(
		(sum, record) =>
			sum +
			(record.loaded - (record.returned + (record.missplaced || 0))) * PPU_DELIVERY * (1 + TAX_RATE),
		0
	);

	const collectedSum = records.reduce(
		(sum, record) => sum + (record.collected || 0) * PPU_COLLECTION * (1 + TAX_RATE),
		0
	);

	const expenseSum = records.reduce((sum, record) => sum + (record.expense || 0), 0);

	const toInvoice = deliverySum + collectedSum;
	const balance = toInvoice - expenseSum;

	return {
		totalDelivered,
		totalCollected,
		averagePerDay,
		deliverySum,
		collectedSum,
		expenseSum,
		toInvoice,
		balance
	};
}

/**
 * Format currency values
 * @param value Number to format as currency
 * @returns Formatted currency string
 */
export function formatCurrency(value: string | number | bigint) {
	return new Intl.NumberFormat('en-IE', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2
	}).format(typeof value === 'string' ? Number(value) : value);
}

/**
 * Format number with 1 decimal place
 * @param value Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: string | number | bigint) {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 1,
		maximumFractionDigits: 1
	}).format(typeof value === 'string' ? Number(value) : value);
}

/**
 * Get month name from month number
 * @param month Month number (1-12)
 * @returns Month name
 */
export function getMonthName(month: number) {
	const monthNames = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];
	return monthNames[month - 1];
}

/**
 * Calculate the monetary value of delivered items
 * @param delivered Number of delivered items
 * @param price Price per delivered item
 * @param taxRate Tax rate to apply
 * @default price 4
 * @default taxRate 0.23
 * @returns Monetary value including tax
 */
export function calculateDeliveryValue(
	delivered: number,
	price: number = PPU_DELIVERY,
	taxRate: number = TAX_RATE
) {
	return delivered * price * (1 + taxRate);
}

/**
 * Calculate the monetary value of collected items
 * @param collected Number of collected items
 * @param price Price per collected item
 * @param taxRate Tax rate to apply
 * @default price 1
 * @default taxRate 0.23
 * @returns Monetary value including tax
 */
export function calculateCollectedValue(
	collected: number,
	price: number = PPU_COLLECTION,
	taxRate: number = TAX_RATE
) {
	return collected * price * (1 + taxRate);
}
// export function isToday(dateString: string): boolean {
// 	const date = new Date(dateString);
// 	const today = new Date();
// 	return date.toDateString() === today.toDateString();
// }

// export function isYesterday(dateString: string): boolean {
// 	const date = new Date(dateString);
// 	const yesterday = new Date();
// 	yesterday.setDate(yesterday.getDate() - 1);
// 	return date.toDateString() === yesterday.toDateString();
// }
