import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pgPool } from '$lib/db';

export const GET: RequestHandler = async () => {
  try {
    const res = await pgPool.query('select 1 as ok');
    const okVal = res.rows?.[0]?.ok;
    const ok = okVal === 1 || okVal === '1';
    return json({ ok, db: 'up' }, { status: ok ? 200 : 500 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? 'db error' }, { status: 500 });
  }
};
