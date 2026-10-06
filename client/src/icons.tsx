import type { ReactNode } from "react";

type IconName =
  | "plus"
  | "sample"
  | "logout"
  | "language"
  | "save"
  | "excel"
  | "month"
  | "week"
  | "signin"
  | "trash"
  | "export"
  | "show"
  | "hide"
  | "adjust"
  | "grip"
  | "left"
  | "right";

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="icon" viewBox="0 0 16 16" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

const paths: Record<IconName, ReactNode> = {
  plus: (
    <>
      <path d="M8 3v10" />
      <path d="M3 8h10" />
    </>
  ),
  sample: (
    <>
      <path d="M4 2.5h5.5L13 6v7.5H4z" />
      <path d="M9.5 2.5V6H13" />
      <path d="M6 9h4" />
      <path d="M6 11.5h4" />
    </>
  ),
  logout: (
    <>
      <path d="M6.5 3H3.5v10h3" />
      <path d="M7 8h6" />
      <path d="M10.5 5.5 13 8l-2.5 2.5" />
    </>
  ),
  language: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M2.5 8h11" />
      <path d="M8 2.6c1.6 1.5 2.4 3.3 2.4 5.4S9.6 11.9 8 13.4C6.4 11.9 5.6 10.1 5.6 8S6.4 4.1 8 2.6z" />
    </>
  ),
  save: (
    <>
      <path d="M3 3h7.5L13 5.5V13H3z" />
      <path d="M5 3v3.5h5" />
      <path d="M5 13v-3.5h6V13" />
    </>
  ),
  excel: (
    <>
      <path d="M4 2.5h5.5L13 6v7.5H4z" />
      <path d="M9.5 2.5V6H13" />
      <path d="M6.2 8.2 9.8 11.8" />
      <path d="M9.8 8.2 6.2 11.8" />
    </>
  ),
  month: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
      <path d="M2.5 6.5h11" />
      <path d="M5.5 2.5v2" />
      <path d="M10.5 2.5v2" />
    </>
  ),
  week: (
    <>
      <rect x="2.5" y="3.5" width="11" height="10" rx="1" />
      <path d="M2.5 6.5h11" />
      <path d="M5.5 6.5v7" />
      <path d="M8 6.5v7" />
      <path d="M10.5 6.5v7" />
    </>
  ),
  signin: (
    <>
      <path d="M9.5 3H12.5v10H9.5" />
      <path d="M3 8h6" />
      <path d="M6.5 5.5 9 8l-2.5 2.5" />
    </>
  ),
  trash: (
    <>
      <path d="M3.5 4.5h9" />
      <path d="M6.5 4.5V3h3v1.5" />
      <path d="M5 4.5l.5 8.5h5L11 4.5" />
    </>
  ),
  export: (
    <>
      <path d="M3 10.5V13h10v-2.5" />
      <path d="M8 3v7" />
      <path d="M5.5 7.5 8 10l2.5-2.5" />
    </>
  ),
  show: (
    <>
      <path d="M4 6.5 8 10.5 12 6.5" />
    </>
  ),
  hide: (
    <>
      <path d="M4 10 8 6 12 10" />
    </>
  ),
  adjust: (
    <>
      <path d="M9.5 2.5 13 6l-7 7H2.5V9.5z" />
      <path d="M8 4 11.5 7.5" />
    </>
  ),
  grip: (
    <>
      <path d="M5 4v8" />
      <path d="M8 4v8" />
      <path d="M11 4v8" />
    </>
  ),
  left: <path d="M10 3.5 5.5 8 10 12.5" />,
  right: <path d="M6 3.5 10.5 8 6 12.5" />,
};
