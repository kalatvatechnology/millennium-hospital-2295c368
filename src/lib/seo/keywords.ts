import type {
  SeoEntity,
  SeoKeywordCategory,
  SeoKeywordDraft,
  SeoKeywordUsageDraft,
} from "./types";

const STOP_WORDS = new Set(
  `a about above after again against all am an and any are as at be because been before being below
   between both but by can cannot could did do does doing down during each few for from further had
   has have having he her here hers him his how i if in into is it its itself just me more most my no
   nor not of off on once only or other our ours out over own same she should so some such than that
   the their theirs them then there these they this those through to too under until up very was we
   were what when where which while who whom why will with you your yours also may many us get one two
   please our new`
    .split(/\s+/)
    .filter(Boolean),
);

const MAX_PHRASE_WORDS = 4;
const MIN_OCCURRENCES = 2;
const MAX_KEYWORDS = 400;

export function normalizeKeyword(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function stripHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function tokenizeSentences(value: string): string[][] {
  return stripHtml(value)
    .toLowerCase()
    .split(/[.!?;:\n\r|/()[\]{}"'`]+|,/)
    .map((sentence) =>
      sentence
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/\s+/)
        .filter(Boolean),
    )
    .filter((tokens) => tokens.length > 0);
}

function phrasesFromTokens(tokens: string[]): string[] {
  const phrases: string[] = [];
  for (let size = 1; size <= MAX_PHRASE_WORDS; size += 1) {
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const window = tokens.slice(start, start + size);
      const first = window[0];
      const last = window[window.length - 1];
      if (!first || !last) continue;
      if (STOP_WORDS.has(first) || STOP_WORDS.has(last)) continue;
      if (window.every((token) => STOP_WORDS.has(token))) continue;
      if (size === 1 && (first.length < 4 || /^\d+$/.test(first))) continue;
      phrases.push(window.join(" "));
    }
  }
  return phrases;
}

function categoryForEntity(type: SeoEntity["type"]): SeoKeywordCategory {
  switch (type) {
    case "doctor":
      return "doctor";
    case "department":
      return "department";
    case "professional_service":
    case "hospital_service":
      return "service";
    case "location":
      return "location";
    case "blog_post":
      return "blog";
    default:
      return "general";
  }
}

export type KeywordScanOptions = {
  /** Place names taken from the CMS location records, used to detect local keywords. */
  localTerms?: string[];
  /** Hospital/brand names taken from CMS settings, used to detect brand keywords. */
  brandTerms?: string[];
};

/**
 * Builds website keyword counts from real CMS content. Nothing is invented:
 * every count comes from an occurrence in a scanned field.
 */
export function extractWebsiteKeywords(
  entities: SeoEntity[],
  options: KeywordScanOptions = {},
): SeoKeywordDraft[] {
  const localTerms = (options.localTerms ?? []).map(normalizeKeyword).filter(Boolean);
  const brandTerms = (options.brandTerms ?? []).map(normalizeKeyword).filter(Boolean);

  type Aggregate = {
    keyword: string;
    wordCount: number;
    total: number;
    categories: Map<SeoKeywordCategory, number>;
    usages: Map<string, SeoKeywordUsageDraft>;
    entities: Set<string>;
  };
  const aggregates = new Map<string, Aggregate>();

  for (const entity of entities) {
    const entityCategory = categoryForEntity(entity.type);
    for (const field of entity.fields) {
      if (!field.value.trim()) continue;
      const counts = new Map<string, number>();
      for (const tokens of tokenizeSentences(field.value)) {
        for (const phrase of phrasesFromTokens(tokens)) {
          counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
        }
      }
      for (const [phrase, count] of counts) {
        let aggregate = aggregates.get(phrase);
        if (!aggregate) {
          aggregate = {
            keyword: phrase,
            wordCount: phrase.split(" ").length,
            total: 0,
            categories: new Map(),
            usages: new Map(),
            entities: new Set(),
          };
          aggregates.set(phrase, aggregate);
        }
        aggregate.total += count;
        aggregate.categories.set(
          entityCategory,
          (aggregate.categories.get(entityCategory) ?? 0) + count,
        );
        aggregate.entities.add(`${entity.type}:${entity.id}`);
        const usageKey = `${entity.type}:${entity.id}:${field.field}`;
        const usage = aggregate.usages.get(usageKey);
        if (usage) usage.occurrences += count;
        else
          aggregate.usages.set(usageKey, {
            entityType: entity.type,
            entityId: entity.id,
            entityLabel: entity.label,
            entityPath: entity.path,
            field: field.label,
            occurrences: count,
          });
      }
    }
  }

  const drafts: SeoKeywordDraft[] = [];
  for (const aggregate of aggregates.values()) {
    if (aggregate.total < MIN_OCCURRENCES) continue;
    if (aggregate.wordCount === 1 && aggregate.entities.size < 2) continue;

    let category: SeoKeywordCategory = "general";
    let best = 0;
    for (const [value, count] of aggregate.categories) {
      if (count > best) {
        best = count;
        category = value;
      }
    }
    if (brandTerms.some((term) => term && aggregate.keyword.includes(term))) category = "brand";
    else if (localTerms.some((term) => term && aggregate.keyword.includes(term)))
      category = "local";

    drafts.push({
      keyword: aggregate.keyword,
      normalized: aggregate.keyword,
      category,
      wordCount: aggregate.wordCount,
      usageCount: aggregate.total,
      pageCount: aggregate.entities.size,
      usages: [...aggregate.usages.values()].sort((a, b) => b.occurrences - a.occurrences),
    });
  }

  return drafts
    .sort(
      (a, b) =>
        b.usageCount - a.usageCount ||
        b.pageCount - a.pageCount ||
        a.keyword.localeCompare(b.keyword),
    )
    .slice(0, MAX_KEYWORDS);
}

/** Counts real occurrences of one phrase across the scanned content. */
export function countKeywordOccurrences(entities: SeoEntity[], keyword: string): number {
  const needle = normalizeKeyword(keyword);
  if (!needle) return 0;
  let total = 0;
  for (const entity of entities) {
    for (const field of entity.fields) {
      const haystack = normalizeKeyword(stripHtml(field.value));
      if (!haystack) continue;
      let index = haystack.indexOf(needle);
      while (index !== -1) {
        total += 1;
        index = haystack.indexOf(needle, index + needle.length);
      }
    }
  }
  return total;
}
