// Google Sheets & Drive API client utilities

export interface DriveSpreadsheetFile {
  id: string;
  name: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export interface SheetWorksheetInfo {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  worksheets: SheetWorksheetInfo[];
}

export interface SheetRowData {
  headers: string[];
  rows: string[][];
  rawRange: string;
}

/**
 * Extracts a valid spreadsheet ID from either a raw ID or full Google Sheets URL.
 */
export function extractSpreadsheetId(input: string): string {
  if (!input) return '';
  const trimmed = input.trim();
  // Matches https://docs.google.com/spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  return trimmed;
}

/**
 * Lists spreadsheets accessible by the user via Google Drive API.
 */
export async function listSpreadsheets(accessToken: string): Promise<DriveSpreadsheetFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const fields = encodeURIComponent('files(id,name,modifiedTime,webViewLink,iconLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime%20desc&pageSize=30`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errBody}`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Retrieves metadata for a specific spreadsheet, including available worksheet tabs.
 */
export async function fetchSpreadsheetMetadata(
  accessToken: string,
  spreadsheetId: string
): Promise<SpreadsheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  if (!cleanId) {
    throw new Error('Please provide a valid Google Spreadsheet ID or URL');
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=spreadsheetId,properties.title,sheets.properties(sheetId,title,index,gridProperties)`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    let parsedMsg = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedMsg = errJson?.error?.message || errBody;
    } catch {
      // keep raw
    }
    throw new Error(`Google Sheets API error (${response.status}): ${parsedMsg}`);
  }

  const data = await response.json();
  const worksheets: SheetWorksheetInfo[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    rowCount: s.properties.gridProperties?.rowCount,
    columnCount: s.properties.gridProperties?.columnCount,
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    worksheets,
  };
}

/**
 * Reads row values from a specific worksheet.
 */
export async function fetchWorksheetRows(
  accessToken: string,
  spreadsheetId: string,
  worksheetTitle: string,
  rangeLimit = 500
): Promise<SheetRowData> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `'${worksheetTitle.replace(/'/g, "''")}'!A1:ZZ${rangeLimit}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const errBody = await response.text();
    let parsedMsg = errBody;
    try {
      const errJson = JSON.parse(errBody);
      parsedMsg = errJson?.error?.message || errBody;
    } catch {
      // keep raw
    }
    throw new Error(`Google Sheets API error (${response.status}): ${parsedMsg}`);
  }

  const data = await response.json();
  const rawValues: string[][] = data.values || [];

  if (rawValues.length === 0) {
    return {
      headers: [],
      rows: [],
      rawRange: data.range || range,
    };
  }

  const headers = rawValues[0].map((h) => String(h || '').trim());
  const rows = rawValues.slice(1);

  return {
    headers,
    rows,
    rawRange: data.range || range,
  };
}

export type LeadFieldKey =
  | 'name'
  | 'email'
  | 'phone'
  | 'company'
  | 'date'
  | 'source'
  | 'medium'
  | 'campaign'
  | 'landing_page'
  | 'status'
  | 'country'
  | 'service'
  | 'revenue'
  | 'external_id'
  | 'notes';

export interface ColumnMappingConfig {
  [fieldKey: string]: string; // Maps LeadFieldKey -> Sheet Header Column Name or empty string
}

export const LEAD_FIELDS: { key: LeadFieldKey; label: string; required: boolean; description: string }[] = [
  { key: 'name', label: 'Lead Name', required: true, description: 'Full name or contact person' },
  { key: 'email', label: 'Email Address', required: true, description: 'Email for lead contact & duplicate prevention' },
  { key: 'phone', label: 'Phone Number', required: false, description: 'Direct telephone / WhatsApp number' },
  { key: 'company', label: 'Company Name', required: false, description: 'Organization or business account' },
  { key: 'date', label: 'Inquiry Date', required: false, description: 'Date lead was received (YYYY-MM-DD)' },
  { key: 'source', label: 'UTM Source / Channel', required: false, description: 'Traffic source (e.g. google, goodfirms)' },
  { key: 'medium', label: 'UTM Medium', required: false, description: 'Marketing medium (e.g. cpc, referral)' },
  { key: 'campaign', label: 'UTM Campaign', required: false, description: 'Campaign identifier or ad group' },
  { key: 'landing_page', label: 'Landing Page URL', required: false, description: 'Entry URL where lead submitted inquiry' },
  { key: 'status', label: 'Lead Status / Stage', required: false, description: 'Pipeline stage (New, MQL, SQL, Won, etc.)' },
  { key: 'country', label: 'Country / Region', required: false, description: 'Geographic location (e.g. United States)' },
  { key: 'service', label: 'Service of Interest', required: false, description: 'Product or solution inquired about' },
  { key: 'revenue', label: 'Deal Value / Revenue', required: false, description: 'Expected or won deal size' },
  { key: 'external_id', label: 'External ID / Lead ID', required: false, description: 'Unique identifier from external CRM/Form' },
  { key: 'notes', label: 'Notes / Remarks', required: false, description: 'Sales reps notes or user comments' },
];

/**
 * Automatically detects the best matching sheet header for each lead field.
 */
export function autoDetectColumnMappings(headers: string[]): ColumnMappingConfig {
  const mapping: ColumnMappingConfig = {};
  const lowerHeaders = headers.map((h) => ({
    original: h,
    clean: h.toLowerCase().replace(/[^a-z0-9]/g, ''),
  }));

  const heuristics: Record<LeadFieldKey, string[]> = {
    name: ['fullname', 'leadname', 'contactname', 'name', 'clientname', 'customername', 'prospect'],
    email: ['email', 'emailaddress', 'mail', 'contactemail', 'primaryemail'],
    phone: ['phone', 'phonenumber', 'mobile', 'cell', 'tel', 'whatsapp', 'contactno'],
    company: ['company', 'companyname', 'organization', 'org', 'account', 'business', 'firm'],
    date: ['date', 'inquirydate', 'createdat', 'timestamp', 'submissiondate', 'leaddate'],
    source: ['utmsource', 'source', 'channelsource', 'channel', 'platform', 'leadsource'],
    medium: ['utmmedium', 'medium', 'type'],
    campaign: ['utmcampaign', 'campaign', 'campaignname', 'adgroup', 'adset'],
    landing_page: ['landingpage', 'url', 'page', 'pageurl', 'formurl', 'referringurl'],
    status: ['status', 'pipelinestage', 'stage', 'leadstatus', 'qualification'],
    country: ['country', 'location', 'region', 'geo', 'state'],
    service: ['service', 'serviceofinterest', 'requirement', 'product', 'projecttype', 'interest'],
    revenue: ['revenue', 'dealvalue', 'value', 'amount', 'budget', 'dealsize', 'price'],
    external_id: ['externalid', 'leadid', 'id', 'recordid', 'submissionid', 'rowid'],
    notes: ['notes', 'remarks', 'comments', 'description', 'message', 'requirements'],
  };

  for (const field of LEAD_FIELDS) {
    const patterns = heuristics[field.key];
    let matched = '';
    for (const pat of patterns) {
      const found = lowerHeaders.find((h) => h.clean === pat || h.clean.includes(pat));
      if (found) {
        matched = found.original;
        break;
      }
    }
    mapping[field.key] = matched;
  }

  return mapping;
}

/**
 * Robust CSV/TSV parser supporting quoted strings, commas within quotes, and multi-line message fields.
 */
export function parseCSVToRows(csvText: string): { headers: string[]; rows: string[][] } {
  const result: string[][] = [];
  let currentRow: string[] = [];
  let currentVal = '';
  let insideQuote = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (insideQuote) {
      if (char === '"' && nextChar === '"') {
        currentVal += '"';
        i++;
      } else if (char === '"') {
        insideQuote = false;
      } else {
        currentVal += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',' || char === '\t') {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if (char === '\r') {
        // ignore CR
      } else if (char === '\n') {
        currentRow.push(currentVal.trim());
        if (currentRow.some((c) => c !== '')) {
          result.push(currentRow);
        }
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some((c) => c !== '')) {
      result.push(currentRow);
    }
  }

  if (result.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = result[0];
  const rows = result.slice(1);
  return { headers, rows };
}
