import React, { useMemo, useState } from "react";
import styled from "styled-components";
import moment from "moment";
import { Toolbar, Field, FieldLabel, Select, Button, StatusMessage, EmptyState, token } from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const CLINICS = ["Hendrina", "Churchill"];

const STATUS_STYLES = {
  open: { bg: token.successSoft, fg: token.success, border: "#bfe6cc" },
  filling: { bg: token.warningSoft, fg: token.warning, border: "#f5dcb0" },
  full: { bg: token.dangerSoft, fg: token.danger, border: "#f3c9c9" },
};
const UNKNOWN_STYLE = { bg: token.canvas, fg: token.ink500, border: token.line };
const STATUS_LABELS = { open: "Open", filling: "Filling up", full: "Fully booked" };

const CalendarPanel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 18px 20px;
`;

const MonthNav = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const MonthLabel = styled.span`
  font-family: "Figtree", sans-serif;
  font-weight: 700;
  font-size: 15px;
  min-width: 160px;
  text-align: center;
`;

const LimitLine = styled.p`
  font-size: 12px;
  color: ${token.ink500};
  margin: 0 0 14px;
`;

const WeekdayRow = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
  margin-bottom: 6px;
`;

const WeekdayLabel = styled.div`
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: ${token.ink500};
  text-transform: uppercase;
`;

const MonthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
`;

const DayCard = styled.div`
  min-height: 78px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.$border};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  padding: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  font-size: 11px;
`;

const DayNumber = styled.span`
  font-weight: 700;
  font-size: 13px;
`;

const WeekGrid = styled(MonthGrid)`
  margin-bottom: 16px;
`;

const DayDetailCard = styled.div`
  border-radius: ${token.radius};
  border: 1px solid ${(p) => p.$border};
  background: ${(p) => p.$bg};
  color: ${(p) => p.$fg};
  padding: 24px;
  text-align: center;
`;

const DayDetailValue = styled.div`
  font-family: "Figtree", sans-serif;
  font-size: 40px;
  font-weight: 700;
  margin: 8px 0;
`;

const LegendRow = styled.div`
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 12px;
  color: ${token.ink500};
  margin-top: 16px;
`;

const LegendSwatch = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &::before {
    content: "";
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: ${(p) => p.$color};
    display: inline-block;
  }
`;

const ViewTabs = styled.div`
  display: inline-flex;
  background: ${token.canvas};
  border: 1px solid ${token.line};
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
`;

const ViewTab = styled.button`
  appearance: none;
  border: none;
  background: ${(p) => (p.$active ? token.surface : "transparent")};
  color: ${(p) => (p.$active ? token.ink900 : token.ink500)};
  box-shadow: ${(p) => (p.$active ? "0 1px 3px rgba(15,23,42,0.10)" : "none")};
  font-size: 12px;
  font-weight: 700;
  padding: 7px 14px;
  border-radius: 8px;
  cursor: pointer;
`;

const daysInMonth = (year, month) => new Date(year, month, 0).getDate();

const CapacityCalendar = () => {
  const [clinic, setClinic] = useState(CLINICS[0]);
  const [year, setYear] = useState(moment().year());
  const [month, setMonth] = useState(moment().month() + 1); // 1-indexed
  const [viewMode, setViewMode] = useState("month"); // 'month' | 'week' | 'day'
  const [selectedDate, setSelectedDate] = useState(moment().format("YYYY-MM-DD"));

  const fetcher = useMemo(
    () => async () => {
      const params = new URLSearchParams({ clinic, year: String(year), month: String(month) });
      const res = await fetch(`${COMPANION_API_URL}/api/admin/availability/capacity?${params}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load capacity (${res.status})`);
      return res.json();
    },
    [clinic, year, month]
  );

  const { data, loading, error, refreshing, cachedAt } = useCachedFetch(
    `admin-availability-capacity:${clinic}:${year}-${String(month).padStart(2, "0")}`,
    fetcher
  );

  const changeMonth = (delta) => {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }
    setMonth(newMonth);
    setYear(newYear);
  };

  const total = daysInMonth(year, month);
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  const monthLabel = new Date(year, month - 1, 1).toLocaleDateString("en-ZA", { month: "long", year: "numeric" });

  const infoFor = (day) => {
    if (!day) return null;
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return data?.days?.[dateStr] || null;
  };

  const hasLoaded = !!data;

  // Week view: the 7 days (Sun-Sat) containing selectedDate, sourced from the same month payload
  // — a separate week only needs its own fetch if it spans two different months' data, so refetch
  // that edge case's missing side rather than always issuing two requests.
  const weekStart = moment(selectedDate).startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) => moment(weekStart).add(i, "days"));
  const weekNeedsOtherMonth = weekDays.some((d) => d.month() + 1 !== month || d.year() !== year);

  const dayInfo = data?.days?.[selectedDate] || null;

  return (
    <CalendarPanel>
      <Toolbar style={{ marginBottom: 16 }}>
        <Field $minWidth="160px">
          <FieldLabel>Clinic</FieldLabel>
          <Select value={clinic} onChange={(e) => setClinic(e.target.value)}>
            {CLINICS.map((c) => (
              <option value={c} key={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
        <Field $minWidth="180px">
          <FieldLabel>View</FieldLabel>
          <ViewTabs>
            {["month", "week", "day"].map((v) => (
              <ViewTab key={v} $active={viewMode === v} onClick={() => setViewMode(v)}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </ViewTab>
            ))}
          </ViewTabs>
        </Field>
        {viewMode !== "month" && (
          <Field $minWidth="160px">
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const d = moment(e.target.value);
                setSelectedDate(e.target.value);
                setYear(d.year());
                setMonth(d.month() + 1);
              }}
              style={{ border: `1px solid ${token.line}`, borderRadius: token.radiusSm, padding: "8px 12px", fontSize: 13, height: 36 }}
            />
          </Field>
        )}
      </Toolbar>

      {error && <StatusMessage $tone="danger">Failed to load capacity: {error}</StatusMessage>}

      {viewMode === "month" && (
        <>
          <MonthNav style={{ marginBottom: 12 }}>
            <Button $variant="ghost" onClick={() => changeMonth(-1)}>
              ‹
            </Button>
            <MonthLabel>{monthLabel}</MonthLabel>
            <Button $variant="ghost" onClick={() => changeMonth(1)}>
              ›
            </Button>
            {(refreshing || cachedAt) && (
              <span style={{ fontSize: 11, color: token.ink500, marginLeft: 8 }}>
                {refreshing ? "Refreshing…" : `Updated ${moment(cachedAt).fromNow()}`}
              </span>
            )}
          </MonthNav>

          {data?.limit != null && (
            <LimitLine>
              Clinic limit: <strong>{data.limit}</strong> employees/day
            </LimitLine>
          )}

          {loading && !data ? (
            <StatusMessage>Loading…</StatusMessage>
          ) : (
            <>
              <WeekdayRow>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <WeekdayLabel key={d}>{d}</WeekdayLabel>
                ))}
              </WeekdayRow>
              <MonthGrid>
                {cells.map((day, i) => {
                  if (day === null) return <div key={`empty-${i}`} />;
                  const info = infoFor(day);
                  const style = !hasLoaded ? UNKNOWN_STYLE : STATUS_STYLES[info?.status || "open"];
                  return (
                    <DayCard key={day} $bg={style.bg} $fg={style.fg} $border={style.border}>
                      <DayNumber>{day}</DayNumber>
                      {hasLoaded ? (
                        <div>
                          <div style={{ fontWeight: 700 }}>{STATUS_LABELS[info?.status || "open"]}</div>
                          <div style={{ opacity: 0.85 }}>{info?.currentBookings ?? 0} booked</div>
                          <div style={{ opacity: 0.7 }}>{info ? info.remaining : data?.limit ?? "—"} open</div>
                        </div>
                      ) : (
                        <div style={{ opacity: 0.6 }}>—</div>
                      )}
                    </DayCard>
                  );
                })}
              </MonthGrid>
            </>
          )}

          <LegendRow>
            <LegendSwatch $color={STATUS_STYLES.open.bg}>Open (&lt;70%)</LegendSwatch>
            <LegendSwatch $color={STATUS_STYLES.filling.bg}>Filling up (70–99%)</LegendSwatch>
            <LegendSwatch $color={STATUS_STYLES.full.bg}>Fully booked (100%+)</LegendSwatch>
          </LegendRow>
        </>
      )}

      {viewMode === "week" && (
        <>
          <p style={{ fontSize: 12, color: token.ink500, marginBottom: 12 }}>
            Week of {weekStart.format("D MMM YYYY")}
            {weekNeedsOtherMonth && " — some days fall in a different month; switch to Month view for those days."}
          </p>
          {loading && !data ? (
            <StatusMessage>Loading…</StatusMessage>
          ) : (
            <WeekGrid>
              {weekDays.map((d) => {
                const dateStr = d.format("YYYY-MM-DD");
                const sameMonth = d.month() + 1 === month && d.year() === year;
                const info = sameMonth ? data?.days?.[dateStr] : null;
                const style = !sameMonth || !hasLoaded ? UNKNOWN_STYLE : STATUS_STYLES[info?.status || "open"];
                return (
                  <DayCard key={dateStr} $bg={style.bg} $fg={style.fg} $border={style.border}>
                    <DayNumber>{d.format("ddd D")}</DayNumber>
                    {sameMonth && hasLoaded ? (
                      <div>
                        <div style={{ fontWeight: 700 }}>{STATUS_LABELS[info?.status || "open"]}</div>
                        <div style={{ opacity: 0.85 }}>{info?.currentBookings ?? 0} booked</div>
                        <div style={{ opacity: 0.7 }}>{info ? info.remaining : data?.limit ?? "—"} open</div>
                      </div>
                    ) : (
                      <div style={{ opacity: 0.6 }}>—</div>
                    )}
                  </DayCard>
                );
              })}
            </WeekGrid>
          )}
        </>
      )}

      {viewMode === "day" && (
        <>
          {loading && !data ? (
            <StatusMessage>Loading…</StatusMessage>
          ) : dayInfo ? (
            <DayDetailCard
              $bg={STATUS_STYLES[dayInfo.status].bg}
              $fg={STATUS_STYLES[dayInfo.status].fg}
              $border={STATUS_STYLES[dayInfo.status].border}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{moment(selectedDate).format("dddd, D MMMM YYYY")}</span>
              <DayDetailValue>{STATUS_LABELS[dayInfo.status]}</DayDetailValue>
              <div style={{ fontSize: 14 }}>
                {dayInfo.currentBookings} employees booked · {dayInfo.appointmentCount} appointments · {dayInfo.remaining} slots open
                {data?.limit != null && ` (of ${data.limit})`}
              </div>
            </DayDetailCard>
          ) : (
            <EmptyState title="No bookings" subtitle={`No employees booked at ${clinic} on ${moment(selectedDate).format("D MMMM YYYY")}.`} />
          )}
        </>
      )}
    </CalendarPanel>
  );
};

export default CapacityCalendar;
