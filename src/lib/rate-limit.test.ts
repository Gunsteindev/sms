import { describe, it, expect } from 'vitest';
import { checkRateLimit, resetRateLimit } from './rate-limit';

describe('checkRateLimit', () => {
    it('allows up to max hits within the window, then limits', () => {
        const key = 'test:allow-then-limit';
        const opts = { max: 3, windowMs: 1000 };
        expect(checkRateLimit(key, opts, 0).limited).toBe(false); // 1
        expect(checkRateLimit(key, opts, 0).limited).toBe(false); // 2
        expect(checkRateLimit(key, opts, 0).limited).toBe(false); // 3
        const fourth = checkRateLimit(key, opts, 0);
        expect(fourth.limited).toBe(true);                        // 4 → blocked
        expect(fourth.retryAfterSec).toBeGreaterThan(0);
    });

    it('resets after the window elapses', () => {
        const key = 'test:window-reset';
        const opts = { max: 1, windowMs: 1000 };
        expect(checkRateLimit(key, opts, 0).limited).toBe(false);
        expect(checkRateLimit(key, opts, 0).limited).toBe(true);     // within window
        expect(checkRateLimit(key, opts, 1000).limited).toBe(false); // new window
    });

    it('resetRateLimit clears the counter (e.g. after a successful login)', () => {
        const key = 'test:manual-reset';
        const opts = { max: 1, windowMs: 1000 };
        expect(checkRateLimit(key, opts, 0).limited).toBe(false);
        expect(checkRateLimit(key, opts, 0).limited).toBe(true);
        resetRateLimit(key);
        expect(checkRateLimit(key, opts, 0).limited).toBe(false);
    });

    it('tracks keys independently', () => {
        const opts = { max: 1, windowMs: 1000 };
        expect(checkRateLimit('test:key-a', opts, 0).limited).toBe(false);
        expect(checkRateLimit('test:key-b', opts, 0).limited).toBe(false);
    });
});
