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

const Companies = ({ socket }) => {
  const [companies, setCompanies] = useState(null);
  const [originalCompanies, setOriginalCompanies] = useState(null);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const getPageCompanies = (p) => {
    socket.emit("GET_NEXT_PAGE_COMPANIES", { page: p });
    socket.on("RECEIVE_NEXT_PAGE_COMPANIES", (data) => {
      setCompanies(data);
      setOriginalCompanies(data);
      setPage(p);
    });
  };

  useEffect(() => {
    if (socket && !companies) {
      getPageCompanies(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleSearch = async () => {
    setLoading(true);
    setNotFound(false);
    socket.emit("SEARCH_COMPANY", { term: searchTerm });
    socket.on("RECEIVE_SEARCHED_COMPANY", (data) => {
      setCompanies(data);
      setLoading(false);
    });
    socket.on("RECEIVE_SEARCHED_COMPANY_NOT_FOUND", () => {
      setCompanies([]);
      setNotFound(true);
      setLoading(false);
    });
  };

  const clearSearch = () => {
    setCompanies(originalCompanies);
    setSearchTerm("");
    setNotFound(false);
  };

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Directory" title="Companies" subtitle="All active companies listed here" />

      <Toolbar>
        <Field $flex="1 1 320px" $minWidth="240px">
          <FieldLabel>Search</FieldLabel>
          <Input
            type="text"
            placeholder="Enter company name"
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

      {notFound && <StatusMessage $tone="danger">Company could not be found.</StatusMessage>}

      <TablePanel>
        <TableScroll>
          {!isNil(companies) && !isEmpty(companies) ? (
            <Table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Manager</th>
                  <th>VAT</th>
                  <th>Registration No.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company, index) => (
                  <tr key={index}>
                    <td>{company.id}</td>
                    <td>{company.details.name}</td>
                    <td>{company.usersWhoCanManage[0]?.name}</td>
                    <td>{company.details.vat}</td>
                    <td>{company.details.registrationNumber}</td>
                    <td>
                      <RowActionLink as={Link} to={`/company/edit/${company.id}`}>
                        More info
                      </RowActionLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No companies" subtitle="Try a different search term." />
          )}
        </TableScroll>
        <Pagination page={page} onChange={getPageCompanies} />
      </TablePanel>
    </Page>
  );
};

export default Companies;
