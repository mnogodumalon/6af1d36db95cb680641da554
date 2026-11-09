// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Beispieleintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    beschreibung?: string;
    kategorie?: LookupValue;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
    kontakt_vorname?: string;
    kontakt_nachname?: string;
    kontakt_email?: string;
    aktiv?: boolean;
    titel?: string;
  };
}

export const APP_IDS = {
  BEISPIELEINTRAEGE: '6af1d360d5a6c032d44fb878',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'beispieleintraege': {
    kategorie: [{ key: "allgemein", label: "Allgemein" }, { key: "wichtig", label: "Wichtig" }, { key: "sonstiges", label: "Sonstiges" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'beispieleintraege': {
    'beschreibung': 'string/textarea',
    'kategorie': 'lookup/select',
    'datum': 'date/date',
    'kontakt_vorname': 'string/text',
    'kontakt_nachname': 'string/text',
    'kontakt_email': 'string/email',
    'aktiv': 'bool',
    'titel': 'string/text',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateBeispieleintraege = StripLookup<Beispieleintraege['fields']>;