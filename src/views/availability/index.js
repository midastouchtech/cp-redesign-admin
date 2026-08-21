import React, { useMemo, useState } from "react";
import styled from "styled-components";
import moment from "moment";
import { FontImport, Page, PageHeader, Toolbar, Field, FieldLabel, Select, StatusMessage, EmptyState, token } from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";
import CapacityCalendar from "./CapacityCalendar";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const CLINICS = ["Hendrina", "Churchill"];

const CalendarWrap = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  overflow: hidden;
`;

const EmployeeRow = styled.div`
  display: grid;
  grid-template-columns: 220px 1fr;
  border-bottom: 1px solid ${token.lineSoft};
  &:last-child {
    border-bottom: none;
  }
`;

const EmployeeName = styled.div`
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 600;
  color: ${token.ink900};
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-right: 1px solid ${token.lineSoft};
`;

const EmployeeMeta = styled.span`
  font-size: 11px;
  font-weight: 500;
  color: ${token.ink500};
`;

const DayCells = styled.div`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$days}, minmax(28px, 1fr));
`;

const DayCell = styled.div`
  height: 100%;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid ${token.lineSoft};
  background: ${(p) => (p.$booked ? token.brandSoft : "transparent")};
  &:last-child {
    border-right: none;
  }
`;

const BookedDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${token.brand};
`;

const HeaderCells = styled(DayCells)`
  border-bottom: 1px solid ${token.line};
  background: ${token.canvas};
`;

const HeaderCell = styled.div`
  padding: 8px 2px;
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  color: ${token.ink500};
  border-right: 1px solid ${token.lineSoft};
  &:last-child {
    border-right: none;
  }
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
  color: ${token.ink500};
  margin-bottom: 14px;
`;

const LegendItem = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

const PageTabs = styled.div`
  display: inline-flex;
  background: ${token.canvas};
  border: 1px solid ${token.line};
  border-radius: 10px;
  padding: 3px;
  gap: 2px;
  margin-bottom: 18px;
`;

const PageTab = styled.button`
  appearance: none;
  border: none;
  background: ${(p) => (p.$active ? token.surface : "transparent")};
  color: ${(p) => (p.$active ? token.ink900 : token.ink500)};
  box-shadow: ${(p) => (p.$active ? "0 1px 3px rgba(15,23,42,0.10)" : "none")};
  font-size: 13px;
  font-weight: 700;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
`;

const EmployeeBookingsTab = ({ clinic, setClinic, monthValue, setMonthValue }) => {

  const [year, month] = monthValue.split("-").map(Number);

  const fetcher = useMemo(
    () => async () => {
      const params = new URLSearchParams({ clinic, year: String(year), month: String(month) });
      const res = await fetch(`${COMPANION_API_URL}/api/admin/availability?${params}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load availability (${res.status})`);
      return res.json();
    },
    [clinic, year, month]
  );

  const { data, loading, error, refreshing, cachedAt } = useCachedFetch(
    `admin-availability:${clinic}:${monthValue}`,
    fetcher
  );

  const daysInMonth = data?.daysInMonth || moment(monthValue, "YYYY-MM").daysInMonth();
  const dayNumbers = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isBooked = (employee, day) => {
    const dateStr = `${monthValue}-${String(day).padStart(2, "0")}`;
    return employee.bookedDates.some((b) => b.date === dateStr);
  };

  return (
    <>
      <p style={{ fontSize: 13, color: token.ink500, margin: "0 0 14px" }}>
        {data
          ? `${data.employees.length} employees booked at ${clinic} in ${moment(monthValue, "YYYY-MM").format("MMMM YYYY")}${
              cachedAt ? ` · updated ${moment(cachedAt).fromNow()}` : ""
            }${refreshing ? " · refreshing…" : ""}`
          : "See which employees are already booked at a clinic, per day"}
      </p>

      <Toolbar>
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
        <Field $minWidth="160px">
          <FieldLabel>Month</FieldLabel>
          <input
            type="month"
            value={monthValue}
            onChange={(e) => setMonthValue(e.target.value)}
            style={{
              border: `1px solid ${token.line}`,
              borderRadius: token.radiusSm,
              padding: "8px 12px",
              fontSize: 13,
              height: 36,
            }}
          />
        </Field>
      </Toolbar>

      {error && <StatusMessage $tone="danger">Failed to load availability: {error}</StatusMessage>}

      <Legend>
        <LegendItem>
          <BookedDot /> Booked that day
        </LegendItem>
        <span>No employee schedule exists in this system — every unmarked day is implicitly open.</span>
      </Legend>

      <CalendarWrap>
        {loading && !data ? (
          <StatusMessage style={{ margin: 20 }}>Loading…</StatusMessage>
        ) : data?.employees?.length ? (
          <>
            <EmployeeRow>
              <EmployeeName>Employee</EmployeeName>
              <HeaderCells $days={daysInMonth}>
                {dayNumbers.map((d) => (
                  <HeaderCell key={d}>{d}</HeaderCell>
                ))}
              </HeaderCells>
            </EmployeeRow>
            {data.employees.map((employee) => (
              <EmployeeRow key={employee.idNumber || employee.nameKey}>
                <EmployeeName>
                  {employee.displayName}
                  {employee.occupation && <EmployeeMeta>{employee.occupation}</EmployeeMeta>}
                </EmployeeName>
                <DayCells $days={daysInMonth}>
                  {dayNumbers.map((d) => {
                    const booked = isBooked(employee, d);
                    const dateStr = `${monthValue}-${String(d).padStart(2, "0")}`;
                    const bookingsOnDay = employee.bookedDates.filter((b) => b.date === dateStr);
                    const title = bookingsOnDay.map((b) => `${b.companyName || "Unknown company"} (${b.status})`).join(", ");
                    return (
                      <DayCell key={d} $booked={booked} title={booked ? title : "Open"}>
                        {booked && <BookedDot />}
                      </DayCell>
                    );
                  })}
                </DayCells>
              </EmployeeRow>
            ))}
          </>
        ) : (
          <EmptyState
            title="No bookings this month"
            subtitle={`No employees are booked at ${clinic} in ${moment(monthValue, "YYYY-MM").format("MMMM YYYY")}.`}
          />
        )}
      </CalendarWrap>
    </>
  );
};

const Availability = () => {
  const [activeTab, setActiveTab] = useState("capacity"); // 'bookings' | 'capacity'
  const [clinic, setClinic] = useState(CLINICS[0]);
  const [monthValue, setMonthValue] = useState(moment().format("YYYY-MM"));

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Scheduling"
        title="Availability Checker"
        subtitle="Employee bookings and clinic-wide capacity, per day, week, or month"
      />

      <PageTabs>
        <PageTab $active={activeTab === "bookings"} onClick={() => setActiveTab("bookings")}>
          Employee Bookings
        </PageTab>
        <PageTab $active={activeTab === "capacity"} onClick={() => setActiveTab("capacity")}>
          Clinic Capacity
        </PageTab>
      </PageTabs>

      {activeTab === "bookings" ? (
        <EmployeeBookingsTab clinic={clinic} setClinic={setClinic} monthValue={monthValue} setMonthValue={setMonthValue} />
      ) : (
        <CapacityCalendar />
      )}
    </Page>
  );
};

export default Availability;
