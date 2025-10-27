import { RecordService as rs } from '$lib/db.server';
// import { createImagePath, saveImageFile } from '$lib/utils';
// import { fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
// $inspect(rs.getMonthlyInvoiceData(currentYear, currentMonth), 'getMonthlyInvoiceData');
export const load: PageServerLoad = async () => {
	// const records = await rs.getAllRecords();

	const monthly = await rs.getRecordsByCurrentMonth();
	const yearly = await rs.getRecordsByCurrentYear();
	const getLatestOdometer = await rs.getLatestOdometer();

	return {
		// records,
		getLatestOdometer,
		monthly,
		yearly
	};
};
