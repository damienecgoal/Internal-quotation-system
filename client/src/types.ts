export type ChargeBasis = "unit" | "month" | "week";
export type PricingType = "calculated" | "rate_only";

export type PriceItem = {
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
  sortOrder: number;
  noteCapacity: number;
};

export type PriceCategory = {
  id: string;
  code: string;
  name: string;
  description: string;
  productLine: string;
  sortOrder: number;
  items: PriceItem[];
};

export type SampleHeader = {
  customerName: string;
  shortCode: string;
  attn: string;
  tel: string;
  email: string;
  address: string;
  subject: string;
  customerNo: string;
  yourRef: string;
  revision: string;
  quotationDate: string;
  contractMonths: number;
  contractWeeks: number;
  discount: number;
  discountNote: string;
};

export type QuotationSummary = {
  id: string;
  quotationNo: string;
  customerName: string;
  quotationDate: string;
  total: number;
  createdAt: string;
};

export type QuotationLine = {
  priceItemId: string;
  quantity: number;
  included: boolean;
};

export type QuotationDetail = QuotationSummary &
  SampleHeader & {
    lines: QuotationLine[];
  };
