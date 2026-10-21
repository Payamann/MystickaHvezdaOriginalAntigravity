import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { isProductionRuntime } from './config/runtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const projectUrl = process.env.SUPABASE_URL && !process.env.SUPABASE_URL.startsWith('http')
    ? `https://${process.env.SUPABASE_URL}.supabase.co`
    : process.env.SUPABASE_URL;

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USE_MOCK_SUPABASE = process.env.MOCK_SUPABASE === 'true' || process.env.NODE_ENV === 'test';

function createMockSupabaseClient() {
    const users = new Map();
    const tables = new Map();
    const dailyQuotaCounters = new Map();
    const dailyQuotaReservations = new Map();
    const now = () => new Date().toISOString();

    const tableRows = (table) => {
        if (!tables.has(table)) tables.set(table, []);
        return tables.get(table);
    };

    function quotaBucketKey(userId, usageDate, feature) {
        return `${userId}:${usageDate}:${feature}`;
    }

    function legacyQuotaUsage(userId, usageDate, feature) {
        const sourceTable = feature === 'mentor' ? 'mentor_messages' : 'readings';
        const rows = tableRows(sourceTable);
        return rows.filter(row => {
            const createdAt = new Date(row.created_at || '');
            return row.user_id === userId
                && !Number.isNaN(createdAt.getTime())
                && createdAt.toISOString().slice(0, 10) === usageDate
                && (feature === 'mentor' ? row.role === 'user' : row.type === 'crystal-ball');
        }).length;
    }

    function stableEmailHash(email) {
        return [...String(email).toLowerCase()].reduce(
            (hash, char) => (Math.imul(hash, 31) + char.charCodeAt(0)) >>> 0,
            0
        ).toString(16).padStart(8, '0');
    }

    function makeUser(email, metadata = {}, password = null) {
        const normalizedEmail = String(email).toLowerCase();
        const emailPrefix = Buffer.from(normalizedEmail).toString('hex').slice(0, 24);
        const id = `test-user-${emailPrefix}-${stableEmailHash(normalizedEmail)}`;
        const user = {
            id,
            email,
            user_metadata: metadata,
            created_at: now()
        };
        Object.defineProperty(user, '__mockPassword', {
            value: password,
            writable: true,
            enumerable: false,
        });
        users.set(id, user);
        return user;
    }

    class MockQuery {
        constructor(table) {
            this.table = table;
            this.operation = 'select';
            this.payload = null;
            this.selectOptions = {};
            this.filters = [];
            this.orders = [];
            this.singleResult = false;
            this.maybeSingleResult = false;
            this.limitCount = null;
            this.rangeBounds = null;
        }

        select(_columns = '*', options = {}) {
            this.selectOptions = options || {};
            return this;
        }

        insert(payload) {
            this.operation = 'insert';
            this.payload = payload;
            return this;
        }

        update(payload) {
            this.operation = 'update';
            this.payload = payload;
            return this;
        }

        upsert(payload) {
            this.operation = 'upsert';
            this.payload = payload;
            return this;
        }

        delete() {
            this.operation = 'delete';
            return this;
        }

        eq(column, value) {
            this.filters.push({ op: 'eq', column, value });
            return this;
        }

        neq(column, value) {
            this.filters.push({ op: 'neq', column, value });
            return this;
        }

        is(column, value) {
            this.filters.push({ op: 'is', column, value });
            return this;
        }

        gt(column, value) {
            this.filters.push({ op: 'gt', column, value });
            return this;
        }

        gte(column, value) {
            this.filters.push({ op: 'gte', column, value });
            return this;
        }

        lt(column, value) {
            this.filters.push({ op: 'lt', column, value });
            return this;
        }

        lte(column, value) {
            this.filters.push({ op: 'lte', column, value });
            return this;
        }

        in(column, values) {
            this.filters.push({ op: 'in', column, value: values });
            return this;
        }

        order(column, options = {}) {
            this.orders.push({
                column,
                ascending: options.ascending !== false
            });
            return this;
        }

        range(from, to) {
            this.rangeBounds = [from, to];
            return this;
        }

        limit(count) {
            this.limitCount = count;
            return this;
        }

        single() {
            this.singleResult = true;
            return this;
        }

        maybeSingle() {
            this.maybeSingleResult = true;
            return this;
        }

        then(resolve, reject) {
            return Promise.resolve(this.result()).then(resolve, reject);
        }

        result() {
            if (this.operation === 'insert' || this.operation === 'upsert') {
                const inserted = this.rowsFromPayload();
                if (this.table === 'readings' && this.operation === 'insert') {
                    const existingIds = new Set(tableRows(this.table).map(row => row.id));
                    for (const row of inserted) {
                        if (existingIds.has(row.id)) {
                            return { data: null, error: { code: '23505', message: 'duplicate key value violates readings primary key' } };
                        }
                        existingIds.add(row.id);
                    }
                }
                tableRows(this.table).push(...inserted);
                return this.formatData(inserted);
            }

            if (this.operation === 'update') {
                const matching = this.filteredRows();
                for (const row of matching) Object.assign(row, this.payload || {});
                return this.formatData(matching);
            }

            if (this.operation === 'delete') {
                const rows = tableRows(this.table);
                const matching = new Set(this.filteredRows());
                tables.set(this.table, rows.filter(row => !matching.has(row)));
                return { data: [], error: null, count: 0 };
            }

            return this.formatData(this.filteredRows());
        }

        rowsFromPayload() {
            const payloadRows = Array.isArray(this.payload) ? this.payload : [this.payload];
            const highestMentorMessageId = this.table === 'mentor_messages'
                ? Math.max(0, ...tableRows(this.table).map(row => Number(row.id) || 0))
                : 0;
            return payloadRows.map((source, index) => ({
                id: source?.id || (this.table === 'mentor_messages'
                    ? highestMentorMessageId + index + 1
                    : `mock-${this.table}-${Date.now()}-${Math.random().toString(16).slice(2)}`),
                created_at: source?.created_at || now(),
                ...(source || {})
            }));
        }

        filteredRows() {
            // Mirror the read-only SQL view used by delivery tracking in tests.
            let rows = this.table === 'relationship_pending_email_alerts'
                ? tableRows('relationship_email_events').filter(event => event.alert_pending === true && event.alert_claim === 'idle')
                    .flatMap(event => tableRows('one_time_order_inputs')
                        .filter(order => order.product_type === 'relationship_tarot' && order.email_id === event.email_id)
                        .map(order => ({ ...event, order_id: order.id })))
                : [...tableRows(this.table)];

            for (const filter of this.filters) {
                rows = rows.filter(row => this.matchesFilter(row, filter));
            }

            if (this.orders.length > 0) {
                rows.sort((a, b) => {
                    for (const order of this.orders) {
                        const comparison = this.compareRows(a, b, order);
                        if (comparison !== 0) return comparison;
                    }
                    return 0;
                });
            }

            if (this.rangeBounds) {
                const [from, to] = this.rangeBounds;
                rows = rows.slice(from, to + 1);
            }

            if (typeof this.limitCount === 'number') {
                rows = rows.slice(0, this.limitCount);
            }

            return rows;
        }

        compareRows(a, b, order) {
            const left = a?.[order.column];
            const right = b?.[order.column];
            const direction = order.ascending ? 1 : -1;

            if (left == null && right == null) return 0;
            if (left == null) return 1;
            if (right == null) return -1;
            if (left < right) return -1 * direction;
            if (left > right) return 1 * direction;

            return 0;
        }

        matchesFilter(row, filter) {
            const [column, jsonKey] = String(filter.column).split('->>');
            const value = jsonKey ? row?.[column]?.[jsonKey] : row?.[column];

            if (filter.op === 'eq') return value === filter.value;
            if (filter.op === 'neq') return value !== filter.value;
            if (filter.op === 'is') return filter.value === null ? value === null || value === undefined : value === filter.value;
            if (filter.op === 'in') return Array.isArray(filter.value) && filter.value.includes(value);
            if (filter.op === 'gt') return value > filter.value;
            if (filter.op === 'gte') return value >= filter.value;
            if (filter.op === 'lt') return value < filter.value;
            if (filter.op === 'lte') return value <= filter.value;

            return true;
        }

        formatData(rows) {
            if (this.selectOptions?.head) {
                return { data: null, error: null, count: rows.length };
            }

            if (this.singleResult || this.maybeSingleResult) {
                if (rows.length === 0) {
                    return this.maybeSingleResult
                        ? { data: null, error: null }
                        : { data: null, error: { code: 'PGRST116', message: 'No rows found' } };
                }

                return { data: rows[0], error: null };
            }

            return { data: rows, error: null, count: rows.length };
        }
    }

    return {
        from(table) {
            return new MockQuery(table);
        },
        async rpc(name, args = {}) {
            if (name === 'reserve_user_daily_quota') {
                const { p_user_id: userId, p_date_key: usageDate, p_feature: feature, p_limit: limit } = args;
                const bucketKey = quotaBucketKey(userId, usageDate, feature);
                if (!dailyQuotaCounters.has(bucketKey)) {
                    dailyQuotaCounters.set(bucketKey, legacyQuotaUsage(userId, usageDate, feature));
                }

                const usedBefore = dailyQuotaCounters.get(bucketKey) || 0;
                if (!Number.isInteger(limit) || usedBefore >= limit) {
                    return {
                        data: [{ allowed: false, reservation_id: null, used: usedBefore, remaining: 0 }],
                        error: null
                    };
                }

                const reservationId = `mock-quota-${Date.now()}-${Math.random().toString(16).slice(2)}`;
                const used = usedBefore + 1;
                dailyQuotaCounters.set(bucketKey, used);
                dailyQuotaReservations.set(reservationId, { bucketKey });
                return {
                    data: [{ allowed: true, reservation_id: reservationId, used, remaining: Math.max(0, limit - used) }],
                    error: null
                };
            }

            if (name === 'commit_user_daily_quota' || name === 'release_user_daily_quota') {
                const reservation = dailyQuotaReservations.get(args.p_reservation_id);
                if (!reservation) return { data: false, error: null };
                dailyQuotaReservations.delete(args.p_reservation_id);
                if (name === 'release_user_daily_quota') {
                    dailyQuotaCounters.set(reservation.bucketKey, Math.max(0, (dailyQuotaCounters.get(reservation.bucketKey) || 0) - 1));
                }
                return { data: true, error: null };
            }

            return { data: null, error: null };
        },
        auth: {
            async signUp({ email, password, options = {} }) {
                const existing = [...users.values()].find(user => user.email.toLowerCase() === String(email).toLowerCase());
                if (existing) {
                    return { data: { user: null, session: null }, error: { message: 'User already registered', code: 'email_exists', status: 422 } };
                }
                const user = makeUser(email, options.data || {}, password);
                return { data: { user, session: null }, error: null };
            },
            async signInWithPassword({ email, password }) {
                if (!email || !password || password === 'wrong-password') {
                    return { data: null, error: { message: 'Invalid login credentials', status: 400 } };
                }
                const user = [...users.values()].find(existing => existing.email.toLowerCase() === String(email).toLowerCase()) || makeUser(email, {}, password);
                if (user.__mockPassword && user.__mockPassword !== password) {
                    return { data: null, error: { message: 'Invalid login credentials', status: 400 } };
                }
                return { data: { user, session: { access_token: 'mock-access-token' } }, error: null };
            },
            async resetPasswordForEmail() {
                return { data: {}, error: null };
            },
            async getUser(token) {
                if (!['mock-access-token', 'test-reset-token'].includes(token)) {
                    return { data: { user: null }, error: { message: 'Invalid token', status: 401 } };
                }
                return { data: { user: { id: 'test-user', email: 'test@example.com' } }, error: null };
            },
            async updateUser() {
                return { data: { user: null }, error: { message: 'Auth session missing', status: 401 } };
            },
            admin: {
                async createUser({ email, password, user_metadata = {}, email_confirm = false }) {
                    const existing = [...users.values()].find(user => user.email.toLowerCase() === String(email).toLowerCase());
                    if (existing) {
                        return { data: { user: null }, error: { message: 'User already registered', code: 'email_exists', status: 422 } };
                    }
                    const user = makeUser(email, user_metadata, password);
                    if (email_confirm) {
                        const confirmedAt = now();
                        user.email_confirmed_at = confirmedAt;
                        user.confirmed_at = confirmedAt;
                    }
                    return { data: { user }, error: null };
                },
                async getUserById(id) {
                    return { data: { user: users.get(id) || { id, email: 'test@example.com' } }, error: null };
                },
                async updateUserById(id, payload) {
                    return { data: { user: { id, ...payload } }, error: null };
                }
            }
        }
    };
}

if (!USE_MOCK_SUPABASE && (!projectUrl || !serviceKey)) {
    if (isProductionRuntime()) {
        throw new Error('Supabase credentials missing in production (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Refusing to start degraded.');
    }
    console.warn('WARNING: Supabase credentials missing in .env (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)');
} else if (!USE_MOCK_SUPABASE) {
    console.log('Supabase initialized.');
}

export const supabase = USE_MOCK_SUPABASE
    ? createMockSupabaseClient()
    : createClient(projectUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
