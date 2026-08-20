import React, { useEffect, useState } from "react";
import moment from "moment";
import { fetchEntityTimeline } from "../../lib/trackEvent";

/**
 * Renders the audit history for a single entity (appointment, user, company, ...).
 *
 * Fetches on mount (and whenever entityType/entityId change) via fetchEntityTimeline,
 * which already resolves to [] on any failure — so this component only needs to
 * distinguish "loading" vs "loaded" (possibly empty) state, no error state.
 */
function AuditTimeline({ entityType, entityId }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);
    fetchEntityTimeline(entityType, entityId).then((data) => {
      if (!isCancelled) {
        setEvents(Array.isArray(data) ? data : []);
        setIsLoading(false);
      }
    });
    return () => {
      isCancelled = true;
    };
  }, [entityType, entityId]);

  const renderChanges = (event) => {
    const parts = [];
    if (Array.isArray(event.changes) && event.changes.length) {
      parts.push(
        event.changes
          .map((c) => `${c.field}: ${c.before ?? "—"} → ${c.after ?? "—"}`)
          .join(", ")
      );
    }
    if (event.metadata && Object.keys(event.metadata).length) {
      parts.push(
        Object.entries(event.metadata)
          .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`)
          .join(", ")
      );
    }
    return parts.join(" · ");
  };

  return (
    <div className="card">
      <div className="card-header">
        <h4 className="card-title">History</h4>
      </div>
      <div className="card-body p-0">
        <div className="table-responsive fs-14">
          <table className="table">
            <thead>
              <tr>
                <th>
                  <strong>Action</strong>
                </th>
                <th>
                  <strong>Actor</strong>
                </th>
                <th>
                  <strong>Date</strong>
                </th>
                <th>
                  <strong>Details</strong>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={4}>Loading history...</td>
                </tr>
              )}
              {!isLoading && events.length === 0 && (
                <tr>
                  <td colSpan={4}>No history yet</td>
                </tr>
              )}
              {!isLoading &&
                events.map((event, index) => (
                  <tr key={event.id || `${event.action}-${event.createdAt}-${index}`}>
                    <td>
                      {event.action}
                      {event.source === "legacy-import" && (
                        <span className="badge badge-rounded badge-secondary ml-2">
                          Legacy
                        </span>
                      )}
                    </td>
                    <td>{event.actorName || "Unknown"}</td>
                    <td>
                      {event.createdAt
                        ? moment(event.createdAt).format("DD MMM YYYY HH:mm")
                        : "—"}
                    </td>
                    <td>{renderChanges(event)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AuditTimeline;
