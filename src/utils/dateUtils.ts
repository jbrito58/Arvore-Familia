/**
 * Utilitários robustos de formatação e parsing de datas genealógicas
 * Suporta formatos brasileiros (DD/MM/YYYY), ISO (YYYY-MM-DD) e anos isolados (YYYY).
 */

export interface ParsedDateInfo {
  year: number | null;
  month: number | null; // 1 a 12
  day: number | null;   // 1 a 31
  formattedBr: string;  // Ex: "13/03/1915" ou "1915"
  yearStr: string;      // Ex: "1915"
  isValid: boolean;
}

export function parseDateComponents(dateStr?: string | null): ParsedDateInfo {
  if (!dateStr || !dateStr.trim()) {
    return { year: null, month: null, day: null, formattedBr: '', yearStr: '', isValid: false };
  }

  const clean = dateStr.trim();

  // Caso 1: Formato Brasileiro DD/MM/YYYY ou DD-MM-YYYY
  const brMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (brMatch) {
    const day = parseInt(brMatch[1], 10);
    const month = parseInt(brMatch[2], 10);
    const year = parseInt(brMatch[3], 10);
    const formattedBr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    return {
      year,
      month,
      day,
      formattedBr,
      yearStr: year.toString(),
      isValid: month >= 1 && month <= 12 && day >= 1 && day <= 31,
    };
  }

  // Caso 2: Formato ISO YYYY-MM-DD ou YYYY/MM/DD
  const isoMatch = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    const formattedBr = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    return {
      year,
      month,
      day,
      formattedBr,
      yearStr: year.toString(),
      isValid: month >= 1 && month <= 12 && day >= 1 && day <= 31,
    };
  }

  // Caso 3: Apenas Ano (4 dígitos, ex: 1915 ou 2004)
  const yearMatch = clean.match(/\b(16|17|18|19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0], 10);
    return {
      year,
      month: null,
      day: null,
      formattedBr: year.toString(),
      yearStr: year.toString(),
      isValid: true,
    };
  }

  return {
    year: null,
    month: null,
    day: null,
    formattedBr: clean,
    yearStr: clean.substring(0, 4),
    isValid: false,
  };
}

/**
 * Retorna o período de vida formatado (ex: "1915 — Presente" ou "1898 — 1974")
 */
export function formatLifespan(
  birthDate?: string | null,
  deathDate?: string | null,
  isLiving = true
): string {
  const b = parseDateComponents(birthDate);
  const d = parseDateComponents(deathDate);

  const bYear = b.yearStr || (birthDate ? birthDate : '');

  if (isLiving) {
    return bYear ? `${bYear} — Presente` : 'Presente';
  }

  const dYear = d.yearStr || (deathDate ? deathDate : '?');
  return bYear ? `${bYear} — ${dYear}` : `? — ${dYear}`;
}

/**
 * Calcula dados de aniversário próximo para uma pessoa viva
 */
export interface UpcomingBirthdayResult {
  turningAge: number;
  diffDays: number;
  formattedDate: string; // Ex: "13/03"
  isToday: boolean;
}

export function calculateUpcomingBirthday(
  birthDate?: string | null,
  isLiving = true
): UpcomingBirthdayResult | null {
  if (!isLiving || !birthDate) return null;

  const parsed = parseDateComponents(birthDate);
  if (!parsed.isValid || parsed.month === null || parsed.day === null || parsed.year === null) {
    return null;
  }

  const today = new Date();
  const currentYear = today.getFullYear();

  // Próximo aniversário
  let targetYear = currentYear;
  const currentBirthdayDate = new Date(currentYear, parsed.month - 1, parsed.day);
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  if (currentBirthdayDate.getTime() < startOfToday.getTime()) {
    targetYear = currentYear + 1;
  }

  const nextBirthdayDate = new Date(targetYear, parsed.month - 1, parsed.day);
  const diffMs = nextBirthdayDate.getTime() - startOfToday.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const turningAge = targetYear - parsed.year;

  return {
    turningAge,
    diffDays,
    formattedDate: `${parsed.day.toString().padStart(2, '0')}/${parsed.month.toString().padStart(2, '0')}`,
    isToday: diffDays === 0,
  };
}
