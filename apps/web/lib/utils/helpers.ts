// ─── ORDER NUMBER GENERATOR ──────────────────────────────────
export function generateOrderNumber(sequence: number): string {
  return `GRG-${String(sequence).padStart(4, '0')}`;
}

// ─── INVOICE NUMBER GENERATOR ────────────────────────────────
export function generateInvoiceNumber(sequence: number): string {
  return `INV-GRG-${String(sequence).padStart(4, '0')}`;
}

// ─── PHONE NUMBER NORMALIZATION ──────────────────────────────
export function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  // Ensure + prefix for international numbers
  if (!cleaned.startsWith('+')) {
    // If it starts with a country code digit and is long enough, add +
    if (cleaned.length > 10) {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// ─── SLUG GENERATOR ─────────────────────────────────────────
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── PAGINATION HELPER ──────────────────────────────────────
export function parsePagination(query: { page?: string; limit?: string }) {
  const page = Math.max(1, parseInt(query.page || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20')));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

// ─── SEARCH HELPERS ─────────────────────────────────────────
export function buildSearchFilter(search: string | undefined, fields: string[]) {
  if (!search) return {};
  return {
    OR: fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    })),
  };
}
