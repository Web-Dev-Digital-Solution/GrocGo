// ─────────────────────────────────────────────────────────────
// MULTILINGUAL GROCERY LIST PARSER v2
// Supports: Bengali (বাংলা), Hindi (हिन्दी), English
// Features:
//   1. Language auto-detection
//   2. Numeral conversion (Bengali/Hindi → English)
//   3. Unit translation and conversion
//   4. Product name translation
//   5. Smart quantity extraction with context
//   6. Unit-aware price calculation
// ─────────────────────────────────────────────────────────────

// ─── BENGALI → ENGLISH PRODUCT MAPPING ───────────────────────
const BENGALI_PRODUCTS: Record<string, { english: string; unit: string }> = {
  'মরিচ গুড়া': { english: 'Red Chili Powder', unit: 'g' },
  'লাল মরিচ গুড়া': { english: 'Red Chili Powder', unit: 'g' },
  'কাঁচা মরিচ': { english: 'Green Chili', unit: 'piece' },
  'হলুদ গুড়া': { english: 'Turmeric Powder', unit: 'g' },
  'হলুদ': { english: 'Turmeric Powder', unit: 'g' },
  'গরম মসলা': { english: 'Garam Masala', unit: 'g' },
  'ধনিয়া গুড়া': { english: 'Coriander Powder', unit: 'g' },
  'জিরা': { english: 'Cumin Seeds', unit: 'g' },
  'জিরা গুড়া': { english: 'Cumin Powder', unit: 'g' },
  'মেথি': { english: 'Fenugreek Seeds', unit: 'g' },
  'রাই': { english: 'Mustard Seeds', unit: 'g' },
  'তেল': { english: 'Cooking Oil', unit: 'litre' },
  'সরিষের তেল': { english: 'Mustard Oil', unit: 'litre' },
  'সাদা তেল': { english: 'Refined Oil', unit: 'litre' },
  'রিফাইন্ড': { english: 'Refined Oil', unit: 'litre' },
  'রিফাইন্ড তেল': { english: 'Refined Oil', unit: 'litre' },
  'রিফাইন': { english: 'Refined Oil', unit: 'litre' },
  'নারকেল তেল': { english: 'Coconut Oil', unit: 'litre' },
  'চাল': { english: 'Rice', unit: 'kg' },
  'বাসমতী চাল': { english: 'Basmati Rice', unit: 'kg' },
  'চিনি': { english: 'Sugar', unit: 'kg' },
  'আটা': { english: 'Wheat Atta', unit: 'kg' },
  'গমের আটা': { english: 'Wheat Atta', unit: 'kg' },
  'ময়দা': { english: 'Maida', unit: 'kg' },
  'সুজি': { english: 'Sooji', unit: 'kg' },
  'পেঁয়াজ': { english: 'Onion', unit: 'kg' },
  'আলু': { english: 'Potato', unit: 'kg' },
  'রসুন': { english: 'Garlic', unit: 'g' },
  'আদা': { english: 'Ginger', unit: 'g' },
  'টমেটো': { english: 'Tomato', unit: 'kg' },
  'মসুর ডাল': { english: 'Toor Dal', unit: 'kg' },
  'তুর ডাল': { english: 'Toor Dal', unit: 'kg' },
  'মসুরি ডাল': { english: 'Masoor Dal', unit: 'kg' },
  'মুসুরি ডাল': { english: 'Masoor Dal', unit: 'kg' },
  'মুগ ডাল': { english: 'Moong Dal', unit: 'kg' },
  'ছোলা': { english: 'Chana Dal', unit: 'kg' },
  'ছোলার ডাল': { english: 'Chana Dal', unit: 'kg' },
  'হরল ডাল': { english: 'Toor Dal', unit: 'kg' },
  'কালি ডাল': { english: 'Urad Dal', unit: 'kg' },
  'রাজমা': { english: 'Rajma', unit: 'kg' },
  'কাবলি ছোলা': { english: 'Kabuli Chana', unit: 'kg' },
  'পনির': { english: 'Paneer', unit: 'piece' },
  'দই': { english: 'Curd', unit: 'piece' },
  'ঘি': { english: 'Ghee', unit: 'piece' },
  'মাখন': { english: 'Butter', unit: 'piece' },
  'দুধ': { english: 'Milk', unit: 'litre' },
  'আমুল দুধ': { english: 'Amul Milk', unit: 'litre' },
  'ব্রেড': { english: 'Bread', unit: 'piece' },
  'চা পাতা': { english: 'Tea Leaves', unit: 'g' },
  'টাটা চা': { english: 'Tata Tea', unit: 'packet' },
  'টাটা চা গোল্ড': { english: 'Tata Tea Gold', unit: 'packet' },
  'নেসক্যাফে': { english: 'Nescafe Classic', unit: 'packet' },
  'নেসক্যাফে ক্লাসিক': { english: 'Nescafe Classic', unit: 'packet' },
  'ম্যাগি': { english: 'Maggi Noodles', unit: 'packet' },
  'ম্যাগি নুডলস': { english: 'Maggi Noodles', unit: 'packet' },
  'পারলে-জি': { english: 'Parle-G Biscuits', unit: 'packet' },
  'পারলেজি': { english: 'Parle-G Biscuits', unit: 'packet' },
  'লেস চিপস': { english: "Lay's Chips", unit: 'packet' },
  'কলগেট': { english: 'Colgate Toothpaste', unit: 'packet' },
  'লাইবয়': { english: 'Lifebuoy Soap', unit: 'piece' },
  'সাবান': { english: 'Soap', unit: 'piece' },
  'সারফ': { english: 'Surf Excel', unit: 'packet' },
  'সারফ বালতি': { english: 'Surf Excel', unit: 'packet' },
  'ফেমাস সাবান': { english: 'Fem Soap', unit: 'piece' },
  'ফেমাস': { english: 'Fem Soap', unit: 'piece' },
  'ভিম': { english: 'Vim Dishwash Liquid', unit: 'bottle' },
  'হারপিক': { english: 'Harpic Power Plus', unit: 'bottle' },
  'নুন': { english: 'Salt', unit: 'kg' },
  'লবণ': { english: 'Salt', unit: 'kg' },
  'লেবু': { english: 'Lemon', unit: 'piece' },
};

// ─── HINDI → ENGLISH PRODUCT MAPPING ─────────────────────────
const HINDI_PRODUCTS: Record<string, { english: string; unit: string }> = {
  'लाल मिर्च पाउडर': { english: 'Red Chili Powder', unit: 'g' },
  'हरी मिर्च': { english: 'Green Chili', unit: 'piece' },
  'मिर्च पाउडर': { english: 'Red Chili Powder', unit: 'g' },
  'हल्दी': { english: 'Turmeric Powder', unit: 'g' },
  'गरम मसाला': { english: 'Garam Masala', unit: 'g' },
  'धनिया पाउडर': { english: 'Coriander Powder', unit: 'g' },
  'जीरा': { english: 'Cumin Seeds', unit: 'g' },
  'तेल': { english: 'Cooking Oil', unit: 'litre' },
  'सरसों का तेल': { english: 'Mustard Oil', unit: 'litre' },
  'रिफाइंड': { english: 'Refined Oil', unit: 'litre' },
  'चावल': { english: 'Rice', unit: 'kg' },
  'बासमती चावल': { english: 'Basmati Rice', unit: 'kg' },
  'चीनी': { english: 'Sugar', unit: 'kg' },
  'आटा': { english: 'Wheat Atta', unit: 'kg' },
  'मैदा': { english: 'Maida', unit: 'kg' },
  'प्याज': { english: 'Onion', unit: 'kg' },
  'आलू': { english: 'Potato', unit: 'kg' },
  'लहसुन': { english: 'Garlic', unit: 'g' },
  'अदरक': { english: 'Ginger', unit: 'g' },
  'टमाटर': { english: 'Tomato', unit: 'kg' },
  'तूर दाल': { english: 'Toor Dal', unit: 'kg' },
  'मसूर दाल': { english: 'Masoor Dal', unit: 'kg' },
  'मूंग दाल': { english: 'Moong Dal', unit: 'kg' },
  'पनीर': { english: 'Paneer', unit: 'piece' },
  'दही': { english: 'Curd', unit: 'piece' },
  'घी': { english: 'Ghee', unit: 'piece' },
  'मक्खन': { english: 'Butter', unit: 'piece' },
  'दूध': { english: 'Milk', unit: 'litre' },
  'ब्रेड': { english: 'Bread', unit: 'piece' },
  'चाय पत्ती': { english: 'Tea Leaves', unit: 'g' },
  'मैगी': { english: 'Maggi Noodles', unit: 'packet' },
  'नमक': { english: 'Salt', unit: 'kg' },
  'नींबू': { english: 'Lemon', unit: 'piece' },
  'साबुन': { english: 'Soap', unit: 'piece' },
};

// ─── NUMERAL MAPS ────────────────────────────────────────────
const BENGALI_NUMS: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
};
const HINDI_NUMS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// ─── UNIT MAPS ───────────────────────────────────────────────
const BENGALI_UNITS: Record<string, string> = {
  'গ্রাম': 'g', 'গ্রামি': 'g', 'গ্রাম্য': 'g',
  'কেজি': 'kg', 'কেজিই': 'kg', 'কিলো': 'kg', 'কিলোগ্রাম': 'kg',
  'লিটার': 'litre', 'লিট': 'litre', 'লিটারে': 'litre',
  'মিলি': 'ml', 'মিলিলিটার': 'ml',
  'পিস': 'piece', 'পিসে': 'piece', 'টা': 'piece', 'টাই': 'piece',
  'প্যাকেট': 'packet', 'প্যাক': 'packet', 'শিট': 'piece',
  'বোতল': 'bottle', 'ডজন': 'dozen', 'বাক্স': 'box',
};
const HINDI_UNITS: Record<string, string> = {
  'ग्राम': 'g', 'किलो': 'kg', 'किलोग्राम': 'kg',
  'लीटर': 'litre', 'लिटर': 'litre', 'मिली': 'ml',
  'पीस': 'piece', 'नग': 'piece', 'पैकेट': 'packet', 'बोतल': 'bottle',
};

// ─── CONVERSION FACTORS (to base unit: g, ml, piece) ──────────
const UNIT_FACTORS: Record<string, number> = {
  'kg': 1000, 'g': 1, 'mg': 0.001,
  'litre': 1000, 'l': 1000, 'ml': 1,
  'piece': 1, 'pc': 1, 'packet': 1, 'pkt': 1,
  'dozen': 12, 'bottle': 1, 'box': 1,
};

// ─── LANGUAGE DETECTION ──────────────────────────────────────
function detectLanguage(text: string): 'bengali' | 'hindi' | 'english' | 'mixed' {
  let bn = 0, hi = 0, en = 0;
  for (const ch of text) {
    const c = ch.charCodeAt(0);
    if (c >= 0x0980 && c <= 0x09FF) bn++;
    else if (c >= 0x0900 && c <= 0x097F) hi++;
    else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) en++;
  }
  const total = bn + hi + en;
  if (total === 0) return 'english';
  if (bn / total > 0.3) return 'bengali';
  if (hi / total > 0.3) return 'hindi';
  if (en / total > 0.5) return 'english';
  return 'mixed';
}

// ─── CONVERT NUMERALS ────────────────────────────────────────
function convertNumerals(text: string): string {
  let r = text;
  for (const [bn, en] of Object.entries(BENGALI_NUMS)) r = r.split(bn).join(en);
  for (const [hi, en] of Object.entries(HINDI_NUMS)) r = r.split(hi).join(en);
  return r;
}

// ─── TRANSLATE PRODUCT NAME ──────────────────────────────────
function translateProduct(name: string, lang: string): { english: string; unit: string } | null {
  const lower = name.toLowerCase().trim();
  const maps = lang === 'bengali' || lang === 'mixed' ? [BENGALI_PRODUCTS] :
               lang === 'hindi' ? [HINDI_PRODUCTS] : [];
  if (lang === 'mixed') maps.push(HINDI_PRODUCTS);

  for (const map of maps) {
    if (map[lower]) return map[lower];
    for (const [key, val] of Object.entries(map)) {
      if (lower.includes(key) || key.includes(lower)) return val;
    }
  }
  return null;
}

// ─── EXTRACT UNIT FROM TEXT ───────────────────────────────────
function extractUnitFromText(text: string, lang: string): string | null {
  const lower = text.toLowerCase().trim();
  // English units
  const enUnits: Record<string, string> = {
    'kg': 'kg', 'g': 'g', 'ltr': 'litre', 'litre': 'litre', 'l': 'litre',
    'ml': 'ml', 'piece': 'piece', 'pc': 'piece', 'packet': 'packet',
    'pkt': 'packet', 'dozen': 'dozen', 'bottle': 'bottle', 'box': 'box',
  };
  for (const [k, v] of Object.entries(enUnits)) {
    if (lower === k || lower.endsWith(k) || lower.endsWith(k + 's')) return v;
  }
  // Bengali units
  if (lang === 'bengali' || lang === 'mixed') {
    for (const [bn, en] of Object.entries(BENGALI_UNITS)) {
      if (lower.includes(bn)) return en;
    }
  }
  // Hindi units
  if (lang === 'hindi' || lang === 'mixed') {
    for (const [hi, en] of Object.entries(HINDI_UNITS)) {
      if (lower.includes(hi)) return en;
    }
  }
  return null;
}

// ─── SMART QUANTITY EXTRACTION ────────────────────────────────
// Returns the raw quantity and unit from text BEFORE product matching
function extractQuantityFromText(text: string, lang: string): { quantity: number; unit: string } {
  const converted = convertNumerals(text);
  const lower = converted.toLowerCase().trim();

  // Priority 1: number + Bengali/Hindi/English unit (tightly coupled)
  // "200গ্রাম", "3কেজি", "2kg", "1টা", "500 গ্রামি", "2 লিটার"
  const unitPattern = lower.match(
    /(\d+\.?\d*)\s*(গ্রাম|গ্রামি|কেজি|কিলো|লিটার|লিট|মিলি|টা|পিস|প্যাকেট|বোতল|শিট|kg|g|ltr|litre|l|ml|piece|pc|packet|pkt|dozen|dz|bottle|btl|box)/
  );
  if (unitPattern) {
    const qty = parseFloat(unitPattern[1]);
    const unit = extractUnitFromText(unitPattern[2], lang) || 'piece';
    return { quantity: qty, unit };
  }

  // Priority 2: "= number" pattern (equals sign followed by number)
  // "=200", "= 3", "=২০০"
  const eqPattern = lower.match(/[=＝]\s*(\d+\.?\d*)/);
  if (eqPattern) {
    return { quantity: parseFloat(eqPattern[1]), unit: 'piece' };
  }

  // Priority 3: standalone number (last resort)
  const numOnly = lower.match(/(\d+\.?\d+)/);
  if (numOnly) {
    return { quantity: parseFloat(numOnly[1]), unit: 'piece' };
  }

  return { quantity: 1, unit: 'piece' };
}

// ─── UNIT CONVERSION ──────────────────────────────────────────
// Convert quantity from one unit to another
// e.g., 200g → 0.2kg, 1500ml → 1.5litre
function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return quantity;

  // Normalize to base units
  const fromFactor = UNIT_FACTORS[fromUnit] || 1;
  const toFactor = UNIT_FACTORS[toUnit] || 1;

  // Same base (weight, volume, or count)
  const fromBase = quantity * fromFactor;
  const toQty = fromBase / toFactor;

  // Round to 2 decimal places
  return Math.round(toQty * 100) / 100;
}

// ─── CLEAN ITEM NAME ─────────────────────────────────────────
function cleanItemName(text: string): string {
  return text
    .replace(/^[-•*]\s*/, '')
    .replace(/^\d+[.)]\s*/, '')
    .replace(/^[০-৯०-९]+\s*[.)]\s*/, '')
    .replace(/\s*[-–—=＝]\s*\d+.*$/, '')
    .replace(/\s*\d+\s*(kg|g|ltr|litre|l|ml|piece|pc|packet|pkt|dozen|dz|bottle|btl|box|গ্রাম|গ্রামি|কেজি|কিলো|লিটার|লিট|মিলি|টা|পিস|প্যাকেট|বোতল|শিট)\s*$/i, '')
    .trim();
}

// ─── FUZZY MATCH ─────────────────────────────────────────────
function fuzzyMatch(
  itemName: string,
  products: Array<{ id: string; name: string; price: number; unit: string; searchAliases: string | null }>
): { product: typeof products[0]; score: number } | null {
  const itemLower = itemName.toLowerCase().trim();
  let best: typeof products[0] | null = null;
  let bestScore = 0;

  for (const p of products) {
    const nameLower = p.name.toLowerCase();
    let score = 0;

    if (nameLower === itemLower) score = 100;
    else if (nameLower.includes(itemLower)) score = 80;
    else if (itemLower.includes(nameLower)) score = 70;
    else if (p.searchAliases) {
      const aliases = p.searchAliases.toLowerCase().split(',').map(a => a.trim());
      for (const alias of aliases) {
        if (alias === itemLower) { score = 90; break; }
        if (alias.includes(itemLower) || itemLower.includes(alias)) { score = 60; break; }
      }
    }

    if (score === 0) {
      const iw = itemLower.split(/\s+/);
      const nw = nameLower.split(/\s+/);
      const match = iw.filter(w => nw.some(n => n.includes(w) || w.includes(n)));
      if (match.length > 0) score = (match.length / Math.max(iw.length, nw.length)) * 50;
    }

    if (score > bestScore) { bestScore = score; best = p; }
  }

  return bestScore >= 40 && best ? { product: best, score: bestScore } : null;
}

// ─── MAIN PARSE FUNCTION ─────────────────────────────────────
export interface ParsedItem {
  productName: string;
  productId: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  matched: boolean;
  originalText: string;
  detectedLanguage: string;
}

export function parseMultilingualList(
  text: string,
  products: Array<{ id: string; name: string; price: number; unit: string; searchAliases: string | null }>
): ParsedItem[] {
  const lang = detectLanguage(text);
  const lines = text.split('\n').filter((l: string) => l.trim());
  const results: ParsedItem[] = [];

  for (const line of lines) {
    const originalText = line.trim();
    if (!originalText) continue;

    // Step 1: Convert numerals
    const converted = convertNumerals(originalText);

    // Step 2: Clean item name
    let cleaned = cleanItemName(converted);
    if (!cleaned) continue;

    // Step 3: Translate to English
    const translation = translateProduct(cleaned, lang);
    const englishName = translation?.english || cleaned;

    // Step 4: Match with store products
    let match = fuzzyMatch(englishName, products);
    if (!match) match = fuzzyMatch(cleaned, products);

    if (match) {
      // Step 5a: MATCHED — extract quantity and convert to product's unit
      const extracted = extractQuantityFromText(converted, lang);
      const productUnit = match.product.unit;

      // Convert extracted quantity to the product's unit if different
      let finalQuantity = extracted.quantity;
      if (extracted.unit !== productUnit) {
        finalQuantity = convertQuantity(extracted.quantity, extracted.unit, productUnit);
      }

      // Sanity check: if quantity seems too large for the unit, default to 1
      // e.g., if someone typed "200g" and product is "per kg", 200kg is unreasonable
      // but 0.2kg is fine. However if extracted unit was "piece" and product is "kg",
      // the user probably meant 1 piece.
      if (extracted.unit === 'piece' && (productUnit === 'kg' || productUnit === 'litre')) {
        // User typed "2 টা" for a kg product → they mean 2 × the package size
        // Keep as-is (e.g., 2 packets)
        finalQuantity = extracted.quantity;
      }

      results.push({
        productName: match.product.name,
        productId: match.product.id,
        quantity: finalQuantity,
        unit: productUnit,
        unitPrice: match.product.price,
        matched: true,
        originalText,
        detectedLanguage: lang,
      });
    } else {
      // Step 5b: NOT MATCHED — use extracted quantity as-is
      const extracted = extractQuantityFromText(converted, lang);
      const detectedUnit = translation?.unit || extracted.unit;

      results.push({
        productName: englishName,
        productId: null,
        quantity: extracted.quantity,
        unit: detectedUnit,
        unitPrice: 0,
        matched: false,
        originalText,
        detectedLanguage: lang,
      });
    }
  }

  return results;
}
