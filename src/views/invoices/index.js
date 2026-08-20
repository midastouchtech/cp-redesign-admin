import moment from "moment";
import { isNil, isEmpty, repeat } from "ramda";
import React, { useEffect, useState } from "react";
import styled from "styled-components";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

// Null-safe — the pre-fix version crashed the whole list render whenever invoice.payment.amount
// (legacy socket shape) was undefined, since price.toFixed(2) throws on undefined. Now backed by
// a collection whose `amount` field is documented/enforced to always be a real number, but this
// stays defensive regardless.
const formatPrice = (price) => {
  return `R ${(price ?? 0).toFixed(2)}`;
};

const NoAppointments = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 500px;
  width: 100%;
`;

// Data source swapped from the legacy GET_ALL_INVOICES / GET_NEXT_PAGE_INVOICES / SEARCH_INVOICE
// socket calls (against clinicplus-server-latest-stable-version, left untouched/out of scope) to
// the backend's GET /api/admin/invoices, which reads the new invoices collection — populated
// going forward by POST /api/admin/invoices from both quote pages. Visual structure/columns are
// kept as close to the original as reasonable; only the data layer changed.
const Invoices = ({ socket }) => {
  const [invoices, setInvoices] = useState(null);
  const [page, setPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [companyTerm, setCompanyTerm] = useState("");
  const [clientTerm, setClientTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = (targetPage) => {
    if (!COMPANION_API_URL) {
      setError("REACT_APP_COMPANION_API_URL is not configured");
      return;
    }
    setLoading(true);
    setError(null);

    const query = new URLSearchParams();
    if (companyTerm.trim()) query.set("company", companyTerm.trim());
    if (clientTerm.trim()) query.set("client", clientTerm.trim());
    if (dateFrom) query.set("dateFrom", dateFrom);
    if (dateTo) query.set("dateTo", dateTo);
    if (amountMin) query.set("amountMin", amountMin);
    if (amountMax) query.set("amountMax", amountMax);
    query.set("page", String(targetPage));

    fetch(`${COMPANION_API_URL}/api/admin/invoices?${query.toString()}`, {
      headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET || "" },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed: ${res.status}`))))
      .then((data) => {
        setInvoices(data.invoices || []);
        setPageCount(data.pageCount || 0);
        setPage(data.page || 0);
      })
      .catch((err) => {
        console.warn("[invoices] failed to fetch", err);
        setError("Failed to load invoices");
        setInvoices([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchInvoices(0);
  };

  const clearSearch = () => {
    setCompanyTerm("");
    setClientTerm("");
    setDateFrom("");
    setDateTo("");
    setAmountMin("");
    setAmountMax("");
    fetchInvoices(0);
  };

  const getPageInvoices = (p) => {
    if (p < 0) return;
    fetchInvoices(p);
  };

  return (
    <div className="container-fluid">
      <div className="d-flex flex-wrap mb-2 align-items-center justify-content-between">
        <div className="mb-3 mr-3">
          <h6 className="fs-16 text-black font-w600 mb-0">
            Invoices
          </h6>
          <span className="fs-14"> All invoices sent listed here </span>
        </div>
      </div>
      <div className="row mb-2">
        <div className="col-3">
          <input
            type="text"
            className="form-control input-default"
            placeholder="Company"
            onChange={(e) => setCompanyTerm(e.target.value)}
            value={companyTerm}
          />
        </div>
        <div className="col-3">
          <input
            type="text"
            className="form-control input-default"
            placeholder="Client name"
            onChange={(e) => setClientTerm(e.target.value)}
            value={clientTerm}
          />
        </div>
        <div className="col-2">
          <input
            type="date"
            className="form-control input-default"
            onChange={(e) => setDateFrom(e.target.value)}
            value={dateFrom}
          />
        </div>
        <div className="col-2">
          <input
            type="date"
            className="form-control input-default"
            onChange={(e) => setDateTo(e.target.value)}
            value={dateTo}
          />
        </div>
        <div className="col-1">
          <input
            type="number"
            className="form-control input-default"
            placeholder="Min R"
            onChange={(e) => setAmountMin(e.target.value)}
            value={amountMin}
          />
        </div>
        <div className="col-1">
          <input
            type="number"
            className="form-control input-default"
            placeholder="Max R"
            onChange={(e) => setAmountMax(e.target.value)}
            value={amountMax}
          />
        </div>
      </div>
      <div className="row mb-3">
        <div className="col-2">
          <button type="button" className="btn btn-primary btn-block" onClick={handleSearch}>Search</button>
        </div>
        <div className="col-2">
          <button type="button" className="btn btn-secondary btn-block" onClick={clearSearch}>Clear</button>
        </div>
      </div>
      <div className="row">
        <div className="col-12 d-flex justify-content-center">
          {loading && (
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading invoices</span>
            </div>
          )}
        </div>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
      </div>
      <br />
      <div className="row">
        <div className="col-xl-12">
          <div className="tab-content">
            <div id="All" className="tab-pane active fade show">
              <div className="table-responsive">
                {!isNil(invoices) && !isEmpty(invoices) && (
                  <table
                    id="example2"
                    className="table card-table display dataTablesCard"
                  >
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Company</th>
                        <th>Client</th>
                        <th>Emailed to</th>
                        <th>Amount </th>
                        <th>Date Sent</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices?.map((invoice, index) => (
                        <tr key={invoice._id || index}>
                          <td>{invoice?.invoiceId}</td>
                          <td>{invoice?.companyName}</td>
                          <td>{invoice?.clientName}</td>
                          <td>{(invoice?.emailedTo || []).join(", ")}</td>
                          <td>{formatPrice(invoice?.amount)}</td>
                          <td>{invoice?.sentAt ? moment(invoice.sentAt).format("DD MMM YYYY HH:mm") : ""}</td>
                          <td>
                            {invoice?.pdfUrl && (
                              <a href={invoice.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-primary">View</a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {!loading && (isNil(invoices) || isEmpty(invoices)) && (
                  <NoAppointments>
                    <div className="d-flex">
                      <h1>No Invoices</h1>
                    </div>
                  </NoAppointments>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="event-tabs mb-3 mr-3">
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item">
            <a
              className="nav-link"
              onClick={() => getPageInvoices(page === 0 ? 0 : page - 1)}
            >
              Prev Page
            </a>
          </li>
          <li className="nav-item">
            <a
              className="nav-link"
              onClick={() => getPageInvoices(page + 1)}
            >
              Next Page
            </a>
          </li>
          {repeat("i", pageCount).map((i, index) => (
            <li className="nav-item" key={index}>
              <a
                className="nav-link"
                onClick={() => getPageInvoices(index)}
              >
                Page {index + 1}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Invoices;
