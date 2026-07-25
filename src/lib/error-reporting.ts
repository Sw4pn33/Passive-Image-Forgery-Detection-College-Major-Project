export function reportError(error: unknown, _context: Record<string, unknown> = {}) {
  if (error instanceof Error) {
    console.error(error.message, error.stack);
  } else {
    console.error(String(error));
  }
}
