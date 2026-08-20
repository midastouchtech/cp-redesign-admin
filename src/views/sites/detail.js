import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import styled from "styled-components";
import {
  FontImport,
  Page,
  PageHeader,
  StatusMessage,
  EmptyState,
  Field,
  FieldLabel,
  Input,
  Select,
  Button,
  StatusBadge,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const SITE_TYPE_OPTIONS = [
  { value: "", label: "Not set" },
  { value: "mine", label: "Mine" },
  { value: "plant", label: "Plant" },
  { value: "office", label: "Office" },
  { value: "other", label: "Other" },
];

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 18px 20px;
  margin-bottom: 16px;
`;

const PanelTitle = styled.h3`
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 12px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`;

const Textarea = styled.textarea`
  border: 1px solid ${token.line};
  background: ${token.surface};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: ${token.ink900};
  font-family: inherit;
  min-height: 72px;
  resize: vertical;
  &:focus-visible {
    outline: 2px solid ${token.brand};
    outline-offset: 1px;
    border-color: ${token.brand};
  }
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: ${token.ink700};
  cursor: pointer;
`;

const HelpText = styled.p`
  font-size: 11px;
  color: ${token.ink500};
  margin: 4px 0 0;
`;

const CompanyRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid ${token.lineSoft};
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
`;

const TrendRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid ${token.lineSoft};
  font-size: 13px;
  &:last-child {
    border-bottom: none;
  }
`;

const BackLink = styled(Link)`
  font-size: 12px;
  font-weight: 700;
  color: ${token.ink500};
  text-decoration: none;
  display: inline-block;
  margin-bottom: 10px;
  &:hover {
    color: ${token.brand};
  }
`;

const emptyForm = {
  address: "",
  gpsLat: "",
  gpsLng: "",
  region: "",
  siteType: "",
  capacity: "",
  onSiteContactName: "",
  onSiteContactPhone: "",
  accessRequirements: "",
  accessCardTypicallyRequired: false,
  notes: "",
};

const formFromSite = (site) => ({
  address: site.address || "",
  gpsLat: site.gpsCoordinates?.lat ?? "",
  gpsLng: site.gpsCoordinates?.lng ?? "",
  region: site.region || "",
  siteType: site.siteType || "",
  capacity: site.capacity ?? "",
  onSiteContactName: site.onSiteContactName || "",
  onSiteContactPhone: site.onSiteContactPhone || "",
  accessRequirements: site.accessRequirements || "",
  accessCardTypicallyRequired: !!site.accessCardTypicallyRequired,
  notes: site.notes || "",
});

const SiteDetail = () => {
  const { siteId } = useParams();

  const fetcher = useMemo(
    () => async () => {
      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites/${siteId}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load site (${res.status})`);
      return res.json();
    },
    [siteId]
  );

  const { data: site, loading, error, refetch } = useCachedFetch(`admin-site:${siteId}`, fetcher);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (site) setForm(formFromSite(site));
  }, [site]);

  const handleChange = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const lat = form.gpsLat === "" ? null : Number(form.gpsLat);
      const lng = form.gpsLng === "" ? null : Number(form.gpsLng);
      const gpsCoordinates = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng) ? { lat, lng } : null;

      const body = {
        address: form.address,
        gpsCoordinates,
        region: form.region,
        siteType: form.siteType,
        capacity: form.capacity === "" ? null : Number(form.capacity),
        onSiteContactName: form.onSiteContactName,
        onSiteContactPhone: form.onSiteContactPhone,
        accessRequirements: form.accessRequirements,
        accessCardTypicallyRequired: form.accessCardTypicallyRequired,
        notes: form.notes,
      };

      const res = await fetch(`${COMPANION_API_URL}/api/admin/sites/${siteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-stats-secret": COMPANION_STATS_SECRET,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed to save (${res.status})`);
      await refetch();
      setSaveSuccess(true);
    } catch (err) {
      setSaveError(err.message || String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page>
      <FontImport />
      <BackLink to="/sites">← Back to sites</BackLink>

      {error && <StatusMessage $tone="danger">Failed to load site: {error}</StatusMessage>}
      {loading && !site && <StatusMessage>Loading…</StatusMessage>}

      {site && (
        <>
          <PageHeader
            eyebrow="Site profile"
            title={site.name}
            subtitle={
              <>
                <StatusBadge status={site.status} /> · {site.appointmentCount ?? 0} appointments · First seen{" "}
                {site.firstSeenAt ? new Date(site.firstSeenAt).toLocaleDateString() : "—"} · Last used{" "}
                {site.lastUsedAt ? new Date(site.lastUsedAt).toLocaleDateString() : "—"}
              </>
            }
          />

          <Grid>
            <Panel>
              <PanelTitle>Linked companies</PanelTitle>
              {site.linkedCompanies?.length ? (
                site.linkedCompanies.map((c) => (
                  <CompanyRow key={c.companyId}>
                    <span>{c.companyName || c.companyId}</span>
                  </CompanyRow>
                ))
              ) : (
                <EmptyState title="No linked companies" subtitle="This site has no resolvable company links." />
              )}
            </Panel>

            <Panel>
              <PanelTitle>Appointment volume by month</PanelTitle>
              {site.monthlyTrend?.length ? (
                site.monthlyTrend.map((t) => (
                  <TrendRow key={t.date}>
                    <span>{t.date}</span>
                    <strong>{t.count} appointments</strong>
                  </TrendRow>
                ))
              ) : (
                <EmptyState title="No volume data" subtitle="No appointments recorded for this site yet." />
              )}
            </Panel>
          </Grid>

          <Panel>
            <PanelTitle>Site metadata</PanelTitle>
            <StatusMessage style={{ marginBottom: 14 }}>
              These fields are admin-entered notes and are not derived from appointment data. Capacity in particular
              is informational only and is not enforced against any booking limit.
            </StatusMessage>

            {saveError && <StatusMessage $tone="danger">Failed to save: {saveError}</StatusMessage>}
            {saveSuccess && <StatusMessage>Saved.</StatusMessage>}

            <FormGrid>
              <Field>
                <FieldLabel>Address</FieldLabel>
                <Input type="text" value={form.address} onChange={handleChange("address")} />
              </Field>
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Input type="text" value={form.region} onChange={handleChange("region")} />
              </Field>
              <Field>
                <FieldLabel>Site type</FieldLabel>
                <Select value={form.siteType} onChange={handleChange("siteType")}>
                  {SITE_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field>
                <FieldLabel>Capacity (informational only, not enforced)</FieldLabel>
                <Input type="number" min="0" value={form.capacity} onChange={handleChange("capacity")} />
                <HelpText>Not wired to any booking or availability limit.</HelpText>
              </Field>
              <Field>
                <FieldLabel>GPS latitude</FieldLabel>
                <Input type="number" step="any" value={form.gpsLat} onChange={handleChange("gpsLat")} />
              </Field>
              <Field>
                <FieldLabel>GPS longitude</FieldLabel>
                <Input type="number" step="any" value={form.gpsLng} onChange={handleChange("gpsLng")} />
              </Field>
              <Field>
                <FieldLabel>On-site contact name</FieldLabel>
                <Input type="text" value={form.onSiteContactName} onChange={handleChange("onSiteContactName")} />
              </Field>
              <Field>
                <FieldLabel>On-site contact phone</FieldLabel>
                <Input type="text" value={form.onSiteContactPhone} onChange={handleChange("onSiteContactPhone")} />
              </Field>
              <Field style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Access requirements</FieldLabel>
                <Textarea value={form.accessRequirements} onChange={handleChange("accessRequirements")} />
              </Field>
              <Field style={{ gridColumn: "1 / -1" }}>
                <CheckboxRow>
                  <input
                    type="checkbox"
                    checked={form.accessCardTypicallyRequired}
                    onChange={handleChange("accessCardTypicallyRequired")}
                  />
                  Access card typically required on site
                </CheckboxRow>
              </Field>
              <Field style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Notes</FieldLabel>
                <Textarea value={form.notes} onChange={handleChange("notes")} />
              </Field>
            </FormGrid>

            <div style={{ marginTop: 16 }}>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </Panel>
        </>
      )}
    </Page>
  );
};

export default SiteDetail;
