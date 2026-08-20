import React from "react";
import styled, { createGlobalStyle } from "styled-components";

/**
 * Shared UI kit for the "list" admin pages (Appointments, Clients, Companies,
 * Administrators): title, search/filter toolbar, table, pagination. These pages were each
 * hand-rolled with raw Bootstrap classes (oversized inputs/buttons, and pagination that
 * rendered one <li> per page number with no bound) — this kit replaces the visual layer only;
 * each page keeps its own socket data-fetching logic and just supplies columns/rows/handlers.
 *
 * Brand color is #FE634E (ClinicPlus primary), used for active/primary states only — not
 * decoratively — consistent with the sidebar and dashboard redesigns.
 */

export const token = {
  brand: "#FE634E",
  brandSoft: "#FEEAE7",
  brandDark: "#E14A34",
  ink900: "#0F172A",
  ink700: "#334155",
  ink500: "#64748B",
  line: "#E6EAF0",
  lineSoft: "#EFF2F6",
  surface: "#FFFFFF",
  canvas: "#F5F7FA",
  success: "#15803D",
  successSoft: "#E7F6EC",
  warning: "#B45309",
  warningSoft: "#FDF1E0",
  danger: "#B91C1C",
  dangerSoft: "#FBE9E9",
  radius: "12px",
  radiusSm: "8px",
  shadow: "0 1px 2px rgba(15, 23, 42, 0.04), 0 8px 24px -12px rgba(15, 23, 42, 0.10)",
};

export const FontImport = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@500;600;700;800&family=Noto+Sans:wght@400;500;600;700&display=swap');
`;

export const Page = styled.div`
  font-family: "Noto Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  color: ${token.ink900};
  padding: 24px clamp(16px, 3vw, 28px) 40px;
  max-width: 1500px;
  margin: 0 auto;

  h1, h2, h3, h4, h5, h6 {
    font-family: "Figtree", "Noto Sans", sans-serif;
    color: ${token.ink900};
    letter-spacing: -0.01em;
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 18px;
`;

const Eyebrow = styled.p`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: ${token.brand};
  margin: 0 0 2px;
`;

const Title = styled.h1`
  font-size: 21px;
  font-weight: 700;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 13px;
  color: ${token.ink500};
  margin: 2px 0 0;
`;

export const PageHeader = ({ eyebrow, title, subtitle, actions }) => (
  <HeaderRow>
    <div>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <Title>{title}</Title>
      {subtitle && <Subtitle>{subtitle}</Subtitle>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
  </HeaderRow>
);

/* Toolbar: search + filters ------------------------------------------- */

export const Toolbar = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 12px;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: ${(p) => p.$flex || "0 0 auto"};
  min-width: ${(p) => p.$minWidth || "auto"};
`;

export const FieldLabel = styled.label`
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: ${token.ink500};
`;

export const Input = styled.input`
  border: 1px solid ${token.line};
  background: ${token.surface};
  border-radius: ${token.radiusSm};
  padding: 8px 12px;
  font-size: 13px;
  color: ${token.ink900};
  height: 36px;
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 1px;
    border-color: ${token.brand};
  }
`;

export const Select = styled.select`
  appearance: none;
  border: 1px solid ${token.line};
  background: ${token.surface};
  border-radius: ${token.radiusSm};
  padding: 8px 30px 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: ${token.ink900};
  height: 36px;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 1px;
  }
`;

export const Button = styled.button`
  appearance: none;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 700;
  padding: 8px 14px;
  height: 36px;
  border-radius: ${token.radiusSm};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: background 150ms ease, opacity 150ms ease, border-color 150ms ease, color 150ms ease;
  white-space: nowrap;

  ${(p) =>
    p.$variant === "ghost"
      ? `
    background: ${token.surface};
    border-color: ${token.line};
    color: ${token.ink700};
    &:hover { background: ${token.canvas}; }
  `
      : `
    background: ${token.brand};
    color: #fff;
    &:hover { background: ${token.brandDark}; }
  `}

  &:disabled {
    opacity: 0.55;
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 2px;
  }
`;

export const FilterPillRow = styled.div`
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
`;

export const FilterPill = styled.button`
  appearance: none;
  border: 1px solid ${(p) => (p.$active ? token.brand : token.line)};
  background: ${(p) => (p.$active ? token.brandSoft : token.surface)};
  color: ${(p) => (p.$active ? token.brandDark : token.ink700)};
  font-size: 12px;
  font-weight: 700;
  padding: 7px 13px;
  border-radius: 999px;
  cursor: pointer;
  transition: all 150ms ease;
  &:hover {
    border-color: ${token.brand};
  }
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 2px;
  }
`;

export const StatusMessage = styled.div`
  font-size: 13px;
  font-weight: 600;
  padding: 10px 14px;
  border-radius: ${token.radiusSm};
  margin-bottom: 14px;
  ${(p) =>
    p.$tone === "danger"
      ? `background: ${token.dangerSoft}; color: ${token.danger};`
      : `background: ${token.canvas}; color: ${token.ink700};`}
`;

/* Table ----------------------------------------------------------------- */

export const TablePanel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  overflow: hidden;
`;

export const TableScroll = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;

  thead th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${token.ink500};
    padding: 11px 14px;
    background: ${token.canvas};
    border-bottom: 1px solid ${token.line};
    white-space: nowrap;
  }
  tbody td {
    padding: 11px 14px;
    border-bottom: 1px solid ${token.lineSoft};
    color: ${token.ink700};
    white-space: nowrap;
  }
  tbody tr:last-child td {
    border-bottom: none;
  }
  tbody tr:hover td {
    background: ${token.canvas};
  }
`;

export const RowActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 700;
  color: ${token.brand};
  text-decoration: none;
  &:hover {
    color: ${token.brandDark};
    text-decoration: underline;
  }
`;

const badgeTone = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "approved" || s === "no") return { bg: token.successSoft, fg: token.success };
  if (s === "pending") return { bg: token.warningSoft, fg: token.warning };
  if (s === "declined" || s === "yes") return { bg: token.dangerSoft, fg: token.danger };
  return { bg: token.canvas, fg: token.ink700 };
};

const BadgeEl = styled.span`
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  text-transform: capitalize;
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
`;

export const StatusBadge = ({ status }) => {
  const tone = badgeTone(status);
  return (
    <BadgeEl $bg={tone.bg} $fg={tone.fg}>
      {status}
    </BadgeEl>
  );
};

const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 64px 24px;
  text-align: center;
`;

export const EmptyState = ({ title, subtitle }) => (
  <EmptyWrap>
    <strong style={{ fontFamily: "Figtree, sans-serif", fontSize: 16 }}>{title}</strong>
    {subtitle && <span style={{ fontSize: 13, color: token.ink500 }}>{subtitle}</span>}
  </EmptyWrap>
);

/* Pagination -------------------------------------------------------------
   Replaces the old pattern of rendering one <li> per page number with no
   bound (an appointments list with 40 pages produced 40 tabs). Shows a
   bounded window of page numbers around the current page, with first/prev/
   next/last controls. */

const PagerWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid ${token.line};
  background: ${token.surface};
`;

const PagerInfo = styled.span`
  font-size: 12px;
  color: ${token.ink500};
`;

const PagerButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const PageBtn = styled.button`
  appearance: none;
  min-width: 30px;
  height: 30px;
  padding: 0 8px;
  border-radius: 7px;
  border: 1px solid ${(p) => (p.$active ? token.brand : "transparent")};
  background: ${(p) => (p.$active ? token.brandSoft : "transparent")};
  color: ${(p) => (p.$active ? token.brandDark : token.ink700)};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  &:hover:not(:disabled) {
    background: ${token.canvas};
  }
  &:disabled {
    opacity: 0.4;
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 1px;
  }
`;

const buildPageWindow = (current, pageCount, windowSize = 2) => {
  const start = Math.max(0, current - windowSize);
  const end = Math.min(pageCount - 1, current + windowSize);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
};

/**
 * `page` is 0-indexed. `pageCount` may be unknown (0) for "load more" style pagers — in that
 * case only prev/next render, no numbered window or total.
 */
export const Pagination = ({ page, pageCount = 0, onChange, totalLabel }) => {
  const hasCount = pageCount > 0;
  const pages = hasCount ? buildPageWindow(page, pageCount) : [];

  return (
    <PagerWrap>
      <PagerInfo>
        {totalLabel || (hasCount ? `Page ${page + 1} of ${pageCount}` : `Page ${page + 1}`)}
      </PagerInfo>
      <PagerButtons>
        {hasCount && (
          <PageBtn onClick={() => onChange(0)} disabled={page === 0} aria-label="First page">
            «
          </PageBtn>
        )}
        <PageBtn onClick={() => onChange(Math.max(0, page - 1))} disabled={page === 0} aria-label="Previous page">
          ‹
        </PageBtn>
        {pages.map((p) => (
          <PageBtn key={p} $active={p === page} onClick={() => onChange(p)} aria-current={p === page}>
            {p + 1}
          </PageBtn>
        ))}
        <PageBtn onClick={() => onChange(page + 1)} disabled={hasCount && page >= pageCount - 1} aria-label="Next page">
          ›
        </PageBtn>
        {hasCount && (
          <PageBtn onClick={() => onChange(pageCount - 1)} disabled={page >= pageCount - 1} aria-label="Last page">
            »
          </PageBtn>
        )}
      </PagerButtons>
    </PagerWrap>
  );
};
