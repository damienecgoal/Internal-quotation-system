import { useState } from "react";
import { useTranslation } from "react-i18next";
import { savePriceList } from "./api";
import { wholeCountInput } from "./calc";
import { Icon } from "./icons";
import type { ChargeBasis, PriceCategory, PriceItem } from "./types";

type DraftItem = Omit<PriceItem, "unitPrice"> & { unitPrice: string };
type DraftCategory = {
  id: string;
  code: string;
  name: string;
  items: DraftItem[];
};

function draftFrom(categories: PriceCategory[]): DraftCategory[] {
  return categories.map((category) => ({
    id: category.id,
    code: category.code,
    name: category.name,
    items: category.items.map((item) => ({ ...item, unitPrice: String(item.unitPrice), notes: [...item.notes] })),
  }));
}

export function AdjustPage({
  categories,
  onSaved,
  onCancel,
}: {
  categories: PriceCategory[];
  onSaved: (categories: PriceCategory[]) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<DraftCategory[]>(() => draftFrom(categories));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<{ kind: "item" | "note"; categoryId: string; itemId: string; index: number } | null>(null);

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setDraft((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      })),
    );
  }

  function moveItem(categoryId: string, from: number, to: number) {
    if (from === to) return;
    setDraft((current) =>
      current.map((category) => {
        if (category.id !== categoryId) return category;
        const items = [...category.items];
        const [moved] = items.splice(from, 1);
        items.splice(to, 0, moved);
        return { ...category, items };
      }),
    );
  }

  function moveNote(itemId: string, from: number, to: number) {
    if (from === to) return;
    setDraft((current) =>
      current.map((category) => ({
        ...category,
        items: category.items.map((item) => {
          if (item.id !== itemId) return item;
          const notes = [...item.notes];
          const [moved] = notes.splice(from, 1);
          notes.splice(to, 0, moved);
          return { ...item, notes };
        }),
      })),
    );
  }

  async function save() {
    const items = draft.flatMap((category) => category.items);
    for (const item of items) {
      if (wholeCountInput(item.unitPrice) === null || item.name.trim() === "") {
        setError(t("adjust.priceRequired"));
        return;
      }
      const notes = item.notes.map((note) => note.trim()).filter((note) => note !== "");
      if (notes.length > item.noteCapacity) {
        setError(t("adjust.capacity", { code: item.displayCode || item.name, count: item.noteCapacity }));
        return;
      }
    }
    setSaving(true);
    setError("");
    try {
      const result = await savePriceList(
        items.map((item) => ({
          id: item.id,
          displayCode: item.displayCode.trim(),
          name: item.name.trim(),
          chargeBasis: item.chargeBasis,
          unitPrice: Number(item.unitPrice),
          group: item.group.trim(),
          notes: item.notes.map((note) => note.trim()).filter((note) => note !== ""),
        })),
      );
      setDraft(draftFrom(result.categories));
      onSaved(result.categories);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t("error.priceList"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="adjust">
      <div className="adjust-bar">
        <div>
          <h1>{t("adjust.title")}</h1>
          <p>{t("adjust.help")}</p>
        </div>
        <div className="adjust-actions">
          <button type="button" className="quiet" disabled={saving} onClick={onCancel}>
            {t("widget.cancel")}
          </button>
          <button type="button" className="primary" disabled={saving} onClick={() => void save()}>
            <Icon name="save" />
            <span>{saving ? t("adjust.saving") : t("adjust.save")}</span>
          </button>
        </div>
      </div>
      {error ? <p className="banner error">{error}</p> : null}
      <div className="categories">
        {draft.map((category) => (
          <section className="category" key={category.id}>
            <h2>
              {category.code}. {category.name}
            </h2>
            {category.items.map((item, itemIndex) => {
              const hidden = collapsed[item.id] === true;
              return (
              <div
                className={drag?.kind === "item" && drag.itemId === item.id ? "adjust-item dragging" : "adjust-item"}
                key={item.id}
                onDragOver={(event) => {
                  if (drag?.kind === "item" && drag.categoryId === category.id) event.preventDefault();
                }}
                onDrop={(event) => {
                  if (drag?.kind !== "item" || drag.categoryId !== category.id) return;
                  event.preventDefault();
                  moveItem(category.id, drag.index, itemIndex);
                  setDrag(null);
                }}
              >
                <div className="item-head">
                  <button
                    type="button"
                    className="quiet drag-handle"
                    draggable
                    aria-label={t("adjust.dragItem", { name: item.name || item.displayCode })}
                    onDragStart={() => setDrag({ kind: "item", categoryId: category.id, itemId: item.id, index: itemIndex })}
                    onDragEnd={() => setDrag(null)}
                  >
                    <Icon name="grip" />
                  </button>
                  <strong>
                    {item.displayCode}. {item.name}
                  </strong>
                  <button
                    type="button"
                    className="quiet"
                    aria-expanded={!hidden}
                    onClick={() => setCollapsed((current) => ({ ...current, [item.id]: !hidden }))}
                  >
                    <Icon name={hidden ? "show" : "hide"} />
                    <span>{hidden ? t("adjust.show") : t("adjust.hide")}</span>
                  </button>
                </div>
                {hidden ? null : (
                  <>
                <div className="grid">
                  <label>
                    <span>{t("adjust.code")}</span>
                    <input value={item.displayCode} onChange={(event) => updateItem(item.id, { displayCode: event.target.value })} />
                  </label>
                  <label>
                    <span>{t("adjust.name")}</span>
                    <input value={item.name} onChange={(event) => updateItem(item.id, { name: event.target.value })} />
                  </label>
                  <label>
                    <span>{t("adjust.price")}</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      inputMode="numeric"
                      value={item.unitPrice}
                      onKeyDown={(event) => {
                        if (["e", "E", "+", "-", "."].includes(event.key)) event.preventDefault();
                      }}
                      onChange={(event) => {
                        const next = wholeCountInput(event.target.value);
                        if (next === null) {
                          event.target.value = item.unitPrice;
                          return;
                        }
                        updateItem(item.id, { unitPrice: next });
                      }}
                    />
                  </label>
                  <label>
                    <span>{t("adjust.basis")}</span>
                    <select
                      value={item.chargeBasis}
                      onChange={(event) => updateItem(item.id, { chargeBasis: event.target.value as ChargeBasis })}
                    >
                      <option value="unit">{t("basis.unit")}</option>
                      <option value="month">{t("basis.month")}</option>
                      <option value="week">{t("basis.week")}</option>
                    </select>
                  </label>
                  <label className="span-2">
                    <span>{t("adjust.group")}</span>
                    <input value={item.group} onChange={(event) => updateItem(item.id, { group: event.target.value })} />
                  </label>
                </div>
                <div className="subitems">
                  <span>{t("adjust.subitems")}</span>
                  {item.notes.map((note, index) => (
                    <div
                      className={drag?.kind === "note" && drag.itemId === item.id && drag.index === index ? "subitem dragging" : "subitem"}
                      key={`${item.id}-${index}`}
                      onDragOver={(event) => {
                        if (drag?.kind === "note" && drag.itemId === item.id) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (drag?.kind !== "note" || drag.itemId !== item.id) return;
                        event.preventDefault();
                        event.stopPropagation();
                        moveNote(item.id, drag.index, index);
                        setDrag(null);
                      }}
                    >
                      <button
                        type="button"
                        className="quiet drag-handle"
                        draggable
                        aria-label={t("adjust.dragSubitem")}
                        onDragStart={(event) => {
                          event.stopPropagation();
                          setDrag({ kind: "note", categoryId: category.id, itemId: item.id, index });
                        }}
                        onDragEnd={() => setDrag(null)}
                      >
                        <Icon name="grip" />
                      </button>
                      <input
                        value={note}
                        aria-label={`${item.displayCode} ${t("adjust.subitems")} ${index + 1}`}
                        onChange={(event) => {
                          const notes = [...item.notes];
                          notes[index] = event.target.value;
                          updateItem(item.id, { notes });
                        }}
                      />
                      <button
                        type="button"
                        className="quiet"
                        onClick={() => updateItem(item.id, { notes: item.notes.filter((_, noteIndex) => noteIndex !== index) })}
                      >
                        {t("adjust.removeSubitem")}
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="quiet"
                    disabled={item.notes.length >= item.noteCapacity}
                    onClick={() => updateItem(item.id, { notes: [...item.notes, ""] })}
                  >
                    {t("adjust.addSubitem")}
                  </button>
                </div>
                  </>
                )}
              </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
