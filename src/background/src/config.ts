export function isBlocklistDisabled(): boolean {
    // @ts-ignore
    return import.meta.env.VITE_NO_BLOCKLIST === 'true';
}
