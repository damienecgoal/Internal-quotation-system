export type ChargeBasis = "unit" | "month" | "week" | "one_off";
export type PricingType = "calculated" | "rate_only" | "included";

export type ItemCells = {
  quantity?: string;
  unit?: string;
  price?: string;
  amount: string;
  code: string;
  quantityIsLabel: boolean;
};

export type CatalogCategory = {
  id: string;
  code: string;
  name: string;
  description: string;
  productLine: string;
  sortOrder: number;
  subtotalCell: string;
};

export type CatalogItem = {
  id: string;
  categoryId: string;
  displayCode: string;
  name: string;
  chargeBasis: ChargeBasis;
  unitLabel: string;
  unitPrice: number;
  pricingType: PricingType;
  notes: string[];
  group: string;
  quantityLocked: boolean;
  quantityLabel: string;
  sampleQuantity: number;
  writesCode: boolean;
  cells: ItemCells;
  sortOrder: number;
};

export const CATEGORIES: CatalogCategory[] = [
  {
    id: "A",
    code: "A",
    name: "Centralized Management Platform (CMP)",
    description: "A centralized management platform use to monitor all IoT systems and devices",
    productLine: "Ranger Centralized Management Platform (CITF PA Product code: PA25-153)",
    sortOrder: 1,
    subtotalCell: "K58",
  },
  {
    id: "B",
    code: "B",
    name: "Digitalized Tracking System",
    description: "Real-time on-line QR code tracking of all site plants, powered tools and ladders up-to-date status",
    productLine: "Ranger Digitalised Tracking System (CITF PA Product code: PA26-024)",
    sortOrder: 2,
    subtotalCell: "K74",
  },
  {
    id: "C",
    code: "C",
    name: "Digitalized permit-to-work system (ePTW)",
    description:
      "System use to facilitate on-line real-time application, issuance and tracking of permit-to-work to move and operate for high risk activities",
    productLine: "Ranger Permit To Work System (CITF PA Product code: PA25-154)",
    sortOrder: 3,
    subtotalCell: "K93",
  },
  {
    id: "D",
    code: "D",
    name: "Electronic lock and key system (E-Lock)",
    description: "Hazardous areas access control by electronic lock and key system",
    productLine: "Ranger Electronic Lock and Key System (CITF PA Product code: PA25-155)",
    sortOrder: 4,
    subtotalCell: "K115",
  },
  {
    id: "E",
    code: "E",
    name: "Unsafe Acts / Dangerous situation alert - Mobile plant",
    description: "Automated warning system on all mobile cranes operating on site to alert plant operator",
    productLine: "",
    sortOrder: 5,
    subtotalCell: "K130",
  },
  {
    id: "F",
    code: "F",
    name: "Unsafe Acts / Dangerous situation alert - Tower crane",
    description:
      "An automated warning system on tower cranes to alert tower crane operator and any site personnel encroaching upon the tower crane lifting zone",
    productLine: "",
    sortOrder: 6,
    subtotalCell: "K155",
  },
  {
    id: "G",
    code: "G",
    name: "Smart monitoring devices for workers and frontline site personnel - watch",
    description: "Real-time monitoring of workers' safety and location with CMP integration for centralized reporting.",
    productLine: "Ranger Smart Watch (CITF PA Product code: PA25-156)",
    sortOrder: 7,
    subtotalCell: "K175",
  },
  {
    id: "H",
    code: "H",
    name: "Safety Monitoring System using Artificial Intelligence",
    description:
      "Uses AI cameras and cloud analytics to detect unsafe acts in real time and send instant alerts via the CMP dashboard and speaker system.",
    productLine: "Ranger AI-Powered Safety Monitoring System (CITF PA Product code: PA26-004)",
    sortOrder: 8,
    subtotalCell: "K191",
  },
  {
    id: "I",
    code: "I",
    name: "Confined Spaces Monitoring System",
    description: "Monitor the locations defined as confined spaces on the site",
    productLine: "Ranger Confined Space Monitoring System (CITF PA Product code: PA26-025)",
    sortOrder: 9,
    subtotalCell: "K207",
  },
  {
    id: "J",
    code: "J",
    name: "Smart Monitoring System for Scaffolding Putlog",
    description: "Uses IoT sensors to continuously monitor scaffolding stability",
    productLine: "",
    sortOrder: 10,
    subtotalCell: "K222",
  },
  {
    id: "K",
    code: "K",
    name: "Smart fire and smoke detection system",
    description: "Uses IoT senser to detect and warn of fire hazards early on construction sites and outdoor aera",
    productLine: "",
    sortOrder: 11,
    subtotalCell: "K237",
  },
  {
    id: "L",
    code: "L",
    name: "Safety Training with VR Technology",
    description: "",
    productLine: "",
    sortOrder: 12,
    subtotalCell: "K255",
  },
];

type Draft = {
  id: string;
  code: string;
  name: string;
  basis: ChargeBasis;
  unitLabel?: string;
  price: number;
  pricing?: PricingType;
  qty?: number;
  notes?: string[];
  group?: string;
  locked?: boolean;
  label?: string;
  row: number;
  codeRow?: number;
  stampCode?: boolean;
  skipPrice?: boolean;
};

function build(categoryId: string, drafts: Draft[]): CatalogItem[] {
  return drafts.map((draft, index) => {
    const locked = draft.locked ?? false;
    const code = draft.code;
    return {
      id: draft.id,
      categoryId,
      displayCode: code,
      name: draft.name,
      chargeBasis: draft.basis,
      unitLabel: draft.unitLabel ?? "",
      unitPrice: draft.price,
      pricingType: draft.pricing ?? "calculated",
      notes: draft.notes ?? [],
      group: draft.group ?? "",
      quantityLocked: locked,
      quantityLabel: draft.label ?? "",
      sampleQuantity: locked ? 0 : (draft.qty ?? 0),
      writesCode: draft.stampCode !== false && code !== "",
      sortOrder: index + 1,
      cells: {
        quantity: locked ? undefined : `F${draft.row}`,
        unit: locked ? undefined : `G${draft.row}`,
        price: draft.skipPrice ? undefined : `I${draft.row}`,
        amount: `K${draft.row}`,
        code: `B${draft.codeRow ?? draft.row}`,
        quantityIsLabel: locked,
      },
    };
  });
}

const LIFT =
  "lifting operations by tower cranes, mobile cranes, crawlercranes, or cranes alike or lifting operation by mechanical\nmeans";

export const ITEMS: CatalogItem[] = [
  ...build("A", [
    {
      id: "a1",
      code: "A1",
      name: "One-time platform setup fee",
      basis: "unit",
      unitLabel: "unit",
      price: 20000,
      qty: 1,
      row: 44,
      notes: [
        "Login user Setup",
        "Dashboard available",
        "User access right to different data sets shall be set individually",
      ],
    },
    {
      id: "a2",
      code: "A2",
      name: "SSSS Implementation Plan - 1st time submission & 4S Labelling Service",
      basis: "one_off",
      unitLabel: "time",
      price: 20000,
      qty: 1,
      row: 49,
    },
    {
      id: "a3",
      code: "A3",
      name: "Monthly report on implementation of SSSS components",
      basis: "month",
      unitLabel: "month(s)",
      price: 0,
      pricing: "included",
      skipPrice: true,
      qty: 39,
      row: 51,
    },
    {
      id: "a4",
      code: "A4",
      name: "On-site Support (Optional)",
      basis: "unit",
      price: 25000,
      pricing: "rate_only",
      locked: true,
      label: "Per man-day",
      row: 53,
      notes: ["Full time Site Systems Specialist"],
    },
    {
      id: "a5",
      code: "A5",
      name: "Extra Storage",
      basis: "month",
      price: 1000,
      pricing: "rate_only",
      locked: true,
      label: "Per 1TB Per Month",
      row: 56,
    },
  ]),
  ...build("B", [
    {
      id: "b1",
      code: "B1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 65,
      notes: [
        "System initialization and cloud configuration",
        "Customized user manual and training materials",
        "Interactive dashboard deployment",
        "Cloud storage allocation for the first year",
        "User account setup and data-field configuration",
      ],
    },
    {
      id: "b2",
      code: "B2",
      name: "QR Code Printer (Optional)",
      basis: "unit",
      unitLabel: "set(s)",
      price: 10000,
      pricing: "rate_only",
      qty: 1,
      row: 72,
    },
  ]),
  ...build("C", [
    {
      id: "c1",
      code: "C1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 12000,
      qty: 1,
      row: 80,
      notes: [
        "Covers Basic Forms",
        "Work in confined spaces",
        "Work with electrical hazard",
        "Work in lift shaft",
        "Mobile crane, heavy machinery and piling rig operating or moving on the Site",
        "Hot work",
        "Use of ladder for work above ground for work purpose",
        LIFT,
      ],
    },
    {
      id: "c2",
      code: "C2",
      name: "Customized Form service",
      basis: "unit",
      unitLabel: "form(s)",
      price: 5000,
      pricing: "rate_only",
      qty: 1,
      row: 90,
    },
  ]),
  ...build("D", [
    {
      id: "d1",
      code: "D1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 0,
      pricing: "included",
      skipPrice: true,
      qty: 1,
      row: 99,
    },
    {
      id: "d2",
      code: "D2",
      name: "Ranger Smart Lock (Included Seal Card & Unseal Card)",
      basis: "unit",
      unitLabel: "set(s)",
      price: 1500,
      qty: 1,
      row: 101,
      notes: [
        "Access control items",
        "Electrical distribution board cabinet",
        "Floor opening equal to or larger than 500mm x 500mm;",
        "Entrance to confined space area",
        "Lift shaft opening",
        "Other applicable scenarios or areas",
      ],
    },
    {
      id: "d3",
      code: "D3",
      name: "Indoor connection",
      basis: "unit",
      unitLabel: "location(s)",
      price: 0,
      pricing: "rate_only",
      qty: 1,
      row: 109,
    },
    {
      id: "d4a",
      code: "D4a",
      name: "Indoor LoRa Gateway",
      basis: "unit",
      unitLabel: "set(s)",
      price: 0,
      qty: 1,
      row: 110,
    },
    {
      id: "d4b",
      code: "D4b",
      name: "Router",
      basis: "unit",
      unitLabel: "set(s)",
      price: 0,
      qty: 1,
      row: 111,
    },
    {
      id: "d4c",
      code: "D4c",
      name: "SIM card for contract period",
      basis: "unit",
      unitLabel: "SIM card(s)",
      price: 0,
      qty: 1,
      row: 112,
      notes: ["quantity of D4a-D4c will be finalize after site visit"],
    },
  ]),
  ...build("E", [
    {
      id: "e1",
      code: "E1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 119,
    },
    {
      id: "e2",
      code: "E2",
      name: "4G SIM card for mobile plants (10 SIM)",
      basis: "month",
      unitLabel: "month(s)",
      price: 2000,
      qty: 1,
      row: 121,
    },
    {
      id: "e3",
      code: "E3",
      name: "Mobile plant system (With installation fee)",
      basis: "unit",
      unitLabel: "set(s)",
      price: 12000,
      qty: 1,
      row: 123,
      notes: ["AI Camera / AI CCTV / IP69K Waterproof / 1080P", "AI Control Box", 'Display (7" IPS)', "External Alarm", "User Manual"],
    },
  ]),
  ...build("F", [
    {
      id: "f1",
      code: "F1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 135,
    },
    {
      id: "f2-camera",
      code: "F2",
      name: "AI Camera (2 Camera for each Tower)",
      basis: "unit",
      unitLabel: "set(s)",
      price: 60000,
      qty: 1,
      row: 139,
      codeRow: 138,
      notes: [
        "AI Analyzer Modem ( 1 modem supports for 6 cameras)",
        "Alarm ( 3nos for 1 tower crane)",
        "UWB base station (set in the 1 Loading and 1 unloading area)",
        "UWB sensor (set in the Tower crane hook)",
      ],
    },
    {
      id: "f4",
      code: "F4",
      name: "Maintenance fee*",
      basis: "month",
      unitLabel: "month(s)",
      price: 2800,
      qty: 1,
      row: 146,
    },
    {
      id: "f5",
      code: "F5",
      name: "Network signal enhancment",
      basis: "unit",
      unitLabel: "location(s)",
      price: 0,
      pricing: "rate_only",
      qty: 1,
      row: 149,
    },
    {
      id: "f5a",
      code: "F5a",
      name: "Router",
      basis: "unit",
      unitLabel: "set(s)",
      price: 0,
      qty: 1,
      row: 150,
    },
    {
      id: "f5b",
      code: "F5b",
      name: "SIM card for contract period",
      basis: "unit",
      unitLabel: "SIM card(s)",
      price: 0,
      qty: 1,
      row: 151,
      notes: ["quantity of F5a-F5b will be finalize after site visit"],
    },
  ]),
  ...build("G", [
    {
      id: "g1",
      code: "G1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 161,
    },
    {
      id: "g2",
      code: "G2",
      name: "4G Smart Watches",
      basis: "unit",
      unitLabel: "pc",
      price: 1200,
      qty: 1,
      row: 163,
      notes: [
        "Capable for outdoor location tracking",
        "Real time detection of standstill",
        "Real time monitoring of body temperature",
        "Real time monitoring of heart rate / Pressure",
        "Include chargers (Type C)",
      ],
    },
    {
      id: "g3",
      code: "G3",
      name: "Maintenance fee*",
      basis: "month",
      unitLabel: "month(s)",
      price: 0,
      pricing: "included",
      skipPrice: true,
      qty: 1,
      row: 171,
    },
    {
      id: "g4",
      code: "G4",
      name: "Smart Helmet (Optional)",
      basis: "unit",
      unitLabel: "Unit",
      price: 5000,
      pricing: "rate_only",
      qty: 1,
      row: 173,
    },
  ]),
  ...build("H", [
    {
      id: "h1",
      code: "H1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 181,
    },
    {
      id: "h2-camera",
      code: "H2",
      name: "4K-Camera",
      basis: "unit",
      unitLabel: "set(s)",
      price: 12000,
      qty: 1,
      row: 184,
      codeRow: 183,
      notes: [
        "Recording Devices (Max for 4 cameras)",
        "AI Analyzer Modem (Max for 4 cameras)",
        "Alarm with light and sound",
        "Central Controller",
      ],
    },
  ]),
  ...build("I", [
    {
      id: "i1",
      code: "I1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 10000,
      qty: 1,
      row: 197,
    },
    {
      id: "i2",
      code: "I2",
      name: "Tablet for access to all data of confined space monitoring system",
      basis: "unit",
      unitLabel: "set(s)",
      price: 40000,
      qty: 1,
      row: 200,
      stampCode: false,
      notes: [
        "Body cam with alarm function",
        "AI Analyzer Modem (Max for 4 cameras)",
        "Gas detector (two levels of alarm systems) O2, CH4, CO, CO2,H2S, PM2.5 and temp",
        "Personal gas detector (two levels of alarm systems) O2, CO, H2S, CH4",
      ],
    },
  ]),
  ...build("J", [
    {
      id: "j1",
      code: "J1",
      name: "One-time platform setup fee",
      basis: "unit",
      unitLabel: "unit",
      price: 20000,
      qty: 1,
      row: 211,
      notes: [
        "system activation",
        "user mannual & installation mannual",
        "web & mobile access (Ranger Scaffold Dashboard)",
        "instant notifications (email and mobile app)",
      ],
    },
    {
      id: "j2",
      code: "J2",
      name: "Scaffold Sensor",
      basis: "unit",
      unitLabel: "set(s)",
      price: 1000,
      qty: 1,
      row: 217,
      notes: ["included wall mount magnetic and angle sensor", "solar power and low power IC", "unique QR code for each device"],
    },
  ]),
  ...build("K", [
    {
      id: "k1",
      code: "K1",
      name: "One-time Module Setup fee",
      basis: "one_off",
      unitLabel: "time",
      price: 20000,
      qty: 1,
      row: 226,
      notes: [
        "system activation",
        "user mannual & installation mannual",
        "web & mobile access (Ranger Scaffold Dashboard)",
        "instant notifications (email and mobile app)",
      ],
    },
    {
      id: "k2",
      code: "K2",
      name: "Temperature Sensor",
      basis: "unit",
      unitLabel: "set(s)",
      price: 1000,
      qty: 1,
      row: 232,
      notes: ["multi-threshsold temperature sensing ( 40℃/ 60℃ /80℃)", "IP67 protection level", "unique QR code for each device"],
    },
  ]),
  ...build("L", [
    {
      id: "l1",
      code: "L1",
      name: "Hardware & Software included:",
      basis: "unit",
      unitLabel: "set",
      price: 12000,
      qty: 1,
      row: 240,
      stampCode: false,
      notes: [
        "Main control device",
        "CIC Training Modules",
        "Heavy lifting operation",
        "Heavy machinery operation",
        "Working in confined space",
        "Use of suspended working platform",
        "Erection / alteration / dismantle of bamboo scaffolds and/or truss-out bamboo scaffold",
        "Electrical and other works with potential electrical hazards or chance of coming into contact with live electrical parts.",
        "Use of ladder for work above ground for work purpose",
        LIFT,
      ],
    },
  ]),
];

export const SFK_SAMPLE = {
  customerName: "SFK Construction Holdings Limited",
  shortCode: "SFK",
  attn: "Kenneth Wong",
  tel: "61330058",
  email: "kennethwong@sfk.com.hk",
  address: "7/F, High Fashion Centre, 1-11 Kwai Hei Street, Kwai Chung, New Territories, Hong Kong",
  subject:
    "HKHA Contract No.20240200 Desgin and Construction of Public Housing Development at Cheung Muk Tau Sites 1 and 2, Ma On Shan",
  customerNo: "20001",
  yourRef: "",
  revision: "",
  quotationDate: "2026-03-30",
  contractMonths: 39,
  contractWeeks: 0,
  discount: 0,
  discountNote: "",
};

/** The reference number is 011, so the next SFK quotation starts there. */
export const SEEDED_SEQUENCES = [{ shortCode: "SFK", lastSeq: 10 }];

export const TOTAL_CELL = "K256";
export const CONTRACT_MONTHS_CELL = "D19";
