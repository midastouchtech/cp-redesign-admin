import React, { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import moment from "moment";
import {
  FontImport,
  Page,
  PageHeader,
  StatusMessage,
  TablePanel,
  TableScroll,
  Table,
  RowActionLink,
  Button,
  token,
} from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";
import { rememberEntity } from "../../lib/recentEntities";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const pinCompany = (company) => {
  const key = "cp_admin_pinned_companies";
  const current = JSON.parse(localStorage.getItem(key) || "[]");
  const next = [
    { id: company.id, name: company.details?.name || company.id },
    ...current.filter((item) => item.id !== company.id),
  ].slice(0, 10);
  localStorage.setItem(key, JSON.stringify(next));
  window.dispatchEvent(new Event("cp:pinned-companies-changed"));
};

const SectionTitle = ({ children }) => <h4 style={{ margin: "24px 0 10px", color: token.ink900 }}>{children}</h4>;

const Company360 = () => {
  const { companyId } = useParams();
  const fetcher = useMemo(() => () => adminApi(`/api/admin/companies/${companyId}/360`), [companyId]);
  const { data, loading, error } = useCachedFetch(`company-360:${companyId}`, fetcher);
  const company = data?.company;

  useEffect(() => {
    if (company) {
      rememberEntity({
        type: "company",
        id: company.id,
        label: company.details?.name || company.id,
        to: `/companies/${company.id}/360`,
      });
    }
  }, [company]);

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Company 360"
        title={company?.details?.name || "Company 360"}
        subtitle={company ? `Company ID ${company.id}` : "Company details, activity, invoices, and risks"}
        actions={company && <Button type="button" onClick={() => pinCompany(company)}>Pin company</Button>}
      />

      {loading && <StatusMessage>Loading company profile...</StatusMessage>}
      {error && <StatusMessage $tone="danger">Failed to load company: {error}</StatusMessage>}

      {data?.needsAttention?.length > 0 && (
        <StatusMessage $tone="danger">
          Needs attention: {data.needsAttention.map((item) => item.label).join(", ")}
        </StatusMessage>
      )}

      {company && (
        <TablePanel>
          <TableScroll>
            <Table>
              <tbody>
                <tr><td>Name</td><td>{company.details?.name}</td></tr>
                <tr><td>Registration no.</td><td>{company.details?.registrationNumber || "-"}</td></tr>
                <tr><td>VAT</td><td>{company.details?.vat || "-"}</td></tr>
                <tr><td>Managers</td><td>{(company.usersWhoCanManage || []).map((u) => u.name).join(", ") || "-"}</td></tr>
                <tr><td>Profile</td><td>{data.companyProfile ? "Available" : "No computed profile found"}</td></tr>
              </tbody>
            </Table>
          </TableScroll>
        </TablePanel>
      )}

      <SectionTitle>Sites</SectionTitle>
      <TablePanel><TableScroll><Table><tbody>
        {(data?.sites || []).map((site) => (
          <tr key={site._id}><td>{site.name}</td><td>{site.status}</td><td><RowActionLink as={Link} to={`/sites/${site._id}`}>Open</RowActionLink></td></tr>
        ))}
        {!(data?.sites || []).length && <tr><td>No linked sites found.</td></tr>}
      </tbody></Table></TableScroll></TablePanel>

      <SectionTitle>Appointments</SectionTitle>
      <TablePanel><TableScroll><Table>
        <thead><tr><th>ID</th><th>Date</th><th>Status</th><th>Deleted</th><th></th></tr></thead>
        <tbody>
          {(data?.appointments || []).slice(0, 50).map((appointment) => (
            <tr key={`${appointment.id}-${appointment.deleted}`}>
              <td>{appointment.id}</td>
              <td>{appointment.details?.date}</td>
              <td>{appointment.status}</td>
              <td>{appointment.deleted ? "Yes" : "No"}</td>
              <td>{!appointment.deleted && <RowActionLink as={Link} to={`/appointment/${appointment.id}`}>Open</RowActionLink>}</td>
            </tr>
          ))}
          {!(data?.appointments || []).length && <tr><td colSpan="5">No appointments found.</td></tr>}
        </tbody>
      </Table></TableScroll></TablePanel>

      <SectionTitle>Invoices</SectionTitle>
      <TablePanel><TableScroll><Table>
        <thead><tr><th>Invoice</th><th>Amount</th><th>Sent</th><th>PDF</th></tr></thead>
        <tbody>
          {(data?.invoices || []).map((invoice) => (
            <tr key={invoice._id}><td>{invoice.invoiceId}</td><td>R {Number(invoice.amount || 0).toFixed(2)}</td><td>{moment(invoice.sentAt).format("DD MMM YYYY")}</td><td>{invoice.pdfUrl ? "Yes" : "No"}</td></tr>
          ))}
          {!(data?.invoices || []).length && <tr><td colSpan="4">No invoices found.</td></tr>}
        </tbody>
      </Table></TableScroll></TablePanel>
    </Page>
  );
};

export default Company360;
