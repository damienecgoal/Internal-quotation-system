import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { createQuotation, deleteQuotation, downloadQuotation, exportQuotation, fetchPriceList, fetchQuotation, fetchQuotations } from "./api";
import { currentUser, logout } from "./auth";
import { formatHkd, lineAmount, parseCount, todayIso } from "./calc";
import { Icon } from "./icons";
import { LoginPage } from "./LoginPage";
import type { ChargeBasis, PriceCategory, PriceItem, QuotationDetail, QuotationSummary, SampleHeader } from "./types";

type FormState = {
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
  contractMonths: string;
  contractWeeks: string;
  discount: string;
  discountNote: string;
};

const emptyForm = (): FormState => ({
  customerName: "",
  shortCode: "",
  attn: "",
  tel: "",
  email: "",
  address: "",
  subject: "",
  customerNo: "",
  yourRef: "",
  revision: "",
  quotationDate: todayIso(),
  contractMonths: "0",
  contractWeeks: "0",
  discount: "0",
  discountNote: "",
});

function allItems(categories: PriceCategory[]): PriceItem[] {
  return categories.flatMap((category) => category.items);
}

export function App() {
  const [user, setUser] = useState<string | null>(() => currentUser());
  if (!user) return <LoginPage onSuccess={() => setUser(currentUser())} />;
  return (
    <Workspace
      user={user}
      onLogout={() => {
        logout();
        setUser(null);
      }}
    />
  );
}

function Workspace({ user, onLogout }: { user: string; onLogout: () => void }) {
  const { t, i18n } = useTranslation();
  const [categories, setCategories] = useState<PriceCategory[]>([]);
  const [sample, setSample] = useState<SampleHeader | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [opened, setOpened] = useState<Record<string, boolean>>({});
  const [moduleOn, setModuleOn] = useState<Record<string, boolean>>({});
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [saved, setSaved] = useState<QuotationSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<QuotationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const saveButtonRef = useRef<HTMLButtonElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const saveWasOpen = useRef(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchPriceList(), fetchQuotations()])
      .then(([priceList, quotationList]) => {
        if (cancelled) return;
        setCategories(priceList.categories);
        setSample(priceList.sample);
        setSaved(quotationList.quotations);
        const initialQty: Record<string, string> = {};
        const initialSelected: Record<string, boolean> = {};
        for (const item of allItems(priceList.categories)) {
          initialQty[item.id] = "";
          initialSelected[item.id] = false;
        }
        setQuantities(initialQty);
        setSelected(initialSelected);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : i18n.t("error.load"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(() => allItems(categories), [categories]);

  const totals = useMemo(() => {
    const discount = parseCount(form.discount);
    const categoryTotals = categories.map((category) => {
      const subtotal = category.items.reduce((sum, item) => {
        if (!selected[item.id]) return sum;
        const quantity = parseCount(quantities[item.id] ?? "");
        if (Number.isNaN(quantity)) return sum;
        return sum + lineAmount(item.pricingType, item.unitPrice, quantity);
      }, 0);
      return { id: category.id, subtotal };
    });
    const beforeDiscount = categoryTotals.reduce((sum, category) => sum + category.subtotal, 0);
    const invalid =
      Number.isNaN(discount) ||
      items.some((item) => selected[item.id] && Number.isNaN(parseCount(quantities[item.id] ?? "")));
    return {
      categoryTotals,
      beforeDiscount,
      discount: Number.isNaN(discount) ? 0 : discount,
      total: beforeDiscount - (Number.isNaN(discount) ? 0 : discount),
      invalid,
    };
  }, [categories, form.discount, items, quantities, selected]);

  function updateForm(key: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function blankLines() {
    const nextQty: Record<string, string> = {};
    const nextSelected: Record<string, boolean> = {};
    for (const item of items) {
      nextQty[item.id] = "";
      nextSelected[item.id] = false;
    }
    setQuantities(nextQty);
    setSelected(nextSelected);
    setOpened({});
    setModuleOn({});
    setActiveId(null);
  }

  function moduleFlags(nextSelected: Record<string, boolean>) {
    const next: Record<string, boolean> = {};
    for (const category of categories) {
      next[category.id] = category.items.some((item) => nextSelected[item.id]);
    }
    return next;
  }

  function openUsedCategories(nextSelected: Record<string, boolean>) {
    const nextOpened: Record<string, boolean> = {};
    for (const category of categories) {
      nextOpened[category.id] = category.items.some((item) => nextSelected[item.id]);
    }
    setOpened(nextOpened);
    setModuleOn(moduleFlags(nextSelected));
  }

  function turnModuleOff(categoryId: string) {
    const ids = categories.find((category) => category.id === categoryId)?.items.map((item) => item.id) ?? [];
    setSelected((current) => {
      const next = { ...current };
      for (const id of ids) next[id] = false;
      return next;
    });
    setOpened((current) => ({ ...current, [categoryId]: false }));
    setModuleOn((current) => ({ ...current, [categoryId]: false }));
  }

  function turnModuleOn(categoryId: string) {
    setModuleOn((current) => ({ ...current, [categoryId]: true }));
    setOpened((current) => ({ ...current, [categoryId]: true }));
  }

  function applyBasis(basis: ChargeBasis) {
    const count = parseCount(basis === "month" ? form.contractMonths : form.contractWeeks);
    const basisLabel = t(`basis.${basis}`);
    if (Number.isNaN(count)) {
      setError(t("error.apply", { basis: basisLabel }));
      return;
    }
    const targets = items.filter((item) => selected[item.id] && item.chargeBasis === basis && !item.quantityLocked);
    if (targets.length === 0) {
      setError(t("error.applyNone", { basis: basisLabel }));
      return;
    }
    setError("");
    setQuantities((current) => {
      const next = { ...current };
      for (const item of targets) next[item.id] = String(count);
      return next;
    });
  }

  function loadSample() {
    if (!sample) return;
    setForm({
      customerName: sample.customerName,
      shortCode: sample.shortCode,
      attn: sample.attn,
      tel: sample.tel,
      email: sample.email,
      address: sample.address,
      subject: sample.subject,
      customerNo: sample.customerNo,
      yourRef: sample.yourRef,
      revision: sample.revision,
      quotationDate: sample.quotationDate,
      contractMonths: String(sample.contractMonths),
      contractWeeks: String(sample.contractWeeks),
      discount: String(sample.discount),
      discountNote: sample.discountNote,
    });
    const nextQty: Record<string, string> = {};
    const nextSelected: Record<string, boolean> = {};
    for (const item of items) {
      const use = !item.quantityLocked && item.sampleQuantity > 0;
      nextSelected[item.id] = use;
      nextQty[item.id] = use ? String(item.sampleQuantity) : "";
    }
    setQuantities(nextQty);
    setSelected(nextSelected);
    openUsedCategories(nextSelected);
    setActiveId(null);
    setError("");
    setNotice(t("notice.sample"));
  }

  function applyDetail(quotation: QuotationDetail) {
    setForm({
      customerName: quotation.customerName,
      shortCode: quotation.shortCode,
      attn: quotation.attn,
      tel: quotation.tel,
      email: quotation.email,
      address: quotation.address,
      subject: quotation.subject,
      customerNo: quotation.customerNo,
      yourRef: quotation.yourRef,
      revision: quotation.revision,
      quotationDate: quotation.quotationDate,
      contractMonths: String(quotation.contractMonths),
      contractWeeks: String(quotation.contractWeeks),
      discount: String(quotation.discount),
      discountNote: quotation.discountNote,
    });
    const nextQty: Record<string, string> = {};
    const nextSelected: Record<string, boolean> = {};
    for (const item of items) {
      nextQty[item.id] = "";
      nextSelected[item.id] = false;
    }
    for (const line of quotation.lines) {
      nextSelected[line.priceItemId] = line.included;
      nextQty[line.priceItemId] = line.quantity > 0 ? String(line.quantity) : "";
    }
    setQuantities(nextQty);
    setSelected(nextSelected);
    openUsedCategories(nextSelected);
    setActiveId(quotation.id);
    setLastSaved(quotation);
    setError("");
    setNotice(t("notice.loaded", { number: quotation.quotationNo }));
  }

  async function openSaved(id: string) {
    setPendingDelete(null);
    setError("");
    try {
      const result = await fetchQuotation(id);
      applyDetail(result.quotation);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.open"));
    }
  }

  useEffect(() => {
    if (saveOpen) {
      saveWasOpen.current = true;
      widgetRef.current?.focus();
      return;
    }
    if (saveWasOpen.current) saveButtonRef.current?.focus();
  }, [saveOpen]);

  useEffect(() => {
    if (!saveOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        setSaveOpen(false);
        return;
      }
      if (event.key !== "Tab" || !widgetRef.current) return;
      const focusable = [...widgetRef.current.querySelectorAll<HTMLElement>("button:not(:disabled)")];
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saveOpen, saving]);

  function openSave() {
    setError("");
    setSaveOpen(true);
  }

  async function save() {
    const contractMonths = parseCount(form.contractMonths);
    const contractWeeks = parseCount(form.contractWeeks);
    const discount = parseCount(form.discount);
    if (form.customerName.trim() === "" || form.shortCode.trim() === "") {
      setError(t("error.required"));
      return;
    }
    if ([contractMonths, contractWeeks, discount].some((value) => Number.isNaN(value)) || totals.invalid) {
      setError(t("error.counts"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await createQuotation({
        ...form,
        customerName: form.customerName.trim(),
        shortCode: form.shortCode.trim(),
        contractMonths,
        contractWeeks,
        discount,
        lines: items.map((item) => ({
          priceItemId: item.id,
          included: selected[item.id] === true,
          quantity: selected[item.id] ? parseCount(quantities[item.id] ?? "") || 0 : parseCount(quantities[item.id] ?? "") || 0,
        })),
      });
      setLastSaved(result.quotation);
      setActiveId(result.quotation.id);
      setNotice(t("notice.saved", { number: result.quotation.quotationNo }));
      const list = await fetchQuotations();
      setSaved(list.quotations);
      setSaveOpen(false);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.generic"));
    } finally {
      setSaving(false);
    }
  }

  function draftPayload(quotationNo: string) {
    const contractMonths = parseCount(form.contractMonths);
    const contractWeeks = parseCount(form.contractWeeks);
    const discount = parseCount(form.discount);
    if (form.customerName.trim() === "" || form.shortCode.trim() === "") {
      setError(t("error.required"));
      return null;
    }
    if ([contractMonths, contractWeeks, discount].some((value) => Number.isNaN(value)) || totals.invalid) {
      setError(t("error.counts"));
      return null;
    }
    return {
      ...form,
      quotationNo,
      customerName: form.customerName.trim(),
      shortCode: form.shortCode.trim(),
      contractMonths,
      contractWeeks,
      discount,
      lines: items.map((item) => ({
        priceItemId: item.id,
        included: selected[item.id] === true,
        quantity: parseCount(quantities[item.id] ?? "") || 0,
      })),
    };
  }

  async function exportCurrent() {
    const active = saved.find((quotation) => quotation.id === activeId);
    const payload = draftPayload(active?.quotationNo ?? "DRAFT");
    if (!payload) return;
    setExporting(true);
    setError("");
    try {
      await exportQuotation(payload, `${payload.quotationNo}.xlsx`);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.export"));
    } finally {
      setExporting(false);
    }
  }

  async function removeSaved(id: string, quotationNo: string) {
    if (pendingDelete !== id) {
      setPendingDelete(id);
      return;
    }
    setError("");
    try {
      await deleteQuotation(id);
      setSaved((current) => current.filter((quotation) => quotation.id !== id));
      if (activeId === id) setActiveId(null);
      setPendingDelete(null);
      setNotice(t("notice.deleted", { number: quotationNo }));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.delete"));
    }
  }

  async function download(id: string, quotationNo: string) {
    setError("");
    try {
      await downloadQuotation(id, quotationNo);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.download"));
    }
  }

  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav-body">
          <div className="nav-brand">
            <strong>{t("title")}</strong>
          </div>
          <button type="button" className="secondary" onClick={() => { setForm(emptyForm()); blankLines(); setNotice(""); }}>
            <Icon name="plus" />
            <span>{t("newQuotation")}</span>
          </button>
          <button type="button" className="secondary" onClick={loadSample}>
            <Icon name="sample" />
            <span>{t("nav.loadSample")}</span>
          </button>
          <div className="saved-list">
            <h2>{t("nav.saved")}</h2>
            {saved.length === 0 ? <p>{t("nav.empty")}</p> : null}
            {saved.map((quotation) => (
              <div className={quotation.id === activeId ? "saved-row active" : "saved-row"} key={quotation.id}>
                <button type="button" className="saved-open" onClick={() => void openSaved(quotation.id)}>
                  <strong>{quotation.quotationNo}</strong>
                  <span>{quotation.customerName}</span>
                  <span>{quotation.quotationDate}</span>
                  <span>{formatHkd(quotation.total)}</span>
                </button>
                <div className="saved-actions">
                  <button
                    type="button"
                    className="quiet"
                    aria-label={t("actions.excelNamed", { number: quotation.quotationNo })}
                    onClick={() => void download(quotation.id, quotation.quotationNo)}
                  >
                    <Icon name="excel" />
                    <span>{t("actions.excel")}</span>
                  </button>
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => void removeSaved(quotation.id, quotation.quotationNo)}
                  >
                    <Icon name="trash" />
                    <span>{pendingDelete === quotation.id ? t("actions.confirmDelete") : t("actions.delete")}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="nav-foot">
          <p className="nav-company">{t("company")}</p>
          <p className="nav-user">{t("nav.signedIn", { name: user })}</p>
          <div className="nav-tools">
            <button
              type="button"
              className="quiet"
              onClick={() => void i18n.changeLanguage(i18n.language === "zh-Hant" ? "en" : "zh-Hant")}
            >
              <Icon name="language" />
              <span>{i18n.language === "zh-Hant" ? "English" : "繁體中文"}</span>
            </button>
            <button type="button" className="quiet" onClick={onLogout}>
              <Icon name="logout" />
              <span>{t("nav.logout")}</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="workspace">
        <header className="masthead">
          <div>
            <h1>{t("title")}</h1>
            <p className="lede">{t("lede")}</p>
          </div>
          <div className="mast-total">
            <span>{t("totalLabel")}</span>
            <strong>{categories.length === 0 || totals.invalid ? "—" : formatHkd(totals.total)}</strong>
          </div>
        </header>

        {error ? <p className="banner error">{error}</p> : null}
        {notice ? <p className="banner ok">{notice}</p> : null}
        {loading ? <p>{t("loading")}</p> : null}

        {!loading && categories.length > 0 ? (
          <div className="layout">
            <section>
              <form
                className="card"
                onSubmit={(event) => {
                  event.preventDefault();
                  openSave();
                }}
              >
                <h2>{t("header")}</h2>
                <div className="grid" style={{ marginTop: 12 }}>
                  <Field label={t("fields.customer")} value={form.customerName} onChange={(value) => updateForm("customerName", value)} />
                  <Field label={t("fields.shortCode")} value={form.shortCode} onChange={(value) => updateForm("shortCode", value)} />
                  <Field label={t("fields.attn")} value={form.attn} onChange={(value) => updateForm("attn", value)} />
                  <Field label={t("fields.tel")} value={form.tel} onChange={(value) => updateForm("tel", value)} />
                  <Field label={t("fields.email")} value={form.email} onChange={(value) => updateForm("email", value)} />
                  <Field label={t("fields.customerNo")} value={form.customerNo} onChange={(value) => updateForm("customerNo", value)} />
                  <Field label={t("fields.address")} className="span-2" value={form.address} onChange={(value) => updateForm("address", value)} />
                  <label className="span-2">
                    <span>{t("fields.subject")}</span>
                    <textarea value={form.subject} onChange={(event) => updateForm("subject", event.target.value)} />
                  </label>
                  <Field label={t("fields.yourRef")} value={form.yourRef} onChange={(value) => updateForm("yourRef", value)} />
                  <Field label={t("fields.revision")} value={form.revision} onChange={(value) => updateForm("revision", value)} />
                  <Field label={t("fields.date")} type="date" value={form.quotationDate} onChange={(value) => updateForm("quotationDate", value)} />
                  <Field label={t("fields.discountNote")} value={form.discountNote} onChange={(value) => updateForm("discountNote", value)} />
                </div>
                <div className="inline-actions">
                  <button
                    type="button"
                    className="quiet"
                    disabled={!lastSaved}
                    onClick={() => lastSaved && void download(lastSaved.id, lastSaved.quotationNo)}
                  >
                    <Icon name="excel" />
                    <span>{t("actions.download")}</span>
                  </button>
                </div>
              </form>

              <div className="categories">
                {categories.map((category) => {
                  const subtotal = totals.categoryTotals.find((entry) => entry.id === category.id)?.subtotal ?? 0;
                  let previousGroup = "";
                  return (
                    <section className="category" key={category.id}>
                      <div className="category-head">
                        <input
                          className="module-check"
                          type="checkbox"
                          checked={moduleOn[category.id] === true || category.items.some((item) => selected[item.id])}
                          aria-label={t("actions.includeModule", { code: category.code, name: category.name })}
                          onChange={(event) => {
                            if (event.target.checked) turnModuleOn(category.id);
                            else turnModuleOff(category.id);
                          }}
                        />
                        <div>
                          <h2>
                            {category.code}. {category.name}
                          </h2>
                          {category.description ? <p>{category.description}</p> : null}
                          {category.productLine ? <p className="product">{category.productLine}</p> : null}
                        </div>
                        <strong className="subtotal">{formatHkd(subtotal)}</strong>
                      </div>
                      <div className="category-actions">
                        <button
                          type="button"
                          className="quiet"
                          aria-expanded={opened[category.id] === true}
                          onClick={() => setOpened((current) => ({ ...current, [category.id]: current[category.id] !== true }))}
                        >
                          <Icon name={opened[category.id] === true ? "hide" : "show"} />
                          <span>{opened[category.id] === true ? t("actions.hideItems") : t("actions.showItems")}</span>
                        </button>
                      </div>
                      {opened[category.id] === true ? category.items.map((item) => {
                        const showGroup = item.group !== "" && item.group !== previousGroup;
                        previousGroup = item.group;
                        const checked = selected[item.id] === true;
                        const quantity = parseCount(quantities[item.id] ?? "");
                        const amount = !checked || Number.isNaN(quantity) ? 0 : lineAmount(item.pricingType, item.unitPrice, quantity);
                        return (
                          <div key={item.id}>
                            {showGroup ? <h3 className="group">{item.group}</h3> : null}
                            <div className={checked ? "item" : "item off"}>
                              <input
                                type="checkbox"
                                checked={checked}
                                aria-label={`${item.displayCode} ${item.name}`}
                                onChange={(event) => {
                                  const checked = event.target.checked;
                                  setSelected((current) => ({ ...current, [item.id]: checked }));
                                  if (checked) {
                                    setModuleOn((current) => ({ ...current, [category.id]: true }));
                                    return;
                                  }
                                  const stillOn = category.items.some((other) => other.id !== item.id && selected[other.id]);
                                  if (!stillOn) setModuleOn((current) => ({ ...current, [category.id]: false }));
                                }}
                              />
                              <div className="code">{item.displayCode}</div>
                              <div className="name">
                                <div>
                                  {item.name}
                                  <span className="basis">/ {t(`basis.${item.chargeBasis}`)}</span>
                                </div>
                                {item.notes.length > 0 ? (
                                  <ul className="notes">
                                    {item.notes.map((note) => (
                                      <li key={note}>{note}</li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                              <div className="price">{formatHkd(item.unitPrice)}</div>
                              {item.quantityLocked ? (
                                <div className="locked">{item.quantityLabel}</div>
                              ) : (
                                <input
                                  className="qty"
                                  aria-label={`${item.displayCode} ${t("item.count")}`}
                                  inputMode="numeric"
                                  disabled={!checked}
                                  value={quantities[item.id] ?? ""}
                                  onChange={(event) =>
                                    setQuantities((current) => ({ ...current, [item.id]: event.target.value }))
                                  }
                                />
                              )}
                              <div className={item.pricingType === "rate_only" ? "amount rate" : "amount"}>
                                {item.pricingType === "rate_only" ? t("item.rateOnly") : formatHkd(amount)}
                              </div>
                            </div>
                          </div>
                        );
                      }) : null}
                    </section>
                  );
                })}
              </div>
            </section>

            <aside className="summary">
              <h2>{t("summary.title")}</h2>
              <p>{t("summary.help")}</p>
              <Field label={t("summary.months")} value={form.contractMonths} onChange={(value) => updateForm("contractMonths", value)} />
              <button type="button" className="secondary" onClick={() => applyBasis("month")}>
                <Icon name="month" />
                <span>{t("summary.applyMonths")}</span>
              </button>
              <Field label={t("summary.weeks")} value={form.contractWeeks} onChange={(value) => updateForm("contractWeeks", value)} />
              <button type="button" className="secondary" onClick={() => applyBasis("week")}>
                <Icon name="week" />
                <span>{t("summary.applyWeeks")}</span>
              </button>
              <p>{t("summary.weekNote")}</p>
              <Field label={t("summary.discount")} value={form.discount} onChange={(value) => updateForm("discount", value)} />
              <p className="total-label">{t("summary.before")}</p>
              <p>{formatHkd(totals.beforeDiscount)}</p>
              <p className="total-label">{t("summary.total")}</p>
              <p className="total">{totals.invalid ? t("summary.checkCounts") : formatHkd(totals.total)}</p>
              <div className="summary-actions">
                <button ref={saveButtonRef} type="button" className="primary" onClick={openSave}>
                  <Icon name="save" />
                  <span>{t("actions.save")}</span>
                </button>
                <button type="button" className="secondary" disabled={exporting || totals.invalid} onClick={() => void exportCurrent()}>
                  <Icon name="export" />
                  <span>{t("actions.export")}</span>
                </button>
              </div>
            </aside>
          </div>
        ) : null}
        {saveOpen ? (
          <div
            className="widget-backdrop"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !saving) setSaveOpen(false);
            }}
          >
            <div
              ref={widgetRef}
              className="widget"
              role="dialog"
              aria-modal="true"
              aria-labelledby="save-widget-title"
              tabIndex={-1}
            >
              <h2 id="save-widget-title">{t("widget.title")}</h2>
              <p>{t("widget.help")}</p>
              {error ? <p className="banner error">{error}</p> : null}
              <dl>
                <dt>{t("fields.customer")}</dt>
                <dd>{form.customerName.trim() || "—"}</dd>
                <dt>{t("fields.shortCode")}</dt>
                <dd>{form.shortCode.trim() || "—"}</dd>
                <dt>{t("fields.date")}</dt>
                <dd>{form.quotationDate}</dd>
                <dt>{t("widget.included")}</dt>
                <dd>{items.filter((item) => selected[item.id]).length}</dd>
                <dt>{t("summary.before")}</dt>
                <dd>{formatHkd(totals.beforeDiscount)}</dd>
                <dt>{t("summary.discount")}</dt>
                <dd>{formatHkd(parseCount(form.discount) || 0)}</dd>
                <dt>{t("summary.total")}</dt>
                <dd>{totals.invalid ? t("summary.checkCounts") : formatHkd(totals.total)}</dd>
              </dl>
              <div className="actions">
                <button type="button" className="primary" disabled={saving || totals.invalid} onClick={() => void save()}>
                  <Icon name="save" />
                  <span>{saving ? t("actions.saving") : t("actions.save")}</span>
                </button>
                <button type="button" className="quiet" disabled={saving} onClick={() => setSaveOpen(false)}>
                  {t("widget.cancel")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
