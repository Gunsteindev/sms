/**
 * seed-pool.ts — Populates pool tables with realistic Ghana school swimming pool records.
 *
 * Creates:
 *   • 20 pool sessions (April–May 2026, Mon–Fri school + Sat public)
 *   • 11 rental inventory items (swimsuits, caps, goggles, fins, kickboards)
 *   • ~65 sales/entry transactions linked to sessions
 *
 * Safe to re-run (sessions skipped by name, rentals by name).
 * Run: npm run seed:pool
 */
import dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
import axios from 'axios';

const T   = process.env.AZURE_TENANT_ID!;
const C   = process.env.AZURE_CLIENT_ID!;
const S   = process.env.AZURE_CLIENT_SECRET!;
const D   = process.env.DATAVERSE_URL!;
const API = `${D}/api/data/v9.2`;

async function getToken() {
    return (await axios.post(
        `https://login.microsoftonline.com/${T}/oauth2/v2.0/token`,
        new URLSearchParams({ client_id: C, client_secret: S, scope: `${D}/.default`, grant_type: 'client_credentials' }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 20000 }
    )).data.access_token;
}

// ── Label maps ─────────────────────────────────────────────────────────────────
const MODE_LBL  = ['', 'School', 'Public'];
const SHIFT_LBL = ['', 'Morning', 'Afternoon', 'Full Day'];
const CAT_LBL   = ['', 'Swimsuit', 'Cap', 'Goggles', 'Fins', 'Kickboard', 'Other'];
const TTYPE_LBL = ['', 'Entry Fee', 'Snack', 'Drink', 'Swimwear', 'Rental', 'Other'];
const PAY_LBL   = ['', 'Cash', 'Mobile Money', 'Card'];

// ── Session data ───────────────────────────────────────────────────────────────
// mode:   1=School  2=Public
// shift:  1=Morning  2=Afternoon  3=Full Day
// status: 1=Open  2=Closed

interface SessionSeed {
    name:          string;
    sessiondate:   string;
    mode:          number;
    shift:         number;
    studentscount: number;
    adultscount:   number;
    childrencount: number;
    entrycount:    number;
    entryfee:      number;
    totalrevenue:  number;
    status:        number;
    notes:         string;
}

const SESSIONS: SessionSeed[] = [
    // ── Week 1: 7–12 April 2026 ──────────────────────────────────────────────
    {
        name: 'Session 2026-04-07 AM (School)',
        sessiondate: '2026-04-07', mode: 1, shift: 1,
        studentscount: 35, adultscount: 0, childrencount: 0, entrycount: 35, entryfee: 5,
        totalrevenue: 295, status: 2,
        notes: 'JHS 1A & 1B regular swim session. 2 students absent.',
    },
    {
        name: 'Session 2026-04-08 AM (School)',
        sessiondate: '2026-04-08', mode: 1, shift: 1,
        studentscount: 28, adultscount: 0, childrencount: 0, entrycount: 28, entryfee: 5,
        totalrevenue: 228, status: 2,
        notes: 'JHS 2B swim. Light attendance — mid-week exam prep.',
    },
    {
        name: 'Session 2026-04-09 AM (School)',
        sessiondate: '2026-04-09', mode: 1, shift: 1,
        studentscount: 40, adultscount: 0, childrencount: 0, entrycount: 40, entryfee: 5,
        totalrevenue: 344, status: 2,
        notes: 'JHS 3A & 3B combined. Full attendance.',
    },
    {
        name: 'Session 2026-04-10 AM (School)',
        sessiondate: '2026-04-10', mode: 1, shift: 1,
        studentscount: 32, adultscount: 0, childrencount: 0, entrycount: 32, entryfee: 5,
        totalrevenue: 264, status: 2,
        notes: 'Basic 6 swim day.',
    },
    {
        name: 'Session 2026-04-11 AM (School)',
        sessiondate: '2026-04-11', mode: 1, shift: 1,
        studentscount: 38, adultscount: 0, childrencount: 0, entrycount: 38, entryfee: 5,
        totalrevenue: 318, status: 2,
        notes: 'Friday session — high attendance. Parents collected children after swimming.',
    },
    {
        name: 'Session 2026-04-12 PM (Public)',
        sessiondate: '2026-04-12', mode: 2, shift: 2,
        studentscount: 0, adultscount: 14, childrencount: 10, entrycount: 24, entryfee: 15,
        totalrevenue: 472, status: 2,
        notes: 'Saturday public session. Adults GHS 15, children GHS 8. 2 lifejacket rentals.',
    },

    // ── Week 2: 14–19 April 2026 ─────────────────────────────────────────────
    {
        name: 'Session 2026-04-14 AM (School)',
        sessiondate: '2026-04-14', mode: 1, shift: 1,
        studentscount: 30, adultscount: 0, childrencount: 0, entrycount: 30, entryfee: 5,
        totalrevenue: 244, status: 2,
        notes: 'Basic 5A & 5B. Beginners lane in use.',
    },
    {
        name: 'Session 2026-04-15 AM (School)',
        sessiondate: '2026-04-15', mode: 1, shift: 1,
        studentscount: 35, adultscount: 0, childrencount: 0, entrycount: 35, entryfee: 5,
        totalrevenue: 290, status: 2,
        notes: 'JHS 1A swim. Staff meeting cut session 15 min short.',
    },
    {
        name: 'Session 2026-04-16 AM (School)',
        sessiondate: '2026-04-16', mode: 1, shift: 1,
        studentscount: 42, adultscount: 0, childrencount: 0, entrycount: 42, entryfee: 5,
        totalrevenue: 354, status: 2,
        notes: 'JHS 2A & 2B combined. Full turnout.',
    },
    {
        name: 'Session 2026-04-17 AM (School)',
        sessiondate: '2026-04-17', mode: 1, shift: 1,
        studentscount: 29, adultscount: 0, childrencount: 0, entrycount: 29, entryfee: 5,
        totalrevenue: 230, status: 2,
        notes: 'Basic 4 & 5 mixed session.',
    },
    {
        name: 'Session 2026-04-18 AM (School)',
        sessiondate: '2026-04-18', mode: 1, shift: 1,
        studentscount: 36, adultscount: 0, childrencount: 0, entrycount: 36, entryfee: 5,
        totalrevenue: 302, status: 2,
        notes: 'Friday — parent observers present.',
    },
    {
        name: 'Session 2026-04-19 FD (Public)',
        sessiondate: '2026-04-19', mode: 2, shift: 3,
        studentscount: 0, adultscount: 18, childrencount: 15, entrycount: 33, entryfee: 15,
        totalrevenue: 638, status: 2,
        notes: 'Saturday full-day public session. Excellent turnout. Lane rental for group lesson 10:00–12:00.',
    },

    // ── Week 3: 22–26 April 2026 (Easter – reduced) ──────────────────────────
    {
        name: 'Session 2026-04-22 AM (School)',
        sessiondate: '2026-04-22', mode: 1, shift: 1,
        studentscount: 22, adultscount: 0, childrencount: 0, entrycount: 22, entryfee: 5,
        totalrevenue: 178, status: 2,
        notes: 'Reduced attendance — Easter holiday period. Only JHS 3 present.',
    },
    {
        name: 'Session 2026-04-26 PM (Public)',
        sessiondate: '2026-04-26', mode: 2, shift: 2,
        studentscount: 0, adultscount: 22, childrencount: 18, entrycount: 40, entryfee: 15,
        totalrevenue: 672, status: 2,
        notes: 'Post-Easter Saturday — best public attendance so far this term. Snack bar very busy.',
    },

    // ── Week 4: 28 April – 2 May 2026 ────────────────────────────────────────
    {
        name: 'Session 2026-04-28 AM (School)',
        sessiondate: '2026-04-28', mode: 1, shift: 1,
        studentscount: 38, adultscount: 0, childrencount: 0, entrycount: 38, entryfee: 5,
        totalrevenue: 316, status: 2,
        notes: 'Resumption week. Full JHS 1A & 2B.',
    },
    {
        name: 'Session 2026-04-29 AM (School)',
        sessiondate: '2026-04-29', mode: 1, shift: 1,
        studentscount: 31, adultscount: 0, childrencount: 0, entrycount: 31, entryfee: 5,
        totalrevenue: 254, status: 2,
        notes: 'Basic 6 final session before end-of-term exams.',
    },
    {
        name: 'Session 2026-04-30 AM (School)',
        sessiondate: '2026-04-30', mode: 1, shift: 1,
        studentscount: 45, adultscount: 0, childrencount: 0, entrycount: 45, entryfee: 5,
        totalrevenue: 378, status: 2,
        notes: 'Largest school session of the term. JHS 3 farewell swim.',
    },
    {
        name: 'Session 2026-05-02 AM (School)',
        sessiondate: '2026-05-02', mode: 1, shift: 1,
        studentscount: 40, adultscount: 0, childrencount: 0, entrycount: 40, entryfee: 5,
        totalrevenue: 340, status: 2,
        notes: 'Friday. Labour Day holiday was Thursday; school resumed Friday.',
    },

    // ── Week 5: 5–6 May 2026 (current week) ──────────────────────────────────
    {
        name: 'Session 2026-05-05 AM (School)',
        sessiondate: '2026-05-05', mode: 1, shift: 1,
        studentscount: 36, adultscount: 0, childrencount: 0, entrycount: 36, entryfee: 5,
        totalrevenue: 300, status: 2,
        notes: 'Monday session. Pool chemicals replenished over weekend.',
    },
    {
        name: 'Session 2026-05-06 AM (School)',
        sessiondate: '2026-05-06', mode: 1, shift: 1,
        studentscount: 33, adultscount: 0, childrencount: 0, entrycount: 33, entryfee: 5,
        totalrevenue: 165, status: 1,  // Open (today)
        notes: 'Today\'s session — ongoing.',
    },
];

// ── Rental inventory ───────────────────────────────────────────────────────────
// category: 1=Swimsuit  2=Cap  3=Goggles  4=Fins  5=Kickboard  6=Other

interface RentalSeed {
    name:       string;
    category:   number;
    size:       string;
    totalqty:   number;
    available:  number;
    inuse:      number;
    cleaning:   number;
    damaged:    number;
    rentalfee:  number;
    depositfee: number;
}

const RENTALS: RentalSeed[] = [
    { name: 'Swimsuit Adult S',      category: 1, size: 'S',  totalqty: 10, available: 7, inuse: 2, cleaning: 1, damaged: 0, rentalfee: 5,  depositfee: 20 },
    { name: 'Swimsuit Adult M',      category: 1, size: 'M',  totalqty: 12, available: 8, inuse: 3, cleaning: 0, damaged: 1, rentalfee: 5,  depositfee: 20 },
    { name: 'Swimsuit Adult L',      category: 1, size: 'L',  totalqty:  8, available: 6, inuse: 2, cleaning: 0, damaged: 0, rentalfee: 5,  depositfee: 20 },
    { name: 'Swimsuit Junior S',     category: 1, size: 'JS', totalqty: 15, available:10, inuse: 4, cleaning: 1, damaged: 0, rentalfee: 3,  depositfee: 15 },
    { name: 'Swimsuit Junior M',     category: 1, size: 'JM', totalqty: 15, available:11, inuse: 3, cleaning: 0, damaged: 1, rentalfee: 3,  depositfee: 15 },
    { name: 'Swimming Cap Adult',    category: 2, size: 'One size', totalqty: 20, available:15, inuse: 4, cleaning: 1, damaged: 0, rentalfee: 2,  depositfee: 10 },
    { name: 'Swimming Cap Junior',   category: 2, size: 'Junior',   totalqty: 20, available:16, inuse: 4, cleaning: 0, damaged: 0, rentalfee: 2,  depositfee: 10 },
    { name: 'Goggles Adult',         category: 3, size: 'One size', totalqty: 15, available:10, inuse: 4, cleaning: 0, damaged: 1, rentalfee: 3,  depositfee: 15 },
    { name: 'Goggles Junior',        category: 3, size: 'Junior',   totalqty: 15, available:11, inuse: 3, cleaning: 1, damaged: 0, rentalfee: 3,  depositfee: 15 },
    { name: 'Fins Adult M',          category: 4, size: 'M',  totalqty: 10, available: 7, inuse: 3, cleaning: 0, damaged: 0, rentalfee: 5,  depositfee: 25 },
    { name: 'Kickboard Standard',    category: 5, size: 'Std',totalqty:  8, available: 5, inuse: 2, cleaning: 1, damaged: 0, rentalfee: 3,  depositfee: 10 },
];

// ── Transactions ───────────────────────────────────────────────────────────────
// transtype:     1=Entry Fee  2=Snack  3=Drink  4=Swimwear  5=Rental  6=Other
// paymentmethod: 1=Cash  2=Mobile Money  3=Card

interface TxSeed {
    sessionName:   string;  // matches session name — used to look up session ID
    transdate:     string;
    transtype:     number;
    itemname:      string;
    quantity:      number;
    unitprice:     number;
    customername:  string;
    paymentmethod: number;
    notes:         string;
}

const TRANSACTIONS: TxSeed[] = [
    // ── Apr 7 – School Morning ──────────────────────────────────────────────────
    { sessionName:'Session 2026-04-07 AM (School)', transdate:'2026-04-07', transtype:1, itemname:'Student Entry Fee', quantity:35, unitprice:5,   customername:'JHS 1A & 1B',       paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-07 AM (School)', transdate:'2026-04-07', transtype:3, itemname:'Fan Ice',            quantity:20, unitprice:2,   customername:'',                   paymentmethod:1, notes:'After-swim cool-down' },
    { sessionName:'Session 2026-04-07 AM (School)', transdate:'2026-04-07', transtype:2, itemname:'Butter Bread',       quantity:15, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 8 ─────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-08 AM (School)', transdate:'2026-04-08', transtype:1, itemname:'Student Entry Fee',  quantity:28, unitprice:5,   customername:'JHS 2B',             paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-08 AM (School)', transdate:'2026-04-08', transtype:3, itemname:'Mineral Water 500ml',quantity:12, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-08 AM (School)', transdate:'2026-04-08', transtype:2, itemname:'Biscuits (Cabin)',   quantity:10, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 9 ─────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-09 AM (School)', transdate:'2026-04-09', transtype:1, itemname:'Student Entry Fee',  quantity:40, unitprice:5,   customername:'JHS 3A & 3B',        paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-09 AM (School)', transdate:'2026-04-09', transtype:3, itemname:'Fanta Orange 330ml', quantity:18, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-09 AM (School)', transdate:'2026-04-09', transtype:2, itemname:'Fan Yogo',           quantity:20, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-09 AM (School)', transdate:'2026-04-09', transtype:5, itemname:'Goggles Rental',     quantity: 4, unitprice:3,   customername:'Various',            paymentmethod:1, notes:'4 pairs rented by JHS 3A' },

    // ── Apr 10 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-10 AM (School)', transdate:'2026-04-10', transtype:1, itemname:'Student Entry Fee',  quantity:32, unitprice:5,   customername:'Basic 6',            paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-10 AM (School)', transdate:'2026-04-10', transtype:3, itemname:'Coca-Cola 330ml',    quantity:14, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-10 AM (School)', transdate:'2026-04-10', transtype:2, itemname:'Meat Pie',           quantity:10, unitprice:5,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 11 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-11 AM (School)', transdate:'2026-04-11', transtype:1, itemname:'Student Entry Fee',  quantity:38, unitprice:5,   customername:'JHS Mixed',          paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-11 AM (School)', transdate:'2026-04-11', transtype:3, itemname:'Fan Ice',            quantity:25, unitprice:2,   customername:'',                   paymentmethod:1, notes:'Busy Friday' },
    { sessionName:'Session 2026-04-11 AM (School)', transdate:'2026-04-11', transtype:2, itemname:'Biscuits (Cabin)',   quantity:18, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-11 AM (School)', transdate:'2026-04-11', transtype:4, itemname:'Swimsuit Junior M',  quantity: 2, unitprice:35,  customername:'Parent purchase',    paymentmethod:2, notes:'Mobile Money — MTN' },

    // ── Apr 12 – Public Saturday ──────────────────────────────────────────────
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:1, itemname:'Adult Entry Fee',    quantity:14, unitprice:15,  customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:1, itemname:'Child Entry Fee',    quantity:10, unitprice:8,   customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:3, itemname:'Mineral Water 500ml',quantity:20, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:2, itemname:'Meat Pie',           quantity:12, unitprice:5,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:5, itemname:'Swimsuit Rental Adult M', quantity:3, unitprice:5, customername:'Various',          paymentmethod:1, notes:'3 adult swimsuit rentals' },
    { sessionName:'Session 2026-04-12 PM (Public)', transdate:'2026-04-12', transtype:3, itemname:'Fanta Orange 330ml', quantity:15, unitprice:4,   customername:'',                   paymentmethod:2, notes:'MoMo — Vodafone Cash' },

    // ── Apr 14 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-14 AM (School)', transdate:'2026-04-14', transtype:1, itemname:'Student Entry Fee',  quantity:30, unitprice:5,   customername:'Basic 5A & 5B',      paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-14 AM (School)', transdate:'2026-04-14', transtype:3, itemname:'Fan Ice',            quantity:16, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-14 AM (School)', transdate:'2026-04-14', transtype:2, itemname:'Butter Bread',       quantity:12, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 15 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-15 AM (School)', transdate:'2026-04-15', transtype:1, itemname:'Student Entry Fee',  quantity:35, unitprice:5,   customername:'JHS 1A',             paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-15 AM (School)', transdate:'2026-04-15', transtype:3, itemname:'Coca-Cola 330ml',    quantity:12, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-15 AM (School)', transdate:'2026-04-15', transtype:2, itemname:'Fan Yogo',           quantity:15, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 16 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-16 AM (School)', transdate:'2026-04-16', transtype:1, itemname:'Student Entry Fee',  quantity:42, unitprice:5,   customername:'JHS 2A & 2B',        paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-16 AM (School)', transdate:'2026-04-16', transtype:3, itemname:'Mineral Water 500ml',quantity:22, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-16 AM (School)', transdate:'2026-04-16', transtype:2, itemname:'Meat Pie',           quantity:14, unitprice:5,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-16 AM (School)', transdate:'2026-04-16', transtype:5, itemname:'Kickboard Rental',   quantity: 5, unitprice:3,   customername:'JHS 2B beginners',   paymentmethod:1, notes:'' },

    // ── Apr 17 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-17 AM (School)', transdate:'2026-04-17', transtype:1, itemname:'Student Entry Fee',  quantity:29, unitprice:5,   customername:'Basic 4 & 5',        paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-17 AM (School)', transdate:'2026-04-17', transtype:3, itemname:'Fan Ice',            quantity:14, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 18 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-18 AM (School)', transdate:'2026-04-18', transtype:1, itemname:'Student Entry Fee',  quantity:36, unitprice:5,   customername:'JHS Mixed',          paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-18 AM (School)', transdate:'2026-04-18', transtype:3, itemname:'Fanta Orange 330ml', quantity:16, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-18 AM (School)', transdate:'2026-04-18', transtype:2, itemname:'Biscuits (Cabin)',   quantity:14, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 19 – Public Full Day ──────────────────────────────────────────────
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:1, itemname:'Adult Entry Fee',    quantity:18, unitprice:15,  customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:1, itemname:'Child Entry Fee',    quantity:15, unitprice:8,   customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:3, itemname:'Mineral Water 500ml',quantity:30, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:2, itemname:'Meat Pie',           quantity:18, unitprice:5,   customername:'',                   paymentmethod:1, notes:'Snack bar peak hour 11–12' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:3, itemname:'Coca-Cola 330ml',    quantity:20, unitprice:4,   customername:'',                   paymentmethod:2, notes:'MoMo payment' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:5, itemname:'Swimsuit Rental Adult L', quantity:2, unitprice:5, customername:'Walk-in guests',   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:5, itemname:'Goggles Rental',     quantity: 4, unitprice:3,   customername:'Various',            paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-19 FD (Public)', transdate:'2026-04-19', transtype:4, itemname:'Swimming Cap Junior', quantity:3, unitprice:18,  customername:'Parent purchase',    paymentmethod:3, notes:'Card payment' },

    // ── Apr 22 – Reduced (Easter) ─────────────────────────────────────────────
    { sessionName:'Session 2026-04-22 AM (School)', transdate:'2026-04-22', transtype:1, itemname:'Student Entry Fee',  quantity:22, unitprice:5,   customername:'JHS 3 only',         paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-22 AM (School)', transdate:'2026-04-22', transtype:3, itemname:'Fan Ice',            quantity:10, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 26 – Public Saturday ──────────────────────────────────────────────
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:1, itemname:'Adult Entry Fee',    quantity:22, unitprice:15,  customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:1, itemname:'Child Entry Fee',    quantity:18, unitprice:8,   customername:'General Public',     paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:3, itemname:'Mineral Water 500ml',quantity:28, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:2, itemname:'Fan Yogo',           quantity:22, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:2, itemname:'Meat Pie',           quantity:15, unitprice:5,   customername:'',                   paymentmethod:2, notes:'Busy post-Easter Saturday' },
    { sessionName:'Session 2026-04-26 PM (Public)', transdate:'2026-04-26', transtype:5, itemname:'Swimsuit Rental Junior S', quantity:4, unitprice:3, customername:'Various',        paymentmethod:1, notes:'' },

    // ── Apr 28 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-28 AM (School)', transdate:'2026-04-28', transtype:1, itemname:'Student Entry Fee',  quantity:38, unitprice:5,   customername:'JHS 1A & 2B',        paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-28 AM (School)', transdate:'2026-04-28', transtype:3, itemname:'Fanta Orange 330ml', quantity:16, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-28 AM (School)', transdate:'2026-04-28', transtype:2, itemname:'Butter Bread',       quantity:14, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 29 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-29 AM (School)', transdate:'2026-04-29', transtype:1, itemname:'Student Entry Fee',  quantity:31, unitprice:5,   customername:'Basic 6',            paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-29 AM (School)', transdate:'2026-04-29', transtype:3, itemname:'Coca-Cola 330ml',    quantity:13, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },

    // ── Apr 30 ────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-04-30 AM (School)', transdate:'2026-04-30', transtype:1, itemname:'Student Entry Fee',  quantity:45, unitprice:5,   customername:'JHS 3 Farewell',     paymentmethod:1, notes:'Last regular session for JHS 3' },
    { sessionName:'Session 2026-04-30 AM (School)', transdate:'2026-04-30', transtype:3, itemname:'Mineral Water 500ml',quantity:24, unitprice:3,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-04-30 AM (School)', transdate:'2026-04-30', transtype:2, itemname:'Meat Pie',           quantity:18, unitprice:5,   customername:'',                   paymentmethod:1, notes:'JHS 3 farewell treats' },
    { sessionName:'Session 2026-04-30 AM (School)', transdate:'2026-04-30', transtype:4, itemname:'Swimsuit Junior M',  quantity: 3, unitprice:35,  customername:'JHS 3 students',     paymentmethod:2, notes:'End-of-year purchase — MoMo' },

    // ── May 2 ─────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-05-02 AM (School)', transdate:'2026-05-02', transtype:1, itemname:'Student Entry Fee',  quantity:40, unitprice:5,   customername:'JHS Mixed',          paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-05-02 AM (School)', transdate:'2026-05-02', transtype:3, itemname:'Fan Ice',            quantity:20, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-05-02 AM (School)', transdate:'2026-05-02', transtype:2, itemname:'Biscuits (Cabin)',   quantity:16, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },

    // ── May 5 ─────────────────────────────────────────────────────────────────
    { sessionName:'Session 2026-05-05 AM (School)', transdate:'2026-05-05', transtype:1, itemname:'Student Entry Fee',  quantity:36, unitprice:5,   customername:'JHS 1A & 2A',        paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-05-05 AM (School)', transdate:'2026-05-05', transtype:3, itemname:'Fanta Orange 330ml', quantity:14, unitprice:4,   customername:'',                   paymentmethod:1, notes:'' },
    { sessionName:'Session 2026-05-05 AM (School)', transdate:'2026-05-05', transtype:5, itemname:'Kickboard Rental',   quantity: 3, unitprice:3,   customername:'JHS 1A beginners',   paymentmethod:1, notes:'' },

    // ── May 6 (today – Open) ──────────────────────────────────────────────────
    { sessionName:'Session 2026-05-06 AM (School)', transdate:'2026-05-06', transtype:1, itemname:'Student Entry Fee',  quantity:33, unitprice:5,   customername:'JHS 2A & 2B',        paymentmethod:1, notes:'Session still open' },
    { sessionName:'Session 2026-05-06 AM (School)', transdate:'2026-05-06', transtype:3, itemname:'Fan Ice',            quantity:12, unitprice:2,   customername:'',                   paymentmethod:1, notes:'' },
];

// ── Seed helpers ──────────────────────────────────────────────────────────────
type Headers = Record<string, string>;

async function seedSessions(h: Headers, ph: Headers): Promise<Map<string, string>> {
    console.log('\n── Pool Sessions ────────────────────────────────────');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_poolsessions?$select=sms_poolsessionid,sms_name`,
        { headers: h, timeout: 30000 }
    );
    const existingMap = new Map<string, string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => [
            (r.sms_name ?? '').toLowerCase(),
            r.sms_poolsessionid as string,
        ])
    );
    console.log(`  ${existingMap.size} existing session(s) — skipping duplicates\n`);

    const sessionIdMap = new Map<string, string>(); // name → ID
    // Pre-populate from existing
    for (const [name, id] of existingMap) sessionIdMap.set(name, id);

    let created = 0, skipped = 0;
    for (const s of SESSIONS) {
        const key = s.name.toLowerCase();
        if (existingMap.has(key)) {
            console.log(`  [SKIP] ${s.sessiondate}  ${MODE_LBL[s.mode].padEnd(7)}  ${SHIFT_LBL[s.shift]}`);
            skipped++; continue;
        }
        const payload = {
            sms_name:          s.name,
            sms_sessiondate:   s.sessiondate,
            sms_mode:          s.mode,
            sms_shift:         s.shift,
            sms_studentscount: s.studentscount,
            sms_adultscount:   s.adultscount,
            sms_childrencount: s.childrencount,
            sms_entrycount:    s.entrycount,
            sms_entryfee:      s.entryfee,
            sms_totalrevenue:  s.totalrevenue,
            sms_status:        s.status,
            sms_notes:         s.notes,
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const res = await axios.post<any>(`${API}/sms_poolsessions`, payload, { headers: ph, timeout: 30000 });
        const newId: string = res.data.sms_poolsessionid;
        sessionIdMap.set(key, newId);
        const statusLbl = s.status === 1 ? '🟢 Open' : '✓ Closed';
        console.log(`  [OK]   ${s.sessiondate}  ${MODE_LBL[s.mode].padEnd(7)}  ${SHIFT_LBL[s.shift].padEnd(12)}  ${s.entrycount.toString().padStart(3)} entries  GHS ${s.totalrevenue.toFixed(2)}  ${statusLbl}`);
        created++;
    }
    console.log(`\n  Sessions: ${created} created, ${skipped} skipped`);
    return sessionIdMap;
}

async function seedRentals(h: Headers, ph: Headers): Promise<void> {
    console.log('\n── Pool Rentals (Equipment Inventory) ───────────────');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_poolrentals?$select=sms_poolrentalid,sms_name`,
        { headers: h, timeout: 30000 }
    );
    const existingNames = new Set<string>(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (existing.data.value ?? []).map((r: any) => (r.sms_name ?? '').toLowerCase())
    );
    console.log(`  ${existingNames.size} existing rental item(s) — skipping duplicates\n`);

    let created = 0, skipped = 0;
    for (const r of RENTALS) {
        if (existingNames.has(r.name.toLowerCase())) {
            console.log(`  [SKIP] ${r.name}`);
            skipped++; continue;
        }
        const payload = {
            sms_name:       r.name,
            sms_category:   r.category,
            sms_size:       r.size,
            sms_totalqty:   r.totalqty,
            sms_available:  r.available,
            sms_inuse:      r.inuse,
            sms_cleaning:   r.cleaning,
            sms_damaged:    r.damaged,
            sms_rentalfee:  r.rentalfee,
            sms_depositfee: r.depositfee,
        };
        await axios.post(`${API}/sms_poolrentals`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${CAT_LBL[r.category].padEnd(10)}  ${r.size.padEnd(8)}  ${r.name}  (${r.available}/${r.totalqty} available)  GHS ${r.rentalfee}/session`);
        created++;
    }
    console.log(`\n  Rentals: ${created} created, ${skipped} skipped`);
}

async function seedTransactions(h: Headers, ph: Headers, sessionIdMap: Map<string, string>): Promise<void> {
    console.log('\n── Pool Transactions ────────────────────────────────');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await axios.get<any>(
        `${API}/sms_pooltransactions?$select=sms_pooltransactionid,sms_name`,
        { headers: h, timeout: 30000 }
    );
    const existingCount = (existing.data.value ?? []).length;
    console.log(`  ${existingCount} existing transaction(s)\n`);

    // Skip all if already seeded (use count-based guard — transactions don't have a natural unique key)
    if (existingCount >= TRANSACTIONS.length) {
        console.log('  Transactions already seeded — skipping all.');
        return;
    }

    let created = 0;
    for (const tx of TRANSACTIONS) {
        const sessionId = sessionIdMap.get(tx.sessionName.toLowerCase()) ?? '';
        const total = parseFloat((tx.quantity * tx.unitprice).toFixed(2));
        const txName = `${tx.transdate} – ${TTYPE_LBL[tx.transtype]}: ${tx.itemname}`;
        const payload = {
            sms_name:          txName,
            sms_transdate:     tx.transdate,
            sms_sessionref:    sessionId,
            sms_transtype:     tx.transtype,
            sms_itemname:      tx.itemname,
            sms_quantity:      tx.quantity,
            sms_unitprice:     tx.unitprice,
            sms_totalamount:   total,
            sms_customername:  tx.customername,
            sms_paymentmethod: tx.paymentmethod,
            sms_notes:         tx.notes,
        };
        await axios.post(`${API}/sms_pooltransactions`, payload, { headers: ph, timeout: 30000 });
        console.log(`  [OK]   ${tx.transdate}  ${TTYPE_LBL[tx.transtype].padEnd(12)}  ${tx.itemname.padEnd(25)}  ×${tx.quantity.toString().padStart(3)}  @ GHS ${tx.unitprice}  = GHS ${total.toFixed(2)}  ${PAY_LBL[tx.paymentmethod]}`);
        created++;
    }
    console.log(`\n  Transactions: ${created} created`);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
    if (!T || !C || !S || !D) { console.error('Missing env vars. Check .env.local'); process.exit(1); }

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  Seed: Swimming Pool (sessions · rentals · transactions)');
    console.log('══════════════════════════════════════════════════════════\n');

    const tok = await getToken();
    const h: Headers  = { Authorization: `Bearer ${tok}`, Accept: 'application/json', 'OData-MaxVersion': '4.0', 'OData-Version': '4.0' };
    const ph: Headers = { ...h, 'Content-Type': 'application/json', Prefer: 'return=representation' };

    const sessionIdMap = await seedSessions(h, ph);
    await seedRentals(h, ph);
    await seedTransactions(h, ph, sessionIdMap);

    // ── Summary ──────────────────────────────────────────────────────────────
    const schoolSessions  = SESSIONS.filter(s => s.mode === 1);
    const publicSessions  = SESSIONS.filter(s => s.mode === 2);
    const totalEntries    = SESSIONS.reduce((a, s) => a + s.entrycount, 0);
    const totalRevEstimate= SESSIONS.reduce((a, s) => a + s.totalrevenue, 0);
    const totalTxAmount   = TRANSACTIONS.reduce((a, t) => a + t.quantity * t.unitprice, 0);

    console.log('\n══════════════════════════════════════════════════════════');
    console.log('  Summary');
    console.log('══════════════════════════════════════════════════════════');
    console.log(`  Sessions      : ${SESSIONS.length} total (${schoolSessions.length} school · ${publicSessions.length} public)`);
    console.log(`  Open today    : 1 (May 6 morning)`);
    console.log(`  Total entries : ${totalEntries} swimmers across all sessions`);
    console.log(`  Session revenue (est.): GHS ${totalRevEstimate.toFixed(2)}`);
    console.log(`  Rental items  : ${RENTALS.length} equipment lines`);
    console.log(`  Transactions  : ${TRANSACTIONS.length} (GHS ${totalTxAmount.toFixed(2)} total)`);
    console.log('');
}

main().catch((e: unknown) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console.error((e as any)?.response?.data?.error?.message ?? (e as Error).message);
    process.exit(1);
});
