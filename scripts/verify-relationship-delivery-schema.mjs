// Optional isolated SQL verification. Install PGlite into an ignored scratch
// directory; it is never a runtime dependency or a production DB connection.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const moduleFile = process.argv[2];
if (!moduleFile) throw new Error('Pass the local PGlite module file path.');
const { PGlite } = await import(pathToFileURL(path.resolve(moduleFile)).href);
const db = new PGlite();
try {
    await db.exec(`
        CREATE ROLE anon;
        CREATE ROLE authenticated;
        CREATE ROLE service_role BYPASSRLS;
        CREATE TABLE public.one_time_order_inputs (id uuid PRIMARY KEY, product_type text NOT NULL);
        ALTER TABLE public.one_time_order_inputs ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "No direct access" ON public.one_time_order_inputs USING(false) WITH CHECK(false);
        GRANT ALL ON public.one_time_order_inputs TO service_role;
    `);
    const setup = await readFile(new URL('../server/scripts/sql/relationship-email-delivery.sql', import.meta.url), 'utf8');
    await db.exec(setup);
    await db.exec(setup);
    const orderId = '00000000-0000-4000-8000-000000000001';
    await db.query('INSERT INTO one_time_order_inputs(id,product_type) VALUES($1,$2)', [orderId, 'relationship_tarot']);
    await db.exec(`
        INSERT INTO relationship_email_events(event_id,email_id,event_type,event_at,alert_pending)
        SELECT 'unrelated-'||i, 'other-'||i, 'email.bounced', now()-interval '1 hour', true FROM generate_series(1,51) i;
        INSERT INTO relationship_email_events(event_id,email_id,event_type,event_at,alert_pending)
        VALUES ('paid-event','paid-email','email.bounced',now(),true);
        SET ROLE service_role;
    `);
    assert.equal((await db.query('SELECT * FROM relationship_pending_email_alerts')).rows.length, 0);
    await db.query('UPDATE one_time_order_inputs SET email_id=$1,email_sent_at=now() WHERE id=$2', ['paid-email', orderId]);
    assert.equal((await db.query('SELECT * FROM relationship_pending_email_alerts ORDER BY event_at LIMIT 50')).rows.length, 1);
    await assert.rejects(db.query("UPDATE one_time_order_inputs SET email_id='different-email' WHERE id=$1", [orderId]), /immutable/);
    await assert.rejects(db.query("INSERT INTO relationship_email_events(event_id,email_id,event_type,event_at) VALUES('paid-event','paid-email','email.sent',now())"), { code: '23505' });
    const claim = "UPDATE relationship_email_events SET alert_claim=$1,alert_claim_until=now()+interval '10 minutes' WHERE event_id='paid-event' AND alert_claim='idle' AND alert_pending=true RETURNING event_id";
    assert.equal((await db.query(claim, ['worker-1'])).rows.length, 1);
    assert.equal((await db.query(claim, ['worker-2'])).rows.length, 0);
    assert.equal((await db.query('SELECT * FROM relationship_pending_email_alerts')).rows.length, 0);
    await db.exec('RESET ROLE; SET ROLE anon;');
    await assert.rejects(db.query('SELECT * FROM relationship_email_events'), { code: '42501' });
    await assert.rejects(db.query('SELECT * FROM relationship_pending_email_alerts'), { code: '42501' });
    await db.exec('RESET ROLE; SET ROLE authenticated;');
    await assert.rejects(db.query('SELECT * FROM relationship_email_events'), { code: '42501' });
    await assert.rejects(db.query('SELECT * FROM relationship_pending_email_alerts'), { code: '42501' });
    console.log('SQL schema verified: repeatable setup, early event association, joined alert selection, immutable provider ID, event uniqueness, atomic claim, restricted roles.');
} finally {
    await db.close();
}
