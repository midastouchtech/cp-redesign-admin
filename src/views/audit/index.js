import React, { useState } from "react";
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
  StatusMessage,
} from "../../components/ListPage";
import AppointmentSearch from "../../components/Modal/appointmentSearch";
import UserSearch from "../../components/Modal/userSearch";
import CompanySearch from "../../components/Modal/companySearch";
import AuditTimeline from "../../components/AuditTimeline";

const ENTITY_TYPES = [
  { value: "appointment", label: "Appointment" },
  { value: "user", label: "Client / User" },
  { value: "company", label: "Company" },
];

const entityLabel = (entity, entityType) => {
  if (!entity) return "";
  if (entityType === "appointment") {
    return `Appointment #${entity.id}${entity?.details?.company?.name ? ` — ${entity.details.company.name}` : ""}`;
  }
  return `${entity?.details?.name || entity?.id} (#${entity.id})`;
};

const Audit = ({ socket }) => {
  const [entityType, setEntityType] = useState("appointment");
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [manualId, setManualId] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleEntityTypeChange = (e) => {
    setEntityType(e.target.value);
    setSelectedEntity(null);
    setManualId("");
  };

  const handleSelect = (entity) => {
    setSelectedEntity(entity);
    setShowSearch(false);
  };

  const handleManualLookup = () => {
    if (!manualId.trim()) return;
    setSelectedEntity({ id: manualId.trim() });
  };

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="System"
        title="Audit Trail"
        subtitle="Look up the full change history for an appointment, client, or company."
      />

      <Toolbar>
        <Field $minWidth="220px">
          <FieldLabel>Entity type</FieldLabel>
          <Select value={entityType} onChange={handleEntityTypeChange}>
            {ENTITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        {socket ? (
          <Field>
            <FieldLabel>Entity</FieldLabel>
            <Button type="button" onClick={() => setShowSearch(true)}>
              {selectedEntity ? "Change selection" : "Search"}
            </Button>
          </Field>
        ) : (
          <Field $flex="1 1 260px" $minWidth="260px">
            <FieldLabel>Entity ID</FieldLabel>
            <div style={{ display: "flex", gap: 8 }}>
              <Input
                type="text"
                placeholder="Enter entity ID directly"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualLookup()}
              />
              <Button type="button" onClick={handleManualLookup}>
                Load
              </Button>
            </div>
          </Field>
        )}
      </Toolbar>

      {selectedEntity && (
        <StatusMessage $tone="info" style={{ marginBottom: 16 }}>
          Showing history for: <strong>{entityLabel(selectedEntity, entityType) || selectedEntity.id}</strong>
        </StatusMessage>
      )}

      {socket && entityType === "appointment" && (
        <AppointmentSearch
          name="audit-appointment-search"
          show={showSearch}
          close={() => setShowSearch(false)}
          socket={socket}
          onAppointmentSelect={handleSelect}
        />
      )}
      {socket && entityType === "user" && (
        <UserSearch
          name="audit-user-search"
          show={showSearch}
          close={() => setShowSearch(false)}
          socket={socket}
          onUserSelect={handleSelect}
        />
      )}
      {socket && entityType === "company" && (
        <CompanySearch
          name="audit-company-search"
          show={showSearch}
          close={() => setShowSearch(false)}
          socket={socket}
          onCompanySelect={handleSelect}
        />
      )}

      {selectedEntity ? (
        <AuditTimeline entityType={entityType} entityId={selectedEntity.id} />
      ) : (
        <StatusMessage>Select an entity above to view its audit history.</StatusMessage>
      )}
    </Page>
  );
};

export default Audit;
