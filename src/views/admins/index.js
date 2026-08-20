import { isNil, isEmpty } from "ramda";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FontImport,
  Page,
  PageHeader,
  Toolbar,
  Field,
  FieldLabel,
  Input,
  Button,
  StatusMessage,
  TablePanel,
  TableScroll,
  Table,
  RowActionLink,
  EmptyState,
  Pagination,
} from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";

const Admins = ({ socket }) => {
  const [admins, setAdmins] = useState(null);
  const [originalAdmins, setOriginalAdmins] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [ticketCounts, setTicketCounts] = useState({});

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_ADMIN", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_ADMIN", (data) => {
      setAdmins(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_ADMIN_NOT_FOUND", () => {
      setAdmins(originalAdmins);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setAdmins(originalAdmins);
    setSearchTerm("");
    setNotFound(false);
  };

  const getPageAdmins = (p) => {
    socket.emit("GET_NEXT_PAGE_CLIENTS", { page: p, role: "admin" });
    socket.on("RECEIVE_NEXT_PAGE_CLIENTS", (data) => {
      setAdmins(data);
      setOriginalAdmins(data);
      setPage(p);
    });
  };

  useEffect(() => {
    if (socket && !admins) {
      getPageAdmins(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  useEffect(() => {
    adminApi("/api/admin/support-tickets")
      .then((data) => {
        const counts = {};
        (data.tickets || []).forEach((ticket) => {
          if (ticket.submittedByUserId) counts[ticket.submittedByUserId] = (counts[ticket.submittedByUserId] || 0) + 1;
        });
        setTicketCounts(counts);
      })
      .catch(() => setTicketCounts({}));
  }, []);

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Directory" title="Administrators" subtitle="All active administrators listed here" />

      <Toolbar>
        <Field $flex="1 1 320px" $minWidth="240px">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="text"
            placeholder="Enter user name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Field>
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "Searching…" : "Search"}
        </Button>
        <Button $variant="ghost" onClick={clearSearch}>
          Clear
        </Button>
      </Toolbar>

      {notFound && <StatusMessage $tone="danger">Admin could not be found.</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {!isNil(admins) && !isEmpty(admins) ? (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact No.</th>
                  <th>Admin Type</th>
                  <th>Tickets</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin, index) => (
                  <tr key={index}>
                    <td>{admin?.id}</td>
                    <td>{admin?.details.name}</td>
                    <td>{admin?.details.email}</td>
                    <td>{admin?.details.cell}</td>
                    <td>{admin?.details.adminType === "xrayAdmin" ? "X-ray Admin" : "Regular Admin"}</td>
                    <td>{ticketCounts[admin?.id] || 0}</td>
                    <td>
                      <RowActionLink as={Link} to={`/admin/edit/${admin?.id}`}>
                        Edit
                      </RowActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No administrators" subtitle="Try a different search term." />
          )}
        </TableScroll>
        <Pagination page={page} onChange={getPageAdmins} />
      </TablePanel>
    </Page>
  );
};

export default Admins;
