export type Finding = {
  kind: "phone" | "money" | "time";
  value: string;
};

// --- Helpers ---
function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function extractAndNormalizeMoney(text: string): Set<string> {
  const moneyRegex = /(?:£[\d,]+|[\d,]+\s*pounds?|\d+p)/gi;
  const matches = text.match(moneyRegex) || [];
  const normalized = new Set<string>();
  
  for (const match of matches) {
    const lower = match.toLowerCase();
    const digits = lower.replace(/[^\d]/g, "");
    if (lower.includes("p") && !lower.includes("pound")) {
      normalized.add(`${digits}pence`);
    } else {
      normalized.add(`${digits}gbp`);
    }
  }
  return normalized;
}

function normalizeTime(time: string): string {
  // Removes spaces and pads "9:30" to "09:30"
  let clean = time.toLowerCase().replace(/\s+/g, "");
  if (clean.length === 4 && clean.includes(":")) {
     clean = "0" + clean; 
  }
  return clean;
}

function extractTimes(text: string): string[] {
  const timeRegex = /\b\d{1,2}:\d{2}(?:am|pm)?\b/gi;
  return text.match(timeRegex) || [];
}

// --- Main Checker ---
export function findUngrounded(reply: string, facts: string): Finding[] {
  const ungrounded: Finding[] = [];
  
  // 1. Phones
  const phoneRegex = /\b0\d{3}[\s]?\d{3}[\s]?\d{4}\b/g;
  const phonesInReply = reply.match(phoneRegex) || [];
  const normalizedFactsPhone = normalizePhone(facts);

  for (const phone of phonesInReply) {
    if (!normalizedFactsPhone.includes(normalizePhone(phone))) {
      ungrounded.push({ kind: "phone", value: phone });
    }
  }

  // 2. Money
  const factsMoney = extractAndNormalizeMoney(facts);
  const moneyRegex = /(?:£[\d,]+|[\d,]+\s*pounds?|\d+p)/gi;
  const replyMoney = reply.match(moneyRegex) || [];
  
  for (const money of replyMoney) {
    const norm = Array.from(extractAndNormalizeMoney(money))[0]; 
    if (!factsMoney.has(norm)) {
      ungrounded.push({ kind: "money", value: money });
    }
  }

  // 3. Times
  const factsTimes = new Set(extractTimes(facts).map(normalizeTime));
  const replyTimes = extractTimes(reply);

  for (const time of replyTimes) {
    if (!factsTimes.has(normalizeTime(time))) {
      ungrounded.push({ kind: "time", value: time });
    }
  }

  return ungrounded;
}
