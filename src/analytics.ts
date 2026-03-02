const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';

export function track(event: string, props?: Record<string, unknown>): void {
  if (isDev) {
    console.debug('[analytics]', event, props);
  }
}
