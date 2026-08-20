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

const Clients = ({ socket }) => {
  const [clients, setClients] = useState(null);
  const [originalClients, setOriginalClients] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);

  const getPageClients = (p) => {
    socket.emit("GET_NEXT_PAGE_CLIENTS", { page: p, role: "client" });
    socket.on("RECEIVE_NEXT_PAGE_CLIENTS", (data) => {
      setClients(data);
      setOriginalClients(data);
      setPage(p);
    });
  };

  useEffect(() => {
    if (socket && !clients && hasRequested === false) {
      setHasRequested(true);
      getPageClients(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_USER", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_USER", (data) => {
      setClients(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_USER_NOT_FOUND", () => {
      setClients([]);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setClients(originalClients);
    setSearchTerm("");
    setNotFound(false);
  };

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Directory" title="Clients" subtitle="All active clients listed here" />

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

      {notFound && <StatusMessage $tone="danger">Client could not be found.</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {!isNil(clients) && !isEmpty(clients) ? (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact No.</th>
                  <th>Companies</th>
                  <th>Appointments</th>
                  <th>Suspended</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, index) => (
                  <tr key={index}>
                    <td>{client?.id}</td>
                    <td>{client?.details.name}</td>
                    <td>{client?.details.email}</td>
                    <td>{client?.details.cell}</td>
                    <td>{client?.companiesManaging?.length}</td>
                    <td>{client?.appointmentsManaging?.length}</td>
                    <td>{client?.isSuspended ? "Yes" : "No"}</td>
                    <td>
                      {client.isDeleted ? (
                        <i>Deleted</i>
                      ) : (
                        <RowActionLink as={Link} to={`/client/edit/${client?.id}`}>
                          Edit
                        </RowActionLink>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No clients" subtitle="Try a different search term." />
          )}
        </TableScroll>
        <Pagination page={page} onChange={getPageClients} />
      </TablePanel>
    </Page>
  );
};

export default Clients;
