import { isNil, isEmpty, insert } from "ramda";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CSVLink } from "react-csv";
import {
  FontImport,
  Page,
  PageHeader,
  Toolbar,
  Field,
  FieldLabel,
  Input,
  Select,
  Button,
  FilterPillRow,
  FilterPill,
  StatusMessage,
  TablePanel,
  TableScroll,
  Table,
  RowActionLink,
  StatusBadge,
  EmptyState,
  Pagination,
} from "../../components/ListPage";

const STATUS_FILTERS = [
  { value: "all", label: "Any status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "declined", label: "Declined" },
];

const Appointments = ({ socket }) => {
  const [appointments, setAppointments] = useState(null);
  const [originalAppointments, setOriginalAppointments] = useState(null);
  const [monthType, setMonthType] = useState("any");
  const [statusType, setStatusType] = useState("all");
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [pageLimit, setPageLimit] = useState("25");
  const [hasRequested, setHasRequested] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [appCount, setAppCount] = useState(0);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_APPOINTMENT", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT", (data) => {
      setAppointments(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_APPOINTMENT_NOT_FOUND", () => {
      setAppointments(originalAppointments);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setAppointments(originalAppointments);
    setSearchTerm("");
    setFromDate("");
    setNotFound(false);
  };

  const handleFilter = () => {
    socket.emit("GET_APPOINTMENTS_BY_DATE", { date: fromDate });
    socket.on("RECEIVE_APPOINTMENTS_BY_DATE", (newAppointments) => {
      setAppointments(newAppointments);
    });
  };

  const csvData =
    !isNil(appointments) && !isEmpty(appointments)
      ? insert(
          0,
          ["appointmentId", "userName", "purchaseOrderNumber", "companyName", "location", "appointmentDate", "status"],
          appointments.map((appointment) => [
            appointment?.id,
            appointment?.usersWhoCanManage[0]?.name,
            appointment?.details?.purchaseOrderNumber,
            appointment?.details?.company?.name,
            appointment?.details?.clinic,
            appointment?.details?.date,
            appointment?.status,
          ])
        )
      : [];

  const getAllAppointments = () => {
    socket.emit("GET_ALL_APPOINTMENTS", { pageLimit });
    socket.on("RECEIVE_ALL_APPOINTMENTS", (data) => {
      const { apps, count } = data;
      setAppointments(apps);
      setPageCount(Math.ceil(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
    });
  };

  useEffect(() => {
    if (socket && !appointments && hasRequested === false) {
      setHasRequested(true);
      getAllAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const setAppointmentsType = (type) => {
    setStatusType(type);
    if (type === "all") {
      setAppointments(originalAppointments);
    } else {
      setAppointments(originalAppointments.filter((appointment) => appointment.status === type));
    }
  };

  const getCurrentMonthsAppointments = (p) => {
    socket.emit("GET_CURRENT_MONTHS_APPOINTMENTS", { page: p, pageLimit });
    socket.on("RECEIVE_CURRENT_MONTHS_APPOINTMENTS", (data) => {
      const { apps, count } = data;
      setAppointments(apps);
      setPageCount(Math.ceil(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("current");
      setPage(p);
    });
  };

  const getNextMonthsAppointments = (p) => {
    socket.emit("GET_NEXT_MONTHS_APPOINTMENTS", { page: p, pageLimit });
    socket.on("RECEIVE_NEXT_MONTHS_APPOINTMENTS", (data) => {
      const { apps, count } = data;
      setAppointments(apps);
      setPageCount(Math.ceil(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("next");
      setPage(p);
    });
  };

  const getPrevMonthsAppointments = (p) => {
    socket.emit("GET_PREVIOUS_MONTHS_APPOINTMENTS", { page: p, pageLimit });
    socket.on("RECEIVE_PREVIOUS_MONTHS_APPOINTMENTS", (data) => {
      const { apps, count } = data;
      setAppointments(apps);
      setPageCount(Math.ceil(count / pageLimit));
      setAppCount(count);
      setOriginalAppointments(apps);
      setMonthType("prev");
      setPage(p);
    });
  };

  const functionsByMonth = {
    any: getAllAppointments,
    current: getCurrentMonthsAppointments,
    next: getNextMonthsAppointments,
    prev: getPrevMonthsAppointments,
  };

  const getAppointmentsByMonth = (e) => {
    const month = e.target.value;
    if (monthType !== month) {
      functionsByMonth[month](0);
      setMonthType(month);
    }
  };

  const getPageAppointments = (p) => {
    if (monthType === "any") {
      socket.emit("GET_NEXT_PAGE_APPOINTMENTS", { page: p, pageLimit });
      socket.on("RECEIVE_NEXT_PAGE_APPOINTMENTS", (data) => {
        const { apps, count } = data;
        setAppointments(apps);
        setPageCount(Math.ceil(count / pageLimit));
        setAppCount(count);
        setOriginalAppointments(apps);
        setPage(p);
      });
    } else {
      functionsByMonth[monthType](p);
    }
  };

  const handlePageLimitChange = (e) => {
    setPageLimit(e.target.value);
  };

  useEffect(() => {
    if (hasRequested) {
      functionsByMonth[monthType](0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageLimit]);

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Bookings" title="Appointments" subtitle={`Querying from ${appCount} appointments`} />

      <Toolbar>
        <Field $minWidth="160px">
          <FieldLabel>Month</FieldLabel>
          <Select value={monthType} onChange={getAppointmentsByMonth}>
            <option value="any">All</option>
            <option value="current">Current month</option>
            <option value="next">Next month</option>
            <option value="prev">Prev month</option>
          </Select>
        </Field>

        <Field $minWidth="110px">
          <FieldLabel>Page size</FieldLabel>
          <Select value={pageLimit} onChange={handlePageLimitChange}>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </Select>
        </Field>

        <Field $flex="1 1 240px" $minWidth="200px">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="text"
            placeholder="Company, user or appointment ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Field>

        <Field $minWidth="150px">
          <FieldLabel>Date</FieldLabel>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </Field>

        <div style={{ display: "flex", gap: 8 }}>
          <Button onClick={fromDate ? handleFilter : handleSearch} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </Button>
          <Button $variant="ghost" onClick={clearSearch}>
            Clear
          </Button>
        </div>

        <Field $flex="1 0 100%">
          <FieldLabel>Status</FieldLabel>
          <FilterPillRow>
            {STATUS_FILTERS.map((f) => (
              <FilterPill key={f.value} $active={statusType === f.value} onClick={() => setAppointmentsType(f.value)}>
                {f.label}
              </FilterPill>
            ))}
            <CSVLink data={csvData} filename="report.csv" style={{ marginLeft: "auto" }}>
              <Button $variant="ghost" as="span">
                Export CSV
              </Button>
            </CSVLink>
          </FilterPillRow>
        </Field>
      </Toolbar>

      {notFound && <StatusMessage $tone="danger">Appointment could not be found.</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {!isNil(appointments) && !isEmpty(appointments) ? (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>PON</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appointment, index) => (
                  <tr key={index}>
                    <td>{appointment?.id}</td>
                    <td>{appointment?.usersWhoCanManage[0]?.name}</td>
                    <td>{appointment?.details?.purchaseOrderNumber}</td>
                    <td>{appointment?.details?.company.name}</td>
                    <td>{appointment?.details?.clinic}</td>
                    <td>{appointment?.details?.date}</td>
                    <td>
                      <StatusBadge status={appointment?.status} />
                    </td>
                    <td>
                      <RowActionLink as={Link} to={`/appointment/${appointment?.id}`}>
                        Open
                      </RowActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No appointments" subtitle="Try a different search term or filter." />
          )}
        </TableScroll>
        <Pagination page={page} pageCount={pageCount} onChange={getPageAppointments} />
      </TablePanel>
    </Page>
  );
};

export default Appointments;
