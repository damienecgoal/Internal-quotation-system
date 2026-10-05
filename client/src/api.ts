import type { PriceCategory, QuotationDetail, QuotationSummary, SampleHeader } from "./types";

type Envelope<T> = T & { ok: boolean; message?: string };

const apiBase = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

function apiUrl(path: string): string {
  return `${apiBase}${path}`;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = (await response.json()) as Envelope<T>;
  if (!response.ok || body.ok === false) {
    throw new Error(body.message ?? "Request failed.");
  }
  return body;
}

export function fetchPriceList() {
  return request<{ categories: PriceCategory[]; sample: SampleHeader }>(apiUrl("/api/price-list"));
}

export function fetchQuotations() {
  return request<{ quotations: QuotationSummary[] }>(apiUrl("/api/quotations"));
}

export function fetchQuotation(id: string) {
  return request<{ quotation: QuotationDetail }>(apiUrl(`/api/quotations/${id}`));
}

export function createQuotation(payload: unknown) {
  return request<{ quotation: QuotationDetail }>(apiUrl("/api/quotations"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function downloadQuotation(id: string, quotationNo: string) {
  const response = await fetch(apiUrl(`/api/quotations/${id}/excel`));
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? "Could not download the Excel file.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${quotationNo}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
