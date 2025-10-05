import { pgPool } from '$lib/db';

export type UsageMode = 'standard' | 'no_used' | 'other';

export interface RecordRow {
	id?: number;
	organization_id: number;
	depot_id?: number | null;
	vehicle_id: number;
	user_id: number;
	entry_date: string; // YYYY-MM-DD
	loaded: number;
	collected: number;
	cutters: number;
	returned: number;
	missplaced?: number | null;
	expense?: number | null;
	expense_no_vat?: number | null;
	odometer_start?: number | null;
	odometer_end?: number | null;
	image_path?: string | null;
	note?: string | null;
	created_at?: string;
	updated_at?: string;
}

export interface VehicleUsageRow {
	id?: number;
	record_id: number;
	vehicle_id: number;
	user_id: number;
	entry_date: string; // YYYY-MM-DD
	usage_mode: UsageMode;
	odometer_start?: number | null;
	odometer_end?: number | null;
	distance_manual?: number | null;
	purpose?: string | null;
	comment?: string | null;
}

export class RecordService {
	// Return all records ordered by entry_date desc
	static async getAllRecords(): Promise<any[]> {
		const q = `
      select
        id,
        organization_id,
        depot_id,
        vehicle_id,
        user_id,
        entry_date,
        loaded,
        collected,
        cutters,
        returned,
        coalesce(missplaced, 0) as missplaced,
        coalesce(expense, 0) as expense,
        coalesce(expense_no_vat, 0) as expense_no_vat,
        odometer_end as odometer,
        image_path,
        note,
        created_at,
        updated_at
      from public.records
      order by entry_date desc, created_at desc nulls last;
    `;
		const { rows } = await pgPool.query(q);
		return rows;
	}

	static async getRecordById(id: number): Promise<any | null> {
		const { rows } = await pgPool.query(
			`select *, odometer_end as odometer from public.records where id = $1 limit 1`,
			[id]
		);
		return rows[0] ?? null;
	}

	static async getRecordWithVehicleUsageById(id: number): Promise<any | null> {
		const { rows } = await pgPool.query(
			`select r.*, r.odometer_end as odometer, v.* as _ignored
       from public.records r
       left join public.vehicle_usage_log v on v.record_id = r.id
       where r.id = $1`,
			[id]
		);
		// Return record with nested vehicle_usage array
		if (!rows.length) return null;
		const base = rows[0];
		const vehicle_usage = rows
			.filter((r: any) => r.record_id)
			.map((r: any) => ({
				id: r.id,
				record_id: r.record_id,
				vehicle_id: r.vehicle_id,
				user_id: r.user_id,
				entry_date: r.entry_date,
				usage_mode: r.usage_mode,
				odometer_start: r.odometer_start,
				odometer_end: r.odometer_end,
				distance_manual: r.distance_manual,
				purpose: r.purpose,
				comment: r.comment,
				created_at: r.created_at
			}));
		return { ...base, vehicle_usage };
	}

	static async getRecordsByMonth(year: number, month: number): Promise<any[]> {
		const { rows } = await pgPool.query(
			`select *, odometer_end as odometer
       from public.records
       where extract(year from entry_date) = $1
         and extract(month from entry_date) = $2
       order by entry_date asc`,
			[year, month]
		);
		return rows;
	}

	static async updateRecord(
		id: number,
		fields: Partial<RecordRow & { odometer?: number }>
	): Promise<any> {
		// Map compatibility: odometer -> odometer_end
		const mapFields: any = { ...fields };
		if (mapFields.odometer !== undefined) {
			mapFields.odometer_end = mapFields.odometer;
			delete mapFields.odometer;
		}
		// Build dynamic update
		const keys = Object.keys(mapFields);
		if (!keys.length) return await this.getRecordById(id);
		const setClauses = keys.map((k, i) => `${k} = $${i + 1}`);
		const values = keys.map((k) => (mapFields as any)[k]);
		const q = `update public.records set ${setClauses.join(', ')}, updated_at = now() where id = $$
    {idx} returning *, odometer_end as odometer`;
		const query = q.replace('$$\n    {idx}', `$${keys.length + 1}`);
		const { rows } = await pgPool.query(query, [...values, id]);
		return rows[0];
	}

	static async deleteRecord(id: number): Promise<boolean> {
		const res = await pgPool.query(`delete from public.records where id = $1`, [id]);
		return (res.rowCount ?? 0) > 0;
	}

	static async deleteVehicleUsageLogByRecordId(recordId: number): Promise<void> {
		await pgPool.query(`delete from public.vehicle_usage_log where record_id = $1`, [recordId]);
	}

	static async createVehicleUsageLog(input: {
		record_id: number;
		vehicle_id: number;
		user_id?: number;
		entry_date: string;
		usage_mode: UsageMode;
		odometer_end?: number;
		distance_manual?: number;
		purpose?: string;
		comment?: string;
	}): Promise<void> {
		const {
			record_id,
			vehicle_id,
			user_id = 1,
			entry_date,
			usage_mode,
			odometer_end,
			distance_manual = 0,
			purpose,
			comment
		} = input;

		let odoStart: number | null = null;
		if (usage_mode === 'standard' && typeof odometer_end === 'number') {
			// previous odometer_end for this vehicle prior to this date
			const { rows: prev } = await pgPool.query(
				`select odometer_end from public.vehicle_usage_log
         where vehicle_id = $1 and entry_date < $2 and odometer_end is not null
         order by entry_date desc, id desc limit 1`,
				[vehicle_id, entry_date]
			);
			odoStart = prev[0]?.odometer_end ?? null;
		}

		await pgPool.query(
			`insert into public.vehicle_usage_log
       (record_id, vehicle_id, user_id, entry_date, usage_mode, odometer_start, odometer_end, distance_manual, purpose, comment)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
			[
				record_id,
				vehicle_id,
				user_id,
				entry_date,
				usage_mode,
				odoStart,
				odometer_end ?? null,
				distance_manual,
				purpose ?? null,
				comment ?? null
			]
		);
	}

	static async getVehicleUsageLogByDate(date: string): Promise<any[] | null> {
		const { rows } = await pgPool.query(
			`select * from public.vehicle_usage_log where entry_date = $1 order by vehicle_id`,
			[date]
		);
		return rows.length ? rows : null;
	}

	static async getOdometerDifferencesByMonth(
		year: number,
		month: number
	): Promise<{ date: string; distance: number }[]> {
		const { rows } = await pgPool.query(
			`select entry_date as date,
              sum(
                case when usage_mode = 'standard' and odometer_end is not null and odometer_start is not null
                     then greatest(odometer_end - odometer_start, 0)
                     else coalesce(distance_manual, 0)
                end
              )::int as distance
       from public.vehicle_usage_log
       where extract(year from entry_date) = $1
         and extract(month from entry_date) = $2
       group by entry_date
       order by entry_date asc`,
			[year, month]
		);
		return rows;
	}

	static async getOdometerStatsByMonth(
		year: number,
		month: number
	): Promise<{
		totalDistance: number;
		averageDaily: number;
		maxDaily: number;
		minDaily: number;
		daysWithReadings: number;
		startOdometer: number;
		endOdometer: number;
	}> {
		const daily = await this.getOdometerDifferencesByMonth(year, month);
		const distances = daily.map((d) => d.distance).filter((n) => n > 0);
		const total = distances.reduce((a, b) => a + b, 0);
		const days = distances.length;
		const avg = days ? total / days : 0;
		const max = distances.length ? Math.max(...distances) : 0;
		const min = distances.length ? Math.min(...distances) : 0;

		const { rows: bounds } = await pgPool.query(
			`select min(odometer_start) as start, max(odometer_end) as finish
       from public.vehicle_usage_log
       where extract(year from entry_date) = $1 and extract(month from entry_date) = $2`,
			[year, month]
		);
		const startOdometer = Number(bounds[0]?.start ?? 0);
		const endOdometer = Number(bounds[0]?.finish ?? 0);

		return {
			totalDistance: total,
			averageDaily: Number(avg.toFixed(2)),
			maxDaily: max,
			minDaily: min,
			daysWithReadings: days,
			startOdometer,
			endOdometer
		};
	}
}
