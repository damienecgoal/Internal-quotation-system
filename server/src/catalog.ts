export type ChargeBasis = "unit" | "month" | "week";
export type PricingType = "calculated" | "rate_only";

export type ItemCells = {
  quantity?: string;
  unit?: string;
  price?: string;
  amount: string;
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
  unitPrice: number;
  pricingType: PricingType;
  notes: string[];
  group: string;
  quantityLocked: boolean;
  quantityLabel: string;
  sampleQuantity: number;
  cells: ItemCells;
  sortOrder: number;
};

const LIFTING =
  "lifting operations by tower cranes, mobile cranes, crawlercranes, or cranes alike or lifting operation by mechanical means";

export const CATEGORIES: CatalogCategory[] = [
  {
    id: "A",
    code: "A",
    name: "Centralized Management Platform (CMP)",
    description: "A centralized management platform use to monitor all IoT systems and devices",
    productLine: "Ranger Centralized Management Platform (CITF PA Product code: PA25-153)",
    sortOrder: 1,
    subtotalCell: "K67",
  },
  {
    id: "B",
    code: "B",
    name: "Digitalized Tracking System",
    description:
      "Real-time on-line QR code tracking of all site plants, powered tools and ladders up-to-date status",
    productLine: "Ranger Digitalised Tracking System (CITF PA Product code: PA26-024)",
    sortOrder: 2,
    subtotalCell: "K85",
  },
  {
    id: "C",
    code: "C",
    name: "Digitalized permit-to-work system (ePTW)",
    description:
      "System use to facilitate on-line real-time application, issuance and tracking of permit-to-work to move and operate for high risk activities",
    productLine: "Ranger Permit To Work System (CITF PA Product code: PA25-154)",
    sortOrder: 3,
    subtotalCell: "K107",
  },
  {
    id: "D",
    code: "D",
    name: "Electronic lock and key system (E-Lock)",
    description: "Hazardous areas access control by electronic lock and key system",
    productLine: "Ranger Electronic Lock and Key System (CITF PA Product code: PA25-155)",
    sortOrder: 4,
    subtotalCell: "K131",
  },
  {
    id: "E",
    code: "E",
    name: "Unsafe Acts / Dangerous situation alert - Mobile plant",
    description: "Automated warning system on all mobile cranes operating on site to alert plant operator",
    productLine: "",
    sortOrder: 5,
    subtotalCell: "K152",
  },
  {
    id: "F",
    code: "F",
    name: "Unsafe Acts / Dangerous situation alert - Tower crane",
    description:
      "An automated warning system on tower cranes to alert tower crane operator and any site personnel encroaching upon the tower crane lifting zone",
    productLine: "",
    sortOrder: 6,
    subtotalCell: "K180",
  },
  {
    id: "G",
    code: "G",
    name: "Smart monitoring devices for workers and frontline site personnel - watch",
    description: "Real-time monitoring of workers' safety and location with CMP integration for centralized reporting.",
    productLine: "Ranger Smart Watch (CITF PA Product code: PA25-156)",
    sortOrder: 7,
    subtotalCell: "K200",
  },
  {
    id: "H",
    code: "H",
    name: "Safety Monitoring System using Artificial Intelligence",
    description:
      "Uses AI cameras and cloud analytics to detect unsafe acts in real time and send instant alerts via the CMP dashboard and speaker system.",
    productLine: "Ranger AI-Powered Safety Monitoring System (CITF PA Product code: PA26-004)",
    sortOrder: 8,
    subtotalCell: "K228",
  },
  {
    id: "I",
    code: "I",
    name: "Confined Spaces Monitoring System",
    description: "Monitor the locations defined as confined spaces on the site",
    productLine: "Ranger Confined Space Monitoring System (CITF PA Product code: PA26-025)",
    sortOrder: 9,
    subtotalCell: "K250",
  },
  {
    id: "J",
    code: "J",
    name: "Safety Training with VR Technology",
    description: "",
    productLine: "",
    sortOrder: 10,
    subtotalCell: "K268",
  },
  {
    id: "K",
    code: "K",
    name: "Height Limited Sensor",
    description: "Real-time monitoring of mobile plant exceeding height limitd of road",
    productLine: "",
    sortOrder: 11,
    subtotalCell: "K283",
  },
  {
    id: "L",
    code: "L",
    name: "Authenticating authorized operation of plant and equipment",
    description: "Prohibit unauthorised duplication of operation",
    productLine: "",
    sortOrder: 12,
    subtotalCell: "K295",
  },
];

type Draft = {
  id: string;
  code: string;
  name: string;
  basis: ChargeBasis;
  price: number;
  pricing?: PricingType;
  qty?: number;
  notes?: string[];
  group?: string;
  locked?: boolean;
  label?: string;
  row: number;
  skipPrice?: boolean;
};

function build(categoryId: string, drafts: Draft[]): CatalogItem[] {
  return drafts.map((draft, index) => {
    const locked = draft.locked ?? false;
    return {
      id: draft.id,
      categoryId,
      displayCode: draft.code,
      name: draft.name,
      chargeBasis: draft.basis,
      unitPrice: draft.price,
      pricingType: draft.pricing ?? "calculated",
      notes: draft.notes ?? [],
      group: draft.group ?? "",
      quantityLocked: locked,
      quantityLabel: draft.label ?? "",
      sampleQuantity: locked ? 0 : (draft.qty ?? 0),
      sortOrder: index + 1,
      cells: {
        quantity: locked ? undefined : `F${draft.row}`,
        unit: locked ? undefined : `G${draft.row}`,
        price: draft.skipPrice ? undefined : `I${draft.row}`,
        amount: `K${draft.row}`,
        quantityIsLabel: locked,
      },
    };
  });
}

export const ITEMS: CatalogItem[] = [
  ...build("A", [
    {
      id: "a1",
      code: "A1",
      name: "One-time platform setup fee",
      basis: "unit",
      price: 50000,
      qty: 1,
      row: 45,
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
      basis: "unit",
      price: 20000,
      qty: 1,
      row: 50,
    },
    {
      id: "a3",
      code: "A3",
      name: "Monthly report on implementation of SSSS components",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 52,
      notes: ["standard excel format"],
    },
    {
      id: "a4",
      code: "A4",
      name: "Maintenance fee* (License fee & Cloud storage)",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 55,
      notes: [
        "IT service support (phone support)",
        "System maintanance",
        "Software version updates",
        "Access and use of mobile app",
        "1TB Cloud Storage",
      ],
    },
    {
      id: "a5",
      code: "A5",
      name: "On-site Support (Optional)",
      basis: "unit",
      price: 5000,
      pricing: "rate_only",
      locked: true,
      label: "Per man-day (4-Hour)",
      row: 62,
    },
    {
      id: "a6",
      code: "A6",
      name: "Extra Storage",
      basis: "month",
      price: 1000,
      pricing: "rate_only",
      locked: true,
      label: "Per 1TB Per Month",
      row: 65,
    },
  ]),
  ...build("B", [
    {
      id: "b1",
      code: "B1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 74,
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
      name: "Maintenance fee",
      basis: "month",
      price: 500,
      qty: 51,
      row: 81,
    },
    {
      id: "b3",
      code: "B3",
      name: "QR Code Printer (Optional)",
      basis: "unit",
      price: 10000,
      pricing: "rate_only",
      qty: 1,
      row: 83,
    },
  ]),
  ...build("C", [
    {
      id: "c1",
      code: "C1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 50000,
      qty: 1,
      row: 91,
      notes: [
        "Covers Basic Forms",
        "Work in confined spaces",
        "Work with electrical hazard",
        "Work in lift shaft",
        "Mobile crane, heavy machinery and piling rig operating or moving on the Site",
        "Hot work",
        "Use of ladder for work above ground for work purpose",
        LIFTING,
      ],
    },
    {
      id: "c2",
      code: "C2",
      name: "Maintenance fee*",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 101,
    },
    {
      id: "c3",
      code: "C3",
      name: "Customized Form service",
      basis: "unit",
      price: 5000,
      pricing: "rate_only",
      qty: 1,
      row: 103,
    },
    {
      id: "c4",
      code: "C4",
      name: "Maintenance fee* for customized form",
      basis: "unit",
      price: 5000,
      pricing: "rate_only",
      qty: 1,
      row: 105,
    },
  ]),
  ...build("D", [
    {
      id: "d1",
      code: "D1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 113,
    },
    {
      id: "d2",
      code: "D2",
      name: "Ranger Smart Lock (Included Seal Card & Unseal Card)",
      basis: "unit",
      price: 1500,
      qty: 180,
      row: 115,
      notes: [
        "Access control items",
        "Electrical distribution board cabinet",
        "Floor opening equal to or larger than 500mm x 500mm",
        "Entrance to confined space area",
        "Lift shaft opening",
        "Other applicable scenarios or areas",
      ],
    },
    {
      id: "d4-maintenance",
      code: "D4",
      name: "Maintenance fee*",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 123,
    },
    {
      id: "d4-indoor",
      code: "D4",
      name: "Indoor connection",
      basis: "unit",
      price: 0,
      pricing: "rate_only",
      qty: 1,
      row: 125,
      skipPrice: true,
      notes: [
        "D4a Indoor LoRa Gateway",
        "D4b Router",
        "D4c SIM card for contract period",
        "quantity of D4a-D4c will be finalize after site visit",
      ],
    },
  ]),
  ...build("E", [
    {
      id: "e1",
      code: "E1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 135,
    },
    {
      id: "e2",
      code: "E2",
      name: "4G SIM card for mobile plants (10 SIM)",
      basis: "month",
      price: 3000,
      qty: 51,
      row: 137,
    },
    {
      id: "e3",
      code: "E3",
      name: "Mobile plant system (With installation fee)",
      basis: "unit",
      price: 15000,
      qty: 10,
      row: 139,
      notes: [
        "AI Camera / AI CCTV / IP69K Waterproof / 1080P",
        "AI Control Box",
        'Display (7" IPS)',
        "External Alarm",
        "User Manual",
      ],
    },
    {
      id: "e4",
      code: "E4",
      name: "Removal & reinstalment fee for mobile plant",
      basis: "unit",
      price: 8000,
      qty: 10,
      row: 146,
    },
    {
      id: "e5",
      code: "E5",
      name: "Maintenance fee*",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 148,
    },
  ]),
  ...build("F", [
    {
      id: "f1",
      code: "F1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 157,
    },
    {
      id: "f2-camera",
      code: "F2a",
      name: "AI Camera (2 Camera for each Tower)",
      basis: "unit",
      price: 10000,
      qty: 6,
      row: 161,
      group: "Hardware",
    },
    {
      id: "f2-modem",
      code: "F2b",
      name: "AI Analyzer Modem (1 modem supports for 6 cameras)",
      basis: "unit",
      price: 18000,
      qty: 6,
      row: 162,
      group: "Hardware",
    },
    {
      id: "f2-alarm",
      code: "F2c",
      name: "Alarm (3nos for 1 tower crane)",
      basis: "unit",
      price: 1800,
      qty: 18,
      row: 163,
      group: "Hardware",
    },
    {
      id: "f2-uwb-base",
      code: "F2d",
      name: "UWB base station (set in the 1 Loading and 1 unloading area)",
      basis: "unit",
      price: 10000,
      qty: 12,
      row: 164,
      group: "Hardware",
    },
    {
      id: "f2-uwb-sensor",
      code: "F2e",
      name: "UWB sensor (set in the Tower crane hook)",
      basis: "unit",
      price: 1500,
      qty: 6,
      row: 165,
      group: "Hardware",
    },
    {
      id: "f3",
      code: "F3",
      name: "Installation fee including relocation",
      basis: "unit",
      price: 8000,
      qty: 10,
      row: 168,
    },
    {
      id: "f4",
      code: "F4",
      name: "Maintenance fee*",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 171,
    },
    {
      id: "f5",
      code: "F5",
      name: "Network signal enhancment",
      basis: "unit",
      price: 0,
      pricing: "rate_only",
      qty: 1,
      row: 174,
      skipPrice: true,
      notes: [
        "F5a Router",
        "F5b SIM card for contract period",
        "quantity of F5a-F5b will be finalize after site visit",
      ],
    },
  ]),
  ...build("G", [
    {
      id: "g1",
      code: "G1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 186,
    },
    {
      id: "g2",
      code: "G2",
      name: "4G Smart Watches",
      basis: "unit",
      price: 1200,
      qty: 20,
      row: 188,
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
      price: 500,
      qty: 51,
      row: 196,
    },
    {
      id: "g4",
      code: "G4",
      name: "Smart Helmet (Optional)",
      basis: "unit",
      price: 5000,
      pricing: "rate_only",
      qty: 1,
      row: 198,
    },
  ]),
  ...build("H", [
    {
      id: "h1",
      code: "H1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 206,
    },
    {
      id: "h2-camera",
      code: "H2a",
      name: "4K-Camera",
      basis: "unit",
      price: 5000,
      qty: 4,
      row: 209,
      group: "Ranger AI-Powered Safety Monitoring System",
    },
    {
      id: "h2-recording",
      code: "H2b",
      name: "Recording Devices (Max for 4 cameras)",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 210,
      group: "Ranger AI-Powered Safety Monitoring System",
    },
    {
      id: "h2-modem",
      code: "H2c",
      name: "AI Analyzer Modem (Max for 4 cameras)",
      basis: "unit",
      price: 15000,
      qty: 1,
      row: 211,
      group: "Ranger AI-Powered Safety Monitoring System",
    },
    {
      id: "h2-alarm",
      code: "H2d",
      name: "Alarm with light and sound",
      basis: "unit",
      price: 1800,
      qty: 4,
      row: 212,
      group: "Ranger AI-Powered Safety Monitoring System",
    },
    {
      id: "h2-controller",
      code: "H2e",
      name: "Central Controller",
      basis: "unit",
      price: 8000,
      qty: 1,
      row: 213,
      group: "Ranger AI-Powered Safety Monitoring System",
    },
    {
      id: "h3",
      code: "H3",
      name: "Installation Fee",
      basis: "unit",
      price: 30000,
      qty: 1,
      row: 216,
    },
    {
      id: "h4",
      code: "H4",
      name: "Maintenance fee*",
      basis: "month",
      price: 1000,
      qty: 51,
      row: 218,
    },
    {
      id: "h5",
      code: "H5",
      name: "Indoor connection",
      basis: "unit",
      price: 0,
      pricing: "rate_only",
      qty: 1,
      row: 221,
      skipPrice: true,
      notes: [
        "H5a Router",
        "H5b SIM card for contract period",
        "quantity of H5a-H5b will be finalize after site visit",
      ],
    },
  ]),
  ...build("I", [
    {
      id: "i1",
      code: "I1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 234,
    },
    {
      id: "i2",
      code: "I2",
      name: "Maintenance fee*",
      basis: "month",
      price: 500,
      qty: 51,
      row: 236,
    },
    {
      id: "i3-tablet",
      code: "I3a",
      name: "Tablet for access to all data of confined space monitoring system",
      basis: "unit",
      price: 10000,
      qty: 2,
      row: 239,
      group: "Confined Spaces Monitoring System",
    },
    {
      id: "i3-bodycam",
      code: "I3b",
      name: "Body cam with alarm function",
      basis: "unit",
      price: 10000,
      qty: 4,
      row: 240,
      group: "Confined Spaces Monitoring System",
    },
    {
      id: "i3-modem",
      code: "I3c",
      name: "AI Analyzer Modem (Max for 4 cameras)",
      basis: "unit",
      price: 15000,
      qty: 2,
      row: 241,
      group: "Confined Spaces Monitoring System",
    },
    {
      id: "i3-gas",
      code: "I3d",
      name: "Gas detector (two levels of alarm systems) O2, CH4, CO, CO2, H2S, PM2.5 and temp",
      basis: "unit",
      price: 7000,
      qty: 4,
      row: 242,
      group: "Confined Spaces Monitoring System",
    },
    {
      id: "i3-personal-gas",
      code: "I3e",
      name: "Personal gas detector (two levels of alarm systems) O2, CO, H2S, CH4",
      basis: "unit",
      price: 18000,
      qty: 4,
      row: 243,
      group: "Confined Spaces Monitoring System",
    },
  ]),
  ...build("J", [
    {
      id: "j1",
      code: "J1",
      name: "Hardware & Software included",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 253,
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
        LIFTING,
      ],
    },
  ]),
  ...build("K", [
    {
      id: "k1",
      code: "K1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 272,
    },
    {
      id: "k2",
      code: "K2",
      name: "Hardware",
      basis: "unit",
      price: 15000,
      qty: 2,
      row: 274,
      notes: ["Radar AI anti-collision alarm system"],
    },
    {
      id: "k3",
      code: "K3",
      name: "Maintenance fee*",
      basis: "month",
      price: 500,
      qty: 51,
      row: 277,
    },
    {
      id: "k4",
      code: "K4",
      name: "Hardware installation",
      basis: "unit",
      price: 10000,
      qty: 2,
      row: 280,
      notes: ["Main Contractor Provide Standing Pole / Electricity"],
    },
  ]),
  ...build("L", [
    {
      id: "l1",
      code: "L1",
      name: "One-time Module Setup fee",
      basis: "unit",
      price: 10000,
      qty: 1,
      row: 287,
    },
    {
      id: "l2",
      code: "L2",
      name: "Hardware",
      basis: "unit",
      price: 10000,
      qty: 10,
      row: 289,
      notes: ["face recognition system"],
    },
    {
      id: "l3",
      code: "L3",
      name: "Maintenance fee*",
      basis: "month",
      price: 500,
      qty: 51,
      row: 292,
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
  contractMonths: 51,
  contractWeeks: 0,
  discount: 180400,
  discountNote: "Discount: 80% off of first 2 sets confined Spaces Monitoring System",
};

/** The reference number is 011, so the next SFK quotation starts there. */
export const SEEDED_SEQUENCES = [{ shortCode: "SFK", lastSeq: 10 }];

export const TOTAL_CELL = "K297";
export const DISCOUNT_CELL = "K246";
export const DISCOUNT_NOTE_CELL = "C246";
export const CONTRACT_MONTHS_CELL = "D19";
