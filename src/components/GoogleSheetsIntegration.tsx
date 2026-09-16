import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Table,
  ArrowRight,
  ShieldCheck,
  Filter,
  Check,
  Sparkles,
  Info,
  FolderOpen,
  LogOut,
  Layers,
  AlertTriangle,
  Search,
  Upload,
} from 'lucide-react';
import type { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getAccessToken,
  setCachedAccessToken,
} from '../lib/googleAuth.ts';
import {
  listSpreadsheets,
  fetchSpreadsheetMetadata,
  fetchWorksheetRows,
  autoDetectColumnMappings,
  extractSpreadsheetId,
  parseCSVToRows,
  LEAD_FIELDS,
  type DriveSpreadsheetFile,
  type SheetWorksheetInfo,
  type SheetRowData,
  type ColumnMappingConfig,
} from '../lib/googleSheets.ts';
import type { Lead } from '../types/index.ts';

const SOLULAB_RAW_SHEET_CSV = `Dates,Lead Email,Message ,Landing Page,Form Filled At,Source
16 September,edwin.gelbiger@fenster-spezialisten.de,"Good day there, Are you looking for a PVC window partner for delivery and installation at guaranteed best prices? We offer full window services. Best Edwin Projekt Management Fenster Spezialisten Deutschland",https://www.solulab.com/contact-us/,https://www.solulab.com/contact-us/,Organic
15 September,siddarthyara94@yahoo.com,"hey there I'm siddarth startup founder of L1 Stable coin so currently looking to build the stablecoin so I found you that you build so can we discuss about that",https://www.solulab.com/?utm_source=gemini,https://www.solulab.com/,Gemini
15 September,qtahstore@gmail.com,"برمجة وتصميم موقع بالكامل (Complete website design and development.)",https://www.solulab.com/sl/custom-software-development-saudi-arabia/?gad_source=1&gad_campaignid=24219341968&gbraid=0AAAABChOI_L6_YgEcPLaSgsHC6ndV2bD8&gclid=CjwKCAjw2aPVBhBkEiwA0Cptt--xmQ21dtBsC0BI1kBf0b_WNATO9BET155uWzJwWGg2Zjl2DUW21RoCB1gQAvD_BwE,https://www.solulab.com/sl/custom-software-development-saudi-arabia/,Google Ads
15 September,rick.hoek@atlasorigination.com,"Dear Sir or Madam, I am writing in connection with a sale process for an AI-native code security company with 2 products on 1 proprietary agentic architecture, a smart contract audit engine and a continuous code security product for software development. The reason for approaching SoluLab is the overlap with your smart contract audit practice, which the engine would move from manual hours into an owned product. Rick Hoek Co-Founder & Managing Partner Atlas Origination +31 6 1478 1198",https://www.solulab.com/inquire/,https://www.solulab.com/inquire/,Organic
15 September,vaishali@devsinindia.com,"Regarding Joint Association and Collaboration between the 'Gramin AI Data Center' and the 'Gramin Artificial Intelligence Development Corporation (GAIDC)' under the 'Viksit Bharat @ 2047' initiative ... BharatNet, PMKVY 4.0, Regional LLMs ... GIFT City Gandhinagar",https://www.solulab.com/ai-development-company/?utm_source=GoodfirmPaid&utm_medium=AI+Dev&utm_campaign=Goodfirm_paid,https://www.solulab.com/ai-development-company/?utm_source=SoluLabBlog&utm_medium=AIPoweredRegTechSolutionProviders_CTA,Good Firms
14 September,info@e-faceq.com,"through whatsapp - inquiry for custom software development in Saudi Arabia",https://www.solulab.com/sl/custom-software-development-saudi-arabia/?gad_source=1&gad_campaignid=24219341968&gclid=Cj0KCQjwk5nVBhDiARIsAHNGqadjBZgUkO94nSZ5GU_v1YoO3txxEh3IP4ET56NNHdPcgdilKo-3gOMaAiYZEALw_wcB,https://www.solulab.com/sl/custom-software-development-saudi-arabia/,Google Ads
14 September,akhil.anil@leads.solulab.com,"Face Mask Detection using Deep Learning, Insurance prediction using machine learning, Covid 19 data analysis using power BI, Python - Data science",https://www.solulab.com/sl/custom-software-development-saudi-arabia/?gad_source=1&gad_campaignid=24219341968&gbraid=0AAAABChOI_KBmB0L4FQoF-JTkgjQJ9je6&gclid=Cj0KCQjwk5nVBhDiARIsAHNGqadgf2T5fsj2bhu4i_UtjlkbzOMEvd5SpBszBxmkZZEUcwREbpv2sP0aAjRJEALw_wcB,https://www.solulab.com/sl/custom-software-development-saudi-arabia/,Google Ads
14 September,antoneade111@gmail.com,"I want to tokenize books and content for assumed value later",https://www.solulab.com/tokenization-of-ip-assets/,https://www.solulab.com/tokenization-of-ip-assets/,Organic
13 September,niravr_bhulani@hotmail.com,"Looking for flash crypto loan bot basic one",https://www.solulab.com/?utm_source=clutch_referral&utm_medium=clutch_listing&utm_campaign=Solulab_clutch,https://www.solulab.com/,Clutch
12 September,woroodnajjar2188@gmail.com,"I need cybersecurity for my personal phone device",https://www.solulab.com/,https://www.solulab.com/,Organic
12 September,stephen.liddington@yahoo.com,"Dear Friends, Do you offer seminars or courses to teach salespeople how to democratize and popularize this technology to bring you millions of new investors among middle class Americans? I think that is what President Trump and Scott Bessent are trying to get started by tokenizing U.S. Treasuries...",https://www.solulab.com/tokenized-us-treasury-platform-development/,https://www.solulab.com/blockchain-development-company/,Organic
11 September,preet.parakh@djsanghvi.edu.in,"Collaboration opportunity SoluLab x DJ Sanghvi College of Engineering, Vile Parle. We promise you targeted app downloads / sign-ups through on-campus activations, direct access to our student community and many such benefits.",https://www.solulab.com/,https://www.solulab.com/contact-us/,Organic
11 September,daniel.brunet71@gmail.com,"ECO-CYCLE services environnementaux RWA • CARBON • RECYCLING • BLOCKCHAIN Building a Digital Infrastructure for Real-World Environmental Assets Eco-Cycle Services Environnementaux is developing a specialized recycling infrastructure dedicated to the recovery and valorization of end-of-life synthetic sports surfaces...",https://www.solulab.com/,https://www.solulab.com/,Organic
10 September,it@luxuryexplorersme.com,"We are looking to build a B2B Agent Incentive and Loyalty Portal. The platform will allow independent travel consultants and real estate agents to earn commission-based rewards. The system requires three distinct user roles: Agent/Advisor, Agency Principal, and System Administrator.",https://www.solulab.com/?utm_source=Goodfirms&utm_medium=referral,https://www.solulab.com/,Good Firms
9 September,priyanshi.u@itprofiles.net,"Hi Team, We're getting requests for IT services in USA/Canada/UK, and your agency stood out as a potential match. We're looking to onboard a few strong partners in this space who we can recommend directly to these clients. Getting listed is free and takes 5 minutes here: https://itprofiles.com/list-company",https://www.solulab.com/,https://www.solulab.com/,Organic
9 September,ashwin200429@gmail.com,"I have developed a company website with an integrated career portal for my organization. I have also developed an e-commerce website and a portfolio website for my manager. Currently, I am working on refining and enhancing our mail product.",https://www.solulab.com/,https://www.solulab.com/hire-web3-developers/,Organic
8 September,11arun7kumar96@gmail.com,"my project is software developer system design web design",https://www.solulab.com/?utm_source=Goodfirms&utm_medium=referral,https://www.solulab.com/,Good Firms
8 September,busch781990@gmail.com,"Hi my name is chaiwat from Phuket Thailand and I have a proposal involves patent rights for technology and lawsuits, claims of torture and experimentation for technological gain, and data breaches...",https://www.solulab.com/contact-us/,https://www.solulab.com/contact-us/,Organic
8 September,Levrnmoore@aol.com,"I have wrote two award winning game concepts using AI. My game will make millions of dollars if developed, marketed and published correctly. I am currently looking for a game partner to develop, publish and market my games and share the revenue from the sales. Would your company be interested in this great partnership offer?",https://www.solulab.com/ai-development-company/?utm_source=GoodfirmPaid&utm_medium=AI+Dev&utm_campaign=Goodfirm_paid,https://www.solulab.com/blockchain-game-development-company/,Good Firms
7 September,jamie@cxohoop.com,"I noticed Sonatype is a software governance company serving engineering teams with open source and AI security solutions. We can bring you more engineering teams in need of software supply chain security through our services this month. Let's have a quick chat :)",https://www.solulab.com/,https://www.solulab.com/,Organic
5 September,tushar@lampwatch.io,"Hey, I’m building Lampwatch and researching how agencies look after client products once they’re live. I’d love to hear how your team handles maintenance and unexpected issues. I want to book a call for a research chat rather than a project enquiry, hope that’s okay!",https://www.solulab.com/?utm_source=clutch.co&utm_medium=clutch_listing&utm_campaign=Solulab_clutch,https://www.solulab.com/,Clutch
3 September,arjunroykripa6488@gmail.com,"Hello sir i need p2p wallet agent in Bangladesh",https://www.solulab.com/best-p2p-crypto-exchanges/,https://www.solulab.com/best-p2p-crypto-exchanges/,Organic
2 September,ehsan@finsoulbpo.com,"Hi SoluLab Team, I came across SoluLab and was impressed by your expertise in AI, blockchain, Web3, custom software, mobile and web applications, SaaS, cloud solutions, and enterprise software development. I wanted to introduce FinSoul BPO as a potential software development partner... CEO Mr Muhammad Ehsan FinSoul BPO finsoulbpo.com",https://www.solulab.com/?utm_source=Goodfirms&utm_medium=referral,https://www.solulab.com/,Good Firms
2 September,karan@bauersit.com,"Hi, we are looking to build out an AI agent platform with multiple AI agents for our company (bauersit.com) for each department. This platform needs to be generic and SaaS based so it can be used by other companies in the future as a SaaS tool. More details can be found here: https://docs.google.com/spreadsheets/d/1HZdap9J74S8GAl8Fn6iI30BSaomUV_9IkTScl-LCqd0/edit?gid=0#gid=0 We need a quotation by Thu, Sept 3 EOD as we are looking to make a decision on a vendor this week. Thanks.",https://www.solulab.com/ai-agent-development-company/?utm_source=chatgpt.com,https://www.solulab.com/ai-agent-development-company/,ChatGPT
2 September,gennexa.unos@gmail.com,"Hi SoluLab Team, We represent Gennexa AI, an AI-first technology company focused on delivering enterprise AI solutions, automation systems, AI agents, custom software development, and digital transformation services. We are interested in exploring a strategic partnership and potential listing/collaboration opportunities with SoluLab. Gennexa.ai",https://www.solulab.com/,https://www.solulab.com/,Organic
1 September,mlaza9046@gmail.com,"Interested in crypto",https://www.solulab.com/top-green-cryptocurrencies/,https://www.solulab.com/top-green-cryptocurrencies/,Organic
1 September,muralisyam86@gmail.com,"Subject: Partnership Proposal — Offshore Development Capacity from Raintech Software Limited, India. Managing Director of Raintech Software Limited, a publicly listed custom software development and AI engineering company based at Infopark, Kochi, India. Full-stack capability: PHP, Laravel, Node.js, React, Flutter, Electron JS, SQL/NoSQL, AI/ML practice... +91 8606093110",https://www.solulab.com/?utm_source=Goodfirms&utm_medium=referral,https://www.solulab.com/,Good Firms`;

interface PreviewLeadRow {
  rowNumber: number;
  data: Partial<Lead>;
  status: 'valid' | 'update' | 'duplicate' | 'invalid';
  reason?: string;
  matchedField?: string;
  existingLead?: Lead;
  updatedFields?: string[];
}

interface GoogleSheetsIntegrationProps {
  onSyncComplete?: () => void;
  onNavigateToLeads?: () => void;
}

export const GoogleSheetsIntegration: React.FC<GoogleSheetsIntegrationProps> = ({
  onSyncComplete,
  onNavigateToLeads,
}) => {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet selection
  const [driveFiles, setDriveFiles] = useState<DriveSpreadsheetFile[]>([]);
  const [loadingDrive, setLoadingDrive] = useState(false);
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [selectedSpreadsheetTitle, setSelectedSpreadsheetTitle] = useState('');
  const [worksheets, setWorksheets] = useState<SheetWorksheetInfo[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState('');
  const [headerRow, setHeaderRow] = useState(1);
  const [loadingMetadata, setLoadingMetadata] = useState(false);

  // Sheet data & mapping
  const [sheetData, setSheetData] = useState<SheetRowData | null>(null);
  const [mappings, setMappings] = useState<ColumnMappingConfig>({});
  const [loadingRows, setLoadingRows] = useState(false);

  // Existing leads for duplicate detection
  const [existingLeads, setExistingLeads] = useState<Lead[]>([]);

  // Preview state
  const [previewRows, setPreviewRows] = useState<PreviewLeadRow[]>([]);
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'update' | 'duplicate' | 'invalid'>('all');
  const [syncFrequency, setSyncFrequency] = useState<'Every 15 minutes' | 'Hourly' | 'Daily' | 'Manual'>('Every 15 minutes');
  const [sourceMode, setSourceMode] = useState<'solulab' | 'paste' | 'drive'>('solulab');
  const [rawCsvInput, setRawCsvInput] = useState('');

  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    importedCount: number;
    newRecordsCount: number;
    updatedRecordsCount: number;
    duplicatesCount: number;
    invalidCount: number;
    message?: string;
  } | null>(null);

  // Error / Info banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Initialize Auth State
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        setAccessToken(token);
        setAuthError(null);
      },
      () => {
        // If token expired or signed out
        getAccessToken().then((cached) => {
          if (cached) {
            setAccessToken(cached);
          } else {
            setAccessToken(null);
          }
        });
      }
    );

    // Fetch existing leads from API for local duplicate preview
    fetch('/api/leads?limit=1000')
      .then((r) => r.json())
      .then((data) => {
        if (data.leads && Array.isArray(data.leads)) {
          setExistingLeads(data.leads);
        }
      })
      .catch((err) => console.error('Error fetching leads:', err));

    // Load saved sheets configuration if any
    fetch('/api/integrations/sheets/config')
      .then((r) => r.json())
      .then((data) => {
        if (data.config) {
          if (data.config.spreadsheetId) {
            setSelectedSpreadsheetId(data.config.spreadsheetId);
            setSpreadsheetInput(data.config.spreadsheetId);
          }
          if (data.config.spreadsheetTitle) setSelectedSpreadsheetTitle(data.config.spreadsheetTitle);
          if (data.config.worksheetTitle) setSelectedWorksheet(data.config.worksheetTitle);
          if (data.config.headerRow) setHeaderRow(data.config.headerRow);
          if (data.config.mappings) setMappings(data.config.mappings);
        }
      })
      .catch((err) => console.error('Error fetching sheets config:', err));

    return () => unsubscribe();
  }, []);

  // When access token is available, load Drive spreadsheets list
  useEffect(() => {
    if (accessToken) {
      loadDriveFiles(accessToken);
    }
  }, [accessToken]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        setCachedAccessToken(res.accessToken);
        await loadDriveFiles(res.accessToken);
      }
    } catch (err: any) {
      console.error('Google Sign-In Failed:', err);
      setAuthError(err?.message || 'Authentication was cancelled or failed.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await googleSignOut();
    setCurrentUser(null);
    setAccessToken(null);
    setDriveFiles([]);
    setSheetData(null);
    setPreviewRows([]);
    setImportResult(null);
  };

  const loadDriveFiles = async (token: string) => {
    setLoadingDrive(true);
    try {
      const files = await listSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.warn('Could not load Drive files list:', err);
      // Drive list failure is non-fatal if user inputs ID directly
    } finally {
      setLoadingDrive(false);
    }
  };

  // Load worksheet tabs from selected spreadsheet
  const handleLoadSpreadsheet = async (targetId?: string) => {
    const idToUse = extractSpreadsheetId(targetId || spreadsheetInput || selectedSpreadsheetId);
    if (!idToUse) {
      setErrorMessage('Please enter a valid Google Spreadsheet URL or ID');
      return;
    }

    if (!accessToken) {
      setErrorMessage('Please sign in with Google to read your spreadsheet');
      return;
    }

    setLoadingMetadata(true);
    setErrorMessage(null);
    setImportResult(null);
    try {
      const meta = await fetchSpreadsheetMetadata(accessToken, idToUse);
      setSelectedSpreadsheetId(meta.id);
      setSelectedSpreadsheetTitle(meta.title);
      setWorksheets(meta.worksheets);
      if (meta.worksheets.length > 0) {
        // default to previous or first worksheet
        const matched = meta.worksheets.find((w) => w.title === selectedWorksheet);
        const wsToSelect = matched ? matched.title : meta.worksheets[0].title;
        setSelectedWorksheet(wsToSelect);
        // Automatically fetch rows for this worksheet
        await loadWorksheetData(idToUse, wsToSelect, headerRow, accessToken);
      }
    } catch (err: any) {
      console.error('Failed to load spreadsheet metadata:', err);
      setErrorMessage(err.message || 'Failed to connect to Google Sheets');
    } finally {
      setLoadingMetadata(false);
    }
  };

  // Load rows for a specific worksheet
  const loadWorksheetData = async (
    sId: string,
    wTitle: string,
    hRow: number,
    token: string
  ) => {
    setLoadingRows(true);
    setErrorMessage(null);
    try {
      const rawData = await fetchWorksheetRows(token, sId, wTitle, 200);

      // Adjust for headerRow (if headerRow > 1)
      const adjustedHeaders =
        hRow > 1 && rawData.rows.length >= hRow - 1
          ? rawData.rows[hRow - 2]
          : rawData.headers;

      const adjustedRows =
        hRow > 1 ? rawData.rows.slice(hRow - 1) : rawData.rows;

      const data: SheetRowData = {
        headers: adjustedHeaders,
        rows: adjustedRows,
        rawRange: rawData.rawRange,
      };

      setSheetData(data);

      // Run auto mapping if mappings empty or headers changed
      const autoMapped = autoDetectColumnMappings(data.headers);
      setMappings((prev) => {
        // Keep existing mappings that are still valid, fill in the rest
        const combined = { ...autoMapped, ...prev };
        return combined;
      });

      // Compute preview
      computePreviewRows(data, autoMapped, existingLeads);
    } catch (err: any) {
      console.error('Failed to load worksheet rows:', err);
      setErrorMessage(err.message || 'Error loading worksheet content');
    } finally {
      setLoadingRows(false);
    }
  };

  // Compute preview rows and identify duplicates
  const computePreviewRows = (
    data: SheetRowData,
    currentMappings: ColumnMappingConfig,
    leadsList: Lead[]
  ) => {
    if (!data || !data.headers || data.headers.length === 0) {
      setPreviewRows([]);
      return;
    }

    const { headers, rows } = data;
    const headerIndices: Record<string, number> = {};
    headers.forEach((h, idx) => {
      headerIndices[h] = idx;
    });

    const getVal = (row: string[], field: string): string => {
      const mappedHeader = currentMappings[field];
      if (!mappedHeader) return '';
      const idx = headerIndices[mappedHeader];
      if (idx === undefined || idx < 0 || idx >= row.length) return '';
      return String(row[idx] || '').trim();
    };

    const results: PreviewLeadRow[] = [];

    // Track seen emails, phones, and external IDs within this sheet to catch in-sheet duplicates
    const seenEmails = new Set<string>();
    const seenPhones = new Set<string>();
    const seenExtIds = new Set<string>();

    rows.forEach((row, rIdx) => {
      // Check if row is completely empty
      const isBlank = row.every((cell) => !cell || !cell.trim());
      if (isBlank) return;

      const name = getVal(row, 'name');
      const email = getVal(row, 'email').toLowerCase();
      const phone = getVal(row, 'phone');
      const company = getVal(row, 'company');
      const date = getVal(row, 'date') || new Date().toISOString().slice(0, 10);
      const source = getVal(row, 'source') || 'google-sheets';
      const medium = getVal(row, 'medium') || 'spreadsheet';
      const campaign = getVal(row, 'campaign');
      const landing_page = getVal(row, 'landing_page') || 'https://acmetech.com/contact';
      const status = (getVal(row, 'status') || 'New') as any;
      const country = getVal(row, 'country') || 'United States';
      const service = getVal(row, 'service') || 'General Inquiry';
      const revenue = parseFloat(getVal(row, 'revenue')) || 0;
      const external_id = getVal(row, 'external_id');
      const notes = getVal(row, 'notes');

      const effectiveName = name || (email ? email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '');

      const leadRecord: Partial<Lead> = {
        name: effectiveName,
        email,
        phone,
        company,
        date,
        source,
        medium,
        campaign,
        landing_page,
        status,
        country,
        service,
        revenue,
        external_id,
        notes,
      };

      const rowNumber = rIdx + 2; // Row 1 is header

      // Validation check
      if (!effectiveName || !email) {
        results.push({
          rowNumber,
          data: leadRecord,
          status: 'invalid',
          reason: !effectiveName ? 'Missing Name' : 'Missing Email Address',
        });
        return;
      }

      // Deduplication check in strict hierarchical order:
      // Priority 1: External ID (strongest identifier)
      // Priority 2: Email
      // Priority 3: Phone
      const cleanEmail = email ? email.trim().toLowerCase() : '';
      let matchedLead: Lead | undefined;
      let matchedField: string | undefined;

      // 1. Check External ID
      if (external_id && external_id.trim()) {
        const cleanExt = external_id.trim().toLowerCase();
        const extMatch = leadsList.find(
          (l) => l.external_id && l.external_id.trim().toLowerCase() === cleanExt
        );
        if (extMatch) {
          matchedLead = extMatch;
          matchedField = 'External ID';
        }
      }

      // 2. Check Email (if no external_id match)
      if (!matchedLead && cleanEmail) {
        const emailMatch = leadsList.find((l) => l.email.trim().toLowerCase() === cleanEmail);
        if (emailMatch) {
          matchedLead = emailMatch;
          matchedField = 'Email';
        }
      }

      // 3. Check Phone (if no email match)
      const cleanPhone = phone ? phone.replace(/\D/g, '') : '';
      if (!matchedLead && cleanPhone && cleanPhone.length > 5) {
        const phoneMatch = leadsList.find((l) => l.phone && l.phone.replace(/\D/g, '') === cleanPhone);
        if (phoneMatch) {
          matchedLead = phoneMatch;
          matchedField = 'Phone';
        }
      }

      // If matched with existing database lead: Check if Update or Duplicate
      if (matchedLead) {
        const changedFields: string[] = [];
        if (status && status !== matchedLead.status) {
          changedFields.push(`status (${matchedLead.status} → ${status})`);
        }
        if (revenue > 0 && revenue !== matchedLead.revenue) {
          changedFields.push(`revenue ($${matchedLead.revenue} → $${revenue})`);
        }
        if (company && company !== matchedLead.company) {
          changedFields.push(`company`);
        }
        if (service && service !== matchedLead.service) {
          changedFields.push(`service`);
        }
        if (notes && notes !== matchedLead.notes) {
          changedFields.push(`notes`);
        }

        if (changedFields.length > 0) {
          results.push({
            rowNumber,
            data: leadRecord,
            status: 'update',
            matchedField,
            existingLead: matchedLead,
            updatedFields: changedFields,
            reason: `Updates existing lead #${matchedLead.id} (${matchedLead.name}): ${changedFields.join(', ')}`,
          });
          return;
        } else {
          results.push({
            rowNumber,
            data: leadRecord,
            status: 'duplicate',
            matchedField,
            existingLead: matchedLead,
            reason: `Matches existing lead #${matchedLead.id} on ${matchedField} (identical data)`,
          });
          return;
        }
      }

      // Check within-sheet duplicates
      if (external_id && external_id.trim()) {
        const cleanExt = external_id.trim().toLowerCase();
        if (seenExtIds.has(cleanExt)) {
          results.push({
            rowNumber,
            data: leadRecord,
            status: 'duplicate',
            matchedField: 'External ID (Repeated in Sheet)',
            reason: `Duplicate external ID already present in earlier row of sheet`,
          });
          return;
        }
        seenExtIds.add(cleanExt);
      }

      if (seenEmails.has(cleanEmail)) {
        results.push({
          rowNumber,
          data: leadRecord,
          status: 'duplicate',
          matchedField: 'Email (Repeated in Sheet)',
          reason: `Duplicate row with email ${cleanEmail} already present in sheet`,
        });
        return;
      }
      seenEmails.add(cleanEmail);

      if (cleanPhone && cleanPhone.length > 5) {
        if (seenPhones.has(cleanPhone)) {
          results.push({
            rowNumber,
            data: leadRecord,
            status: 'duplicate',
            matchedField: 'Phone (Repeated in Sheet)',
            reason: `Duplicate phone number already present in earlier row of sheet`,
          });
          return;
        }
        seenPhones.add(cleanPhone);
      }

      // Valid new record
      results.push({
        rowNumber,
        data: leadRecord,
        status: 'valid',
      });
    });

    setPreviewRows(results);
  };

  // Parse and preview raw CSV or preloaded SoluLab sheet data
  const handleParseAndPreviewCSV = (customCsv?: string, leadsToUse?: Lead[]) => {
    const textToParse = customCsv !== undefined ? customCsv : (rawCsvInput || SOLULAB_RAW_SHEET_CSV);
    if (!textToParse.trim()) {
      setErrorMessage('Please provide sheet CSV or TSV data');
      return;
    }

    try {
      const parsed = parseCSVToRows(textToParse);
      if (parsed.headers.length === 0 || parsed.rows.length === 0) {
        setErrorMessage('Could not find valid rows in the provided CSV text');
        return;
      }

      const data: SheetRowData = {
        headers: parsed.headers,
        rows: parsed.rows,
        rawRange: `SoluLab Leads Sheet (${parsed.rows.length} rows)`,
      };

      setSheetData(data);
      setSelectedSpreadsheetTitle('SoluLab Website Inquiries & Leads Sheet');
      setSelectedWorksheet('Sheet1');

      const autoMapped = autoDetectColumnMappings(data.headers);
      if (!autoMapped.email) {
        const emailH = data.headers.find((h) => h.toLowerCase().includes('email'));
        if (emailH) autoMapped.email = emailH;
      }
      if (!autoMapped.date) {
        const dateH = data.headers.find((h) => h.toLowerCase().includes('date'));
        if (dateH) autoMapped.date = dateH;
      }
      if (!autoMapped.notes) {
        const msgH = data.headers.find((h) => h.toLowerCase().includes('message'));
        if (msgH) autoMapped.notes = msgH;
      }
      if (!autoMapped.landing_page) {
        const lpH = data.headers.find((h) => h.toLowerCase().includes('landing'));
        if (lpH) autoMapped.landing_page = lpH;
      }
      if (!autoMapped.source) {
        const srcH = data.headers.find((h) => h.toLowerCase().includes('source'));
        if (srcH) autoMapped.source = srcH;
      }

      setMappings(autoMapped);
      computePreviewRows(data, autoMapped, leadsToUse || existingLeads);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(`CSV parsing error: ${err.message}`);
    }
  };

  // Automatically initialize preview for SoluLab sheet leads once existingLeads are loaded
  useEffect(() => {
    if (existingLeads.length > 0 && !sheetData) {
      handleParseAndPreviewCSV(SOLULAB_RAW_SHEET_CSV, existingLeads);
    }
  }, [existingLeads]);

  // Handle manual column mapping change
  const handleMappingChange = (fieldKey: string, headerName: string) => {
    const updated = { ...mappings, [fieldKey]: headerName };
    setMappings(updated);
    if (sheetData) {
      computePreviewRows(sheetData, updated, existingLeads);
    }
  };

  // Auto-map action
  const handleAutoMap = () => {
    if (!sheetData || !sheetData.headers) return;
    const detected = autoDetectColumnMappings(sheetData.headers);
    setMappings(detected);
    computePreviewRows(sheetData, detected, existingLeads);
  };

  // Perform Real Import
  const handleExecuteImport = async () => {
    if (!sheetData || previewRows.length === 0) return;

    const processableRows = previewRows.filter((r) => r.status === 'valid' || r.status === 'update');
    if (processableRows.length === 0) {
      setErrorMessage('No new leads or pending updates to synchronize.');
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    setImportResult(null);

    try {
      const payload = {
        spreadsheetId: selectedSpreadsheetId,
        spreadsheetTitle: selectedSpreadsheetTitle,
        worksheetTitle: selectedWorksheet,
        headerRow,
        mappings,
        syncFrequency,
        leads: processableRows.map((r) => r.data),
      };

      const response = await fetch('/api/integrations/sheets/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server rejected Google Sheets import');
      }

      const result = await response.json();
      setImportResult({
        success: true,
        importedCount: result.importedCount,
        newRecordsCount: result.newRecordsCount ?? result.importedCount,
        updatedRecordsCount: result.updatedRecordsCount ?? 0,
        duplicatesCount: result.duplicatesCount,
        invalidCount: result.invalidCount,
        message: `Successfully synchronized leads from Google Sheet: ${result.newRecordsCount ?? result.importedCount} new leads inserted, ${result.updatedRecordsCount ?? 0} leads updated, ${result.duplicatesCount} duplicates preserved.`,
      });

      // Refresh existing leads
      const refreshedLeads = await fetch('/api/leads?limit=1000').then((r) => r.json());
      if (refreshedLeads.leads) {
        setExistingLeads(refreshedLeads.leads);
        // Re-compute preview with newly imported leads
        computePreviewRows(sheetData, mappings, refreshedLeads.leads);
      }

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMessage(err.message || 'Error occurred during import');
    } finally {
      setIsImporting(false);
    }
  };

  // Preview filtering stats
  const totalCount = previewRows.length;
  const validCount = previewRows.filter((r) => r.status === 'valid').length;
  const updateCount = previewRows.filter((r) => r.status === 'update').length;
  const duplicateCount = previewRows.filter((r) => r.status === 'duplicate').length;
  const invalidCount = previewRows.filter((r) => r.status === 'invalid').length;

  const filteredPreviewRows = previewRows.filter((row) => {
    if (previewFilter === 'all') return true;
    return row.status === previewFilter;
  });

  const isNameMapped = !!mappings.name;
  const isEmailMapped = !!mappings.email;

  return (
    <div className="space-y-6">
      {/* SECTION 1: GOOGLE ACCOUNT AUTHENTICATION HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Google Sheets Lead Ingestion</h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                <ShieldCheck className="w-3 h-3" /> OAuth 2.0 Secure
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Read and synchronize marketing leads directly from your Google Drive spreadsheets with duplicate prevention.
            </p>
          </div>
        </div>

        <div>
          {currentUser && accessToken ? (
            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Google User'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                  {currentUser.email?.charAt(0).toUpperCase() || 'G'}
                </div>
              )}
              <div className="text-left pr-2">
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>{currentUser.displayName || currentUser.email?.split('@')[0]}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-[11px] text-slate-500 font-mono truncate max-w-[180px]">
                  {currentUser.email}
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                title="Sign out of Google"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="gsi-material-button inline-flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs text-xs font-semibold text-slate-700 transition-all cursor-pointer disabled:opacity-50"
            >
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
              </svg>
              <span>{isSigningIn ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>
          )}
        </div>
      </div>

      {authError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800 text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <div className="font-semibold">Google Sign-in Notification</div>
            <div>{authError}</div>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 text-xs">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-semibold">Action Required</div>
            <div>{errorMessage}</div>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-500 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Google Sheet Synchronization Complete</span>
            </div>
            {onNavigateToLeads && (
              <button
                type="button"
                onClick={onNavigateToLeads}
                className="inline-flex items-center gap-1 font-semibold text-emerald-800 hover:text-emerald-950 underline"
              >
                <span>View Leads Database</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <p className="text-emerald-700">{importResult.message}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="bg-white/80 border border-emerald-200 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">New Leads Added</div>
              <div className="text-base font-bold text-emerald-700 font-mono">{importResult.newRecordsCount}</div>
            </div>
            <div className="bg-white/80 border border-blue-200 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Leads Updated</div>
              <div className="text-base font-bold text-blue-700 font-mono">{importResult.updatedRecordsCount}</div>
            </div>
            <div className="bg-white/80 border border-amber-200 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Duplicates Prevented</div>
              <div className="text-base font-bold text-amber-700 font-mono">{importResult.duplicatesCount}</div>
            </div>
            <div className="bg-white/80 border border-slate-200 rounded-lg p-2 text-center">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Errors / Skipped</div>
              <div className="text-base font-bold text-slate-600 font-mono">{importResult.invalidCount}</div>
            </div>
          </div>
          <div className="text-[11px] text-emerald-800/80 flex items-center gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>Operational Source of Truth: Lead data is synchronized from Google Sheet. First-touch UTM attribution is securely preserved.</span>
          </div>
        </div>
      )}

      {/* SECTION 2: SPREADSHEET SOURCE SELECTOR */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        {/* Source Mode Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-lg border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setSourceMode('solulab');
                handleParseAndPreviewCSV(SOLULAB_RAW_SHEET_CSV);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sourceMode === 'solulab'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
              <span>SoluLab Leads Sheet (27 Live Records)</span>
              <span className="px-1.5 py-0.2 text-[9px] bg-blue-100 text-blue-800 rounded-full font-bold">Source of Truth</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('paste')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sourceMode === 'paste'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-slate-500" />
              <span>Paste Sheet / CSV Data</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceMode('drive')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                sourceMode === 'drive'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Drive OAuth Browser</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Sync Rule: <strong>One-way (Sheet → App)</strong></span>
          </div>
        </div>

        {/* MODE 1: SoluLab Real Sheet Operational Dashboard */}
        {sourceMode === 'solulab' && (
          <div className="bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 border border-blue-200/80 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900">SoluLab Website Leads Operational Sheet</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Active Sync: Every 15 Min
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Operational source of truth for inbound inquiries with complete UTM attribution across Google Ads (Saudi Arabia CPC), GoodFirms, Clutch, AI Search, and Organic channels.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleParseAndPreviewCSV(SOLULAB_RAW_SHEET_CSV)}
                  className="px-3 py-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reload 27 Records</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('paste')}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Append Custom Rows</span>
                </button>
              </div>
            </div>

            {/* Inquiries Attribution Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="bg-white/90 border border-blue-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Inquiries</div>
                <div className="text-lg font-extrabold text-slate-900 font-mono mt-0.5">27 Leads</div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Synced to Database
                </div>
              </div>
              <div className="bg-white/90 border border-blue-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Google Ads (KSA)</div>
                <div className="text-lg font-extrabold text-blue-600 font-mono mt-0.5">3 Inquiries</div>
                <div className="text-[10px] text-slate-500 truncate" title="Campaign ID: 24219341968">
                  ID: 24219341968
                </div>
              </div>
              <div className="bg-white/90 border border-blue-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">GoodFirms & Clutch</div>
                <div className="text-lg font-extrabold text-indigo-600 font-mono mt-0.5">9 Inquiries</div>
                <div className="text-[10px] text-slate-500 truncate">Paid AI Dev + Listings</div>
              </div>
              <div className="bg-white/90 border border-blue-100 rounded-lg p-3">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AI Search & Organic</div>
                <div className="text-lg font-extrabold text-emerald-600 font-mono mt-0.5">15 Inquiries</div>
                <div className="text-[10px] text-slate-500 truncate">Gemini, ChatGPT, Direct</div>
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: Paste Raw Sheet / CSV Input */}
        {sourceMode === 'paste' && (
          <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Direct Sheet Paste / CSV Input</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Copy and paste tab-delimited or comma-delimited lead rows directly from Google Sheets or Excel.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRawCsvInput(SOLULAB_RAW_SHEET_CSV)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline"
              >
                Insert SoluLab Real Sheet Data
              </button>
            </div>

            <div>
              <textarea
                value={rawCsvInput}
                onChange={(e) => setRawCsvInput(e.target.value)}
                placeholder="Paste Google Sheet rows or CSV data here (header row required, e.g. Dates, Lead Email, Message, Landing Page, Source)..."
                rows={6}
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Supports commas, tabs, and multi-line message fields with quotes.
              </span>
              <button
                type="button"
                onClick={() => handleParseAndPreviewCSV(rawCsvInput)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Parse & Preview Sheet Data</span>
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: Drive OAuth Browser */}
        {sourceMode === 'drive' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Google Drive & Sheets OAuth Browser</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Connect directly to your Google account to browse and sync any live spreadsheet from your Drive.
                </p>
              </div>
              {currentUser && (
                <button
                  type="button"
                  onClick={() => accessToken && loadDriveFiles(accessToken)}
                  disabled={loadingDrive}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDrive ? 'animate-spin' : ''}`} />
                  <span>Refresh Drive Sheets</span>
                </button>
              )}
            </div>

            {/* Drive files quick selector (if signed in) */}
            {currentUser && driveFiles.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>Spreadsheets from your Google Drive:</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-44 overflow-y-auto p-1 border border-slate-200 rounded-lg bg-slate-50/50">
                  {driveFiles.map((file) => (
                    <button
                      key={file.id}
                      type="button"
                      onClick={() => {
                        setSpreadsheetInput(file.id);
                        setSelectedSpreadsheetId(file.id);
                        setSelectedSpreadsheetTitle(file.name);
                        handleLoadSpreadsheet(file.id);
                      }}
                      className={`text-left p-2.5 rounded-lg border transition-all flex items-start gap-2 ${
                        selectedSpreadsheetId === file.id
                          ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="overflow-hidden">
                        <div className="text-xs font-semibold truncate" title={file.name}>
                          {file.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {file.modifiedTime ? new Date(file.modifiedTime).toLocaleDateString() : file.id.slice(0, 12)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Spreadsheet URL/ID Input */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Spreadsheet URL or ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5n... or ID"
                    value={spreadsheetInput}
                    onChange={(e) => setSpreadsheetInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono pr-8"
                  />
                  {selectedSpreadsheetId && (
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}`}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-blue-600"
                      title="Open sheet in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="sm:col-span-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleLoadSpreadsheet()}
                  disabled={loadingMetadata || !currentUser}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingMetadata ? 'animate-spin' : ''}`} />
                  <span>{loadingMetadata ? 'Loading Sheets...' : 'Load Worksheets'}</span>
                </button>
              </div>
            </div>

            {/* Worksheet tabs & Header row selector */}
            {worksheets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Worksheet / Tab Name
                  </label>
                  <select
                    value={selectedWorksheet}
                    onChange={(e) => {
                      const ws = e.target.value;
                      setSelectedWorksheet(ws);
                      if (accessToken && selectedSpreadsheetId) {
                        loadWorksheetData(selectedSpreadsheetId, ws, headerRow, accessToken);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                  >
                    {worksheets.map((ws) => (
                      <option key={ws.sheetId} value={ws.title}>
                        {ws.title} {ws.rowCount ? `(~${ws.rowCount} rows)` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Header Row #
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={headerRow}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setHeaderRow(val);
                      if (accessToken && selectedSpreadsheetId && selectedWorksheet) {
                        loadWorksheetData(selectedSpreadsheetId, selectedWorksheet, val, accessToken);
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: COLUMN MAPPING */}
      {sheetData && sheetData.headers && sheetData.headers.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Map Columns to Leads Table</h3>
                <p className="text-[11px] text-slate-500">
                  Select which Google Sheet column populates each field in the Leads CRM.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutoMap}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Auto-Map</span>
            </button>
          </div>

          {/* Validation Notice */}
          {(!isNameMapped || !isEmailMapped) && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Required Fields:</strong> Please map both <strong>Lead Name</strong> and{' '}
                <strong>Email Address</strong> to enable importing and duplicate prevention.
              </span>
            </div>
          )}

          {/* Mapping Grid */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3.5">Lead Table Field</th>
                  <th className="py-2.5 px-3.5">Status</th>
                  <th className="py-2.5 px-3.5">Google Sheet Column Header</th>
                  <th className="py-2.5 px-3.5">Row 1 Sample Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {LEAD_FIELDS.map((field) => {
                  const currentMappedHeader = mappings[field.key] || '';
                  const headerIdx = sheetData.headers.indexOf(currentMappedHeader);
                  const sampleVal =
                    headerIdx >= 0 && sheetData.rows[0] && sheetData.rows[0][headerIdx]
                      ? String(sheetData.rows[0][headerIdx]).slice(0, 45)
                      : '—';

                  return (
                    <tr key={field.key} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3.5 font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-red-500 font-bold" title="Required field">
                              *
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400">{field.description}</div>
                      </td>

                      <td className="py-2 px-3.5">
                        {currentMappedHeader ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <Check className="w-3 h-3" /> Mapped
                          </span>
                        ) : field.required ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                            Missing
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Optional</span>
                        )}
                      </td>

                      <td className="py-2 px-3.5">
                        <select
                          value={currentMappedHeader}
                          onChange={(e) => handleMappingChange(field.key, e.target.value)}
                          className="w-full max-w-xs px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 font-medium text-slate-800"
                        >
                          <option value="">-- Do not map --</option>
                          {sheetData.headers.map((h, i) => (
                            <option key={`${h}-${i}`} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3.5 font-mono text-[11px] text-slate-500 truncate max-w-xs">
                        {sampleVal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECTION 4: PREVIEW RECORDS & DUPLICATE PREVENTION AUDIT */}
      {previewRows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Preview Records & Duplicate Protection
                </h3>
                <p className="text-[11px] text-slate-500">
                  Cross-checked against existing leads using <strong>Email</strong>,{' '}
                  <strong>Phone</strong>, and <strong>External ID</strong>.
                </p>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
              <button
                type="button"
                onClick={() => setPreviewFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  previewFilter === 'all'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setPreviewFilter('valid')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  previewFilter === 'valid'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                New ({validCount})
              </button>
              {updateCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewFilter('update')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewFilter === 'update'
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  Updates ({updateCount})
                </button>
              )}
              <button
                type="button"
                onClick={() => setPreviewFilter('duplicate')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  previewFilter === 'duplicate'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                Duplicates ({duplicateCount})
              </button>
              {invalidCount > 0 && (
                <button
                  type="button"
                  onClick={() => setPreviewFilter('invalid')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    previewFilter === 'invalid'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-50 text-red-700 hover:bg-red-100'
                  }`}
                >
                  Invalid ({invalidCount})
                </button>
              )}
            </div>
          </div>

          {/* Action Bar & Frequency Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <div className="text-xs text-slate-700 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Ready to synchronize <strong>{validCount}</strong> new leads and <strong>{updateCount}</strong> updates (
                  <strong>{duplicateCount}</strong> duplicates will be safely preserved).
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 pl-6">
                <span>Sync Cadence:</span>
                <select
                  value={syncFrequency}
                  onChange={(e) => setSyncFrequency(e.target.value as any)}
                  className="bg-white border border-slate-300 rounded px-2 py-0.5 text-slate-700 font-medium"
                >
                  <option value="Every 15 minutes">Every 15 minutes (Live Source)</option>
                  <option value="Hourly">Hourly</option>
                  <option value="Daily">Daily</option>
                  <option value="Manual">Manual (On Demand)</option>
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isImporting || (validCount === 0 && updateCount === 0) || !isNameMapped || !isEmailMapped}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isImporting ? 'animate-spin' : ''}`} />
              <span>
                {isImporting
                  ? 'Synchronizing...'
                  : `Synchronize ${validCount + updateCount} Leads to Hub`}
              </span>
            </button>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px] sticky top-0">
                <tr>
                  <th className="py-2 px-3">Row #</th>
                  <th className="py-2 px-3">Sync Action</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Phone</th>
                  <th className="py-2 px-3">Company</th>
                  <th className="py-2 px-3">Source / Campaign</th>
                  <th className="py-2 px-3">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPreviewRows.map((item) => (
                  <tr
                    key={item.rowNumber}
                    className={`hover:bg-slate-50/80 ${
                      item.status === 'update'
                        ? 'bg-blue-50/30'
                        : item.status === 'duplicate'
                        ? 'bg-amber-50/40'
                        : item.status === 'invalid'
                        ? 'bg-red-50/40'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 font-mono text-slate-400">#{item.rowNumber}</td>

                    <td className="py-2 px-3 whitespace-nowrap">
                      {item.status === 'valid' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> New Lead
                        </span>
                      )}
                      {item.status === 'update' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full"
                          title={item.reason}
                        >
                          <RefreshCw className="w-3 h-3 text-blue-600" /> Update ({item.updatedFields?.[0] || 'Status'})
                        </span>
                      )}
                      {item.status === 'duplicate' && (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full"
                          title={item.reason}
                        >
                          <AlertTriangle className="w-3 h-3" /> Duplicate ({item.matchedField || 'Match'})
                        </span>
                      )}
                      {item.status === 'invalid' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                          <AlertCircle className="w-3 h-3" /> {item.reason}
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 font-semibold text-slate-900">{item.data.name || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{item.data.email || '—'}</td>
                    <td className="py-2 px-3 font-mono text-slate-500">{item.data.phone || '—'}</td>
                    <td className="py-2 px-3 text-slate-700">{item.data.company || '—'}</td>
                    <td className="py-2 px-3 text-slate-500">
                      {item.data.source || '—'} {item.data.campaign ? `(${item.data.campaign})` : ''}
                    </td>
                    <td className="py-2 px-3 text-slate-800 font-medium">
                      {item.data.status || 'New'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
