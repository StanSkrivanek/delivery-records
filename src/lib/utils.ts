import fs from 'fs';
import path from 'path';

const PPU_DELIVERY = 4; // Price per delivery without tax
const PPU_COLLECTION = 1; // Price per collection without tax
const TAX_RATE = 0.23; // Tax rate (23%)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ODOMETER_INIT = 267317;  //INITIAL ODOMETER VALUE, NOT USED IN CALCULATIONS
/**
 * Type definition for a delivery record
 */
interface DeliveryRecord {
	loaded: number;
	returned?: number;
	collected?: number;
	cutters?: number;
	missplaced?: number;
	expense?: number;
	entry_date: string;
	created_at?: string;
	image_path?: string;
	note?: string;
	odometer?: number;
}

/**
 * Type definition for record totals
 */
interface RecordTotals {
	loaded: number;
	returned?: number;
	collected: number;
	cutters: number;
	missplaced: number;
	delivered: number;
	expense: number;
	odometer: number;
	deliveryValue: number;
	collectedValue: number;
	totalValue: number;
}
// IMAGE HELPER-fn-

// This function creates a path for storing images based on the current year and month.
// It creates a directory structure like static/images/2023/Oct/ and returns the relative path to the image file.
// The filename is generated using the current timestamp to ensure uniqueness.
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

/**  This function saves the file to the static/images directory with a unique name based on the current timestamp.
 * It uses the `arrayBuffer` method to read the file data and writes it to the specified path.
 * The `relativePath` should be the path relative to the static directory, e.g., 'images/2023/Oct/1234567890.jpg'.
 * The function creates the necessary directories if they do not exist.*/

/**
 * Save an image file to the static directory
 * @param file File object to save
 * @param relativePath Relative path where the file should be saved
 */

export async function saveImageFile(file: File, relativePath: string): Promise<void> {
	const fullPath = path.join(process.cwd(), 'static', relativePath);
	const buffer = Buffer.from(await file.arrayBuffer());
	fs.writeFileSync(fullPath, buffer);
}

// This function checks if the file exists and deletes it if it does.

/**
 * Delete an image file from the static directory
 * @param relativePath Relative path to the image file
 */
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

// DATE HELPER FUNCTIONS
/**
 * Format a date string to a more readable format (e.g., "Oct 1, 2023").
 * @param {string} dateString - The date string to format.
 * @returns {string} - The formatted date string.
 */
export function formatDate(dateString: string): string {
	return new Date(dateString).toLocaleDateString('en-IE', {
		// year: 'numeric',
		month: 'short',
		day: 'numeric'
		// hour: '2-digit',
		// minute: '2-digit'
	});
}

// DELIVERY ANALYTICS HELPER FUNCTIONS
/**
 * Calculates the total delivered items from a delivery record.
 * @param {DeliveryRecord} record The delivery record to calculate from.
 * @returns {number} The total delivered items.
 */

export function dlvPd(record: DeliveryRecord): number {
	return (
		record.loaded -
			((record.collected ?? 0) + (record.cutters ?? 0)) -
			((record.returned ?? 0) + (record.missplaced ?? 0)) || 0
	);
}

/**
 * Calculates the average delivered items per day from an array of delivery records.
 * @param {DeliveryRecord[]} records - Array of delivery records.
 * @returns {number} - The average delivered items per day.
 */
export function dpm(records: DeliveryRecord[]): number {
	const totalDelivered = records.reduce(
		(sum, record) =>
			sum +
			(record.loaded -
				((record.collected || 0) + (record.cutters || 0)) -
				((record.returned ?? 0) + (record.missplaced || 0)) || 0),
		0
	);
	return records.length > 0 ? totalDelivered / records.length : 0;
}

//Calculates analytics from delivery records
// @param records Array of delivery records
// @returns Object containing calculated analytics
//


export function calculateAnalytics(records: DeliveryRecord[]) {
	// Basic metrics
	const totalDelivered = calculateTotalDelivered(records);
	const totalCollected = calculateTotalCollected(records);
	const averagePerDay = records.length > 0 ? totalDelivered / records.length : 0;

	// Financial calculations
	const deliverySum = calculateTotalDeliveryValue(records);
	const collectedSum = calculateTotalCollectionValue(records);
	const expenseSum = calculateTotalExpense(records);
	const returnedSum = records.reduce((sum, record) => sum + (record.returned ?? 0), 0);

	const toInvoice = deliverySum + collectedSum;
	const balance = toInvoice - expenseSum;

	return {
		totalDelivered,
		totalCollected,
		averagePerDay,
		deliverySum,
		collectedSum,
		returnedSum,
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

export function NumberNoDecimals(value: string | number | bigint) {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(typeof value === 'string' ? Number(value) : value);
}

export function formatNumberWithCommas(value: string | number | bigint) {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
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

/**
 * Calculates the total items delivered from an array of records
 * @param records Array of delivery records
 * @returns Total number of items delivered
 */
export function calculateTotalDelivered(records: DeliveryRecord[]): number {
	return records.reduce((sum, record) => sum + dlvPd(record), 0);
}

/**
 * Calculates the total items collected from an array of records
 * @param records Array of delivery records
 * @returns Total number of collected items
 */
export function calculateTotalCollected(records: DeliveryRecord[]): number {
	return records.reduce(
		(sum, record) => sum + ((record.collected ?? 0) + (record.cutters ?? 0)),
		0
	);
}

/**
 * Calculates the total monetary value of delivered items
 * @param records Array of delivery records
 * @returns Total value of delivered items
 */
export function calculateTotalDeliveryValue(records: DeliveryRecord[]): number {
	return records.reduce((sum, record) => sum + calculateDeliveryValue(dlvPd(record)), 0);
}

/**
 * Calculates the total monetary value of collected items
 * @param records Array of delivery records
 * @returns Total value of collected items
 */
export function calculateTotalCollectionValue(records: DeliveryRecord[]): number {
	return records.reduce(
		(sum, record) => sum + calculateCollectedValue((record.collected ?? 0) + (record.cutters ?? 0)),
		0
	);
}

/**
 * Calculates the total expenses from an array of records
 * @param records Array of delivery records
 * @returns Total expenses
 */
export function calculateTotalExpense(records: DeliveryRecord[]): number {
	return records.reduce((sum, record) => sum + (record.expense ?? 0), 0);
}



/**
 * Calculates all record totals needed for tables and analytics
 * @param records Array of delivery records
 * @returns Object with all calculated totals
 */
export function calculateRecordTotals(records: DeliveryRecord[]): RecordTotals {
	const totals: RecordTotals = {
		loaded: 0,
		collected: 0,
		cutters: 0,
		returned: 0,
		missplaced: 0,
		delivered: 0,
		expense: 0,
		odometer: 0,
		deliveryValue: 0,
		collectedValue: 0,
		totalValue: 0
	};

	if (records.length === 0) {
		return totals;
	}

	return records.reduce((acc: RecordTotals, record) => {
		const delivered = dlvPd(record);
		const deliveryValue = calculateDeliveryValue(delivered);
		const collectedValue = calculateCollectedValue((record.collected ?? 0) + (record.cutters ?? 0));

		return {
			loaded: (acc.loaded ?? 0) + (record.loaded ?? 0),
			collected: (acc.collected ?? 0) + (record.collected ?? 0),
			cutters: (acc.cutters ?? 0) + (record.cutters ?? 0),
			returned: (acc.returned ?? 0) + (record.returned ?? 0),
			missplaced: (acc.missplaced ?? 0) + (record.missplaced ?? 0),
			delivered: (acc.delivered ?? 0) + delivered,
			expense: (acc.expense ?? 0) + (record.expense ?? 0),
			odometer: (acc.odometer ?? 0) + (record.odometer ?? 0),
			deliveryValue: (acc.deliveryValue ?? 0) + deliveryValue,
			collectedValue: (acc.collectedValue ?? 0) + collectedValue,
			totalValue: (acc.totalValue ?? 0) + deliveryValue + collectedValue
		};
	}, totals);
}


// ODOMETER HELPER FUNCTIONS

/**
 * Calculate daily distance traveled based on odometer readings
 * @param records Array of delivery records sorted by date (oldest to newest)
 * @returns Array of daily distances with corresponding dates
 */
export function calculateDailyDistances(records: DeliveryRecord[]): { date: string; distance: number }[] {
	// Sort records by date if not already sorted
	const sortedRecords = [...records].sort((a, b) => {
		if (!a.entry_date || !b.entry_date) return 0;
		return new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime();
	});

	const dailyDistances = [];
	let lastValidOdometer: number | null = null;

	for (const record of sortedRecords) {
		// Skip records without odometer readings
		if (record.odometer === undefined || record.odometer === null) {
			continue;
		}

		if (lastValidOdometer !== null) {
			// Calculate distance as current odometer minus previous odometer
			const distance = record.odometer - lastValidOdometer;

			// Only add positive distances to avoid errors in data
			if (distance >= 0) {
				dailyDistances.push({
					date: record.entry_date || new Date().toISOString().split('T')[0],
					distance: distance
				});
			}
		}

		// Update last valid odometer for next calculation
		lastValidOdometer = record.odometer;
	}

	return dailyDistances;
}

/**
 * Calculate total distance traveled from a series of records
 * @param records Array of delivery records
 * @returns Total distance in kilometers
 */
export function calculateTotalDistance(records: DeliveryRecord[]): number {
	const dailyDistances = calculateDailyDistances(records);
	return dailyDistances.reduce((total, day) => total + day.distance, 0);
}

/**
 * Calculate average daily distance
 * @param records Array of delivery records
 * @returns Average daily distance in kilometers
 */
export function calculateAverageDailyDistance(records: DeliveryRecord[]): number {
	const dailyDistances = calculateDailyDistances(records);
	return dailyDistances.length > 0
		? dailyDistances.reduce((total, day) => total + day.distance, 0) / dailyDistances.length
		: 0;
}


/**
 * Filter records for the current month
 * @param records Array of delivery records
 * @returns Array of records from the current month only
 */
export function filterCurrentMonthRecords(records: DeliveryRecord[]): DeliveryRecord[] {
	const now = new Date();
	const currentYear = now.getFullYear();
	const currentMonth = now.getMonth(); // 0-based index (0 = January)

	return records.filter(record => {
		if (!record.entry_date) return false;
		const recordDate = new Date(record.entry_date);
		return recordDate.getFullYear() === currentYear && recordDate.getMonth() === currentMonth;
	});
}

/**
 * Calculate daily distances for the current month
 * @param records Array of delivery records
 * @returns Array of daily distances for the current month
 */
export function calculateCurrentMonthDailyDistances(records: DeliveryRecord[]): { date: string; distance: number }[] {
	const currentMonthRecords = filterCurrentMonthRecords(records);
	return calculateDailyDistances(currentMonthRecords);
}

/**
 * Calculate total distance for the current month
 * @param records Array of delivery records
 * @returns Total distance in kilometers for the current month
 */
export function calculateCurrentMonthTotalDistance(records: DeliveryRecord[]): number {
	const currentMonthRecords = filterCurrentMonthRecords(records);
	return calculateTotalDistance(currentMonthRecords);
}

/**
 * Calculate average daily distance for the current month
 * @param records Array of delivery records
 * @returns Average daily distance in kilometers for the current month
 */
export function calculateCurrentMonthAverageDailyDistance(records: DeliveryRecord[]): number {
	const currentMonthRecords = filterCurrentMonthRecords(records);
	return calculateAverageDailyDistance(currentMonthRecords);
}

/**
 * Get a summary of distance metrics for the current month
 * @param records Array of delivery records
 * @returns Object containing distance metrics for the current month
 */
export function getCurrentMonthDistanceSummary(records: DeliveryRecord[]): {
	totalDistance: number;
	averageDaily: number;
	dailyDistances: { date: string; distance: number }[];
	daysWithData: number;
} {
	const dailyDistances = calculateCurrentMonthDailyDistances(records);
	const totalDistance = dailyDistances.reduce((sum, day) => sum + day.distance, 0);

	return {
		totalDistance,
		averageDaily: dailyDistances.length > 0 ? totalDistance / dailyDistances.length : 0,
		dailyDistances,
		daysWithData: dailyDistances.length
	};
}

/**
 * Format odometer reading with thousands separator
 * @param value Odometer value
 * @returns Formatted odometer string
 */
export function formatOdometer(value: number): string {
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(value);
}

/**
 * Format distance with unit (km)
 * @param distance Distance value
 * @returns Formatted distance string with unit
 */
export function formatDistance(distance: number): string {
	return `${formatNumberWithCommas(distance)} km`;
}

/**
 * Calculate fuel efficiency if you have fuel data
 * @param distance Distance traveled
 * @param fuelUsed Fuel consumed
 * @returns Fuel efficiency in km/L
 */
export function calculateFuelEfficiency(distance: number, fuelUsed: number): number {
	return fuelUsed > 0 ? distance / fuelUsed : 0;
}

/**
 * Get color coding for daily distance (for UI styling)
 * @param distance Daily distance
 * @returns CSS class name or color
 */
export function getDistanceColorClass(distance: number): string {
	if (distance === 0) return 'text-gray-400';
	if (distance < 50) return 'text-green-600';
	if (distance < 100) return 'text-blue-600';
	if (distance < 200) return 'text-yellow-600';
	return 'text-red-600';
}

/**
 * Validate odometer reading
 * @param currentReading Current odometer value
 * @param previousReading Previous odometer value
 * @returns Validation result
 */
export function validateOdometerReading(
	currentReading: number, 
	previousReading: number | null
): { isValid: boolean; message?: string } {
	if (currentReading < 0) {
		return { isValid: false, message: 'Odometer reading cannot be negative' };
	}
	
	if (previousReading !== null && currentReading < previousReading) {
		return { isValid: false, message: 'Odometer reading cannot be less than previous reading' };
	}
	
	if (previousReading !== null && (currentReading - previousReading) > 1000) {
		return { isValid: false, message: 'Daily distance seems unusually high (>1000km)' };
	}
	
	return { isValid: true };
}

/**
 * Calculate average distance per delivery
 * @param totalDistance Total distance traveled
 * @param totalDeliveries Total number of deliveries
 * @returns Average distance per delivery
 */
export function calculateDistancePerDelivery(totalDistance: number, totalDeliveries: number): number {
	return totalDeliveries > 0 ? totalDistance / totalDeliveries : 0;
}