import { describe, it, expect, vi, afterEach } from 'vitest';
import { isBlocked } from '../src/blocklist';
import * as configModule from '../src/config';

describe('Blocklist Conditional', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should block when blocklist is NOT disabled', () => {
        vi.spyOn(configModule, 'isBlocklistDisabled').mockReturnValue(false);
        expect(isBlocked('https://tiktok.com')).toBe(true);
    });

    it('should NOT block when blocklist IS disabled', () => {
        vi.spyOn(configModule, 'isBlocklistDisabled').mockReturnValue(true);
        expect(isBlocked('https://tiktok.com')).toBe(false);
    });
});
