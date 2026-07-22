const isDev = typeof process === 'undefined' || process.env?.NODE_ENV !== 'production';

/** Logs in non-production builds only; no-op otherwise. */
export const log = (...args: unknown[]): void => {
  if (isDev) console.log('[RectPack]', ...args);
};
