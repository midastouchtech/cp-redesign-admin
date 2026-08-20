import React, { useMemo, useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import moment from "moment";
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
  EmptyState,
  Pagination,
  token,
} from "../../components/ListPage";
import { useCachedFetch } from "../../hooks/useCachedFetch";

const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;
const COMPANION_STATS_SECRET = process.env.REACT_APP_COMPANION_STATS_SECRET;

const STATUS_LABELS = { open: "Open", needs_follow_up: "Needs follow-up", resolved: "Resolved" };
const STATUS_COLORS = {
  open: { bg: token.warningSoft, fg: token.warning },
  needs_follow_up: { bg: token.dangerSoft, fg: token.danger },
  resolved: { bg: token.successSoft, fg: token.success },
};

const StatusPill = styled.span`
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: ${(p) => STATUS_COLORS[p.$status]?.bg || token.canvas};
  color: ${(p) => STATUS_COLORS[p.$status]?.fg || token.ink700};
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 16px;
  align-items: start;
  @media (max-width: 950px) {
    grid-template-columns: 1fr;
  }
`;

const ThreadListPanel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  overflow: hidden;
  max-height: 720px;
  display: flex;
  flex-direction: column;
`;

const ThreadListScroll = styled.div`
  overflow-y: auto;
  flex: 1;
`;

const ThreadItem = styled.button`
  display: block;
  width: 100%;
  text-align: left;
  appearance: none;
  border: none;
  border-bottom: 1px solid ${token.lineSoft};
  background: ${(p) => (p.$active ? token.brandSoft : "transparent")};
  padding: 12px 14px;
  cursor: pointer;
  &:hover {
    background: ${(p) => (p.$active ? token.brandSoft : token.canvas)};
  }
`;

const ThreadItemTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3px;
  gap: 8px;
`;

const ThreadCompany = styled.strong`
  font-size: 13px;
  color: ${token.ink900};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ThreadPreview = styled.p`
  font-size: 12px;
  color: ${token.ink500};
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DetailPanel = styled.div`
  background: ${token.surface};
  border: 1px solid ${token.line};
  border-radius: ${token.radius};
  box-shadow: ${token.shadow};
  padding: 18px 20px;
  min-height: 400px;
`;

const DetailHead = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid ${token.lineSoft};
`;

const MessageThread = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
  margin-bottom: 16px;
`;

const MessageBubble = styled.div`
  align-self: ${(p) => (p.$mine ? "flex-end" : "flex-start")};
  max-width: 80%;
  background: ${(p) => (p.$mine ? token.brand : token.canvas)};
  color: ${(p) => (p.$mine ? "#fff" : token.ink900)};
  border-radius: ${(p) => (p.$mine ? "10px 10px 2px 10px" : "10px 10px 10px 2px")};
  padding: 8px 12px;
  font-size: 13px;
`;

const MessageMeta = styled.div`
  font-size: 10px;
  color: ${token.ink500};
  margin-top: 3px;
  text-align: ${(p) => (p.$mine ? "right" : "left")};
`;

const ReplyRow = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
`;

const ReplyInput = styled.textarea`
  flex: 1;
  border: 1px solid ${token.line};
  border-radius: ${token.radiusSm};
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
`;

const NoteItem = styled.div`
  background: ${token.warningSoft};
  border-radius: ${token.radiusSm};
  padding: 8px 12px;
  font-size: 12px;
  color: ${token.ink900};
  margin-bottom: 8px;
`;

const NoteMeta = styled.div`
  font-size: 10px;
  color: ${token.ink500};
  margin-top: 4px;
`;

const SectionTitle = styled.h4`
  font-size: 13px;
  font-weight: 700;
  margin: 0 0 10px;
`;

const Messaging = ({ user }) => {
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [noteText, setNoteText] = useState("");
  const [actionError, setActionError] = useState(null);

  const listFetcher = useMemo(
    () => async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`${COMPANION_API_URL}/api/admin/messaging/threads?${params}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load threads (${res.status})`);
      return res.json();
    },
    [search, statusFilter, page]
  );

  const {
    data: listData,
    loading: listLoading,
    error: listError,
    refetch: refetchList,
  } = useCachedFetch(`admin-messaging-threads:${search}:${statusFilter}:${page}`, listFetcher);

  const threads = listData?.threads || [];

  const detailFetcher = useMemo(
    () => async () => {
      if (!selectedAppointmentId) return null;
      const res = await fetch(`${COMPANION_API_URL}/api/admin/messaging/threads/${selectedAppointmentId}`, {
        headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET },
      });
      if (!res.ok) throw new Error(`Failed to load thread (${res.status})`);
      return res.json();
    },
    [selectedAppointmentId]
  );

  const {
    data: thread,
    loading: threadLoading,
    error: threadError,
    refetch: refetchThread,
  } = useCachedFetch(`admin-messaging-thread:${selectedAppointmentId}`, detailFetcher, {
    enabled: !!selectedAppointmentId,
  });

  const adminId = user?.id;
  const adminName = user?.details ? `${user.details.name} ${user.details.surname}` : "Admin";

  const handleSearch = () => {
    setPage(0);
    setSearch(searchInput.trim());
  };

  const handleReply = async () => {
    if (!replyText.trim() || !selectedAppointmentId) return;
    setActionError(null);
    try {
      const res = await fetch(
        `${COMPANION_API_URL}/api/admin/messaging/threads/${selectedAppointmentId}/reply`,
        {
          method: "POST",
          headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET, "content-type": "application/json" },
          body: JSON.stringify({ adminId, adminName, message: replyText.trim() }),
        }
      );
      if (!res.ok) throw new Error(`Failed to send reply (${res.status})`);
      setReplyText("");
      refetchThread();
      refetchList();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedAppointmentId) return;
    setActionError(null);
    try {
      const res = await fetch(
        `${COMPANION_API_URL}/api/admin/messaging/threads/${selectedAppointmentId}/notes`,
        {
          method: "POST",
          headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET, "content-type": "application/json" },
          body: JSON.stringify({ adminId, adminName, note: noteText.trim() }),
        }
      );
      if (!res.ok) throw new Error(`Failed to add note (${res.status})`);
      setNoteText("");
      refetchThread();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedAppointmentId) return;
    setActionError(null);
    try {
      const res = await fetch(
        `${COMPANION_API_URL}/api/admin/messaging/threads/${selectedAppointmentId}/status`,
        {
          method: "PATCH",
          headers: { "x-admin-stats-secret": COMPANION_STATS_SECRET, "content-type": "application/json" },
          body: JSON.stringify({ adminId, status }),
        }
      );
      if (!res.ok) throw new Error(`Failed to update status (${res.status})`);
      refetchThread();
      refetchList();
    } catch (err) {
      setActionError(err.message);
    }
  };

  return (
    <Page>
      <FontImport />
      <PageHeader eyebrow="Support" title="Messaging" subtitle="Browse appointment message threads and reply to clients" />

      <Toolbar>
        <Field $flex="1 1 260px" $minWidth="220px">
          <FieldLabel>Search company or user</FieldLabel>
          <Input
            type="text"
            placeholder="Company or user name"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </Field>
        <Field $minWidth="160px">
          <FieldLabel>Status</FieldLabel>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="needs_follow_up">Needs follow-up</option>
            <option value="resolved">Resolved</option>
          </Select>
        </Field>
        <Button onClick={handleSearch}>Search</Button>
      </Toolbar>

      {listError && <StatusMessage $tone="danger">Failed to load threads: {listError}</StatusMessage>}
      {actionError && <StatusMessage $tone="danger">{actionError}</StatusMessage>}

      <Layout>
        <ThreadListPanel>
          <ThreadListScroll>
            {listLoading && !listData ? (
              <StatusMessage style={{ margin: 14 }}>Loading…</StatusMessage>
            ) : threads.length ? (
              threads.map((t) => (
                <ThreadItem
                  key={t.appointmentId}
                  $active={t.appointmentId === selectedAppointmentId}
                  onClick={() => setSelectedAppointmentId(t.appointmentId)}
                >
                  <ThreadItemTop>
                    <ThreadCompany>{t.companyName || "Unknown company"}</ThreadCompany>
                    <StatusPill $status={t.threadStatus}>{STATUS_LABELS[t.threadStatus]}</StatusPill>
                  </ThreadItemTop>
                  <ThreadPreview>
                    {t.userName ? `${t.userName} · ` : ""}
                    {t.lastMessage?.message || "No messages"}
                  </ThreadPreview>
                </ThreadItem>
              ))
            ) : (
              <EmptyState title="No threads found" subtitle="Try a different search or status filter." />
            )}
          </ThreadListScroll>
          {listData && <Pagination page={page} pageCount={listData.pageCount} onChange={setPage} />}
        </ThreadListPanel>

        <DetailPanel>
          {!selectedAppointmentId ? (
            <EmptyState title="Select a thread" subtitle="Choose an appointment from the list to view its messages." />
          ) : threadLoading && !thread ? (
            <StatusMessage>Loading thread…</StatusMessage>
          ) : threadError ? (
            <StatusMessage $tone="danger">Failed to load thread: {threadError}</StatusMessage>
          ) : thread ? (
            <>
              <DetailHead>
                <div>
                  <strong style={{ fontSize: 15 }}>{thread.companyName || "Unknown company"}</strong>
                  <p style={{ margin: "3px 0 0", fontSize: 12, color: token.ink500 }}>
                    {thread.userName} · Appointment {thread.appointmentId} · {thread.date}
                  </p>
                </div>
                <Select value={thread.threadStatus} onChange={(e) => handleStatusChange(e.target.value)}>
                  <option value="open">Open</option>
                  <option value="needs_follow_up">Needs follow-up</option>
                  <option value="resolved">Resolved</option>
                </Select>
              </DetailHead>

              <SectionTitle>Message thread</SectionTitle>
              <MessageThread>
                {thread.messages?.length ? (
                  thread.messages.map((m, i) => {
                    const mine = m.author?.role === "admin";
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                        <MessageBubble $mine={mine}>{m.message}</MessageBubble>
                        <MessageMeta $mine={mine}>
                          {m.author?.name} ({m.author?.role}) · {moment(m.createdAt, "YYYY-MM-DD HH:mm:ss").format("D MMM, HH:mm")}
                        </MessageMeta>
                      </div>
                    );
                  })
                ) : (
                  <EmptyState title="No messages yet" />
                )}
              </MessageThread>

              <ReplyRow>
                <ReplyInput
                  placeholder="Reply to the user…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                />
                <Button onClick={handleReply} disabled={!replyText.trim()}>
                  Send
                </Button>
              </ReplyRow>

              <SectionTitle>Internal notes (staff only)</SectionTitle>
              {thread.internalNotes?.length ? (
                thread.internalNotes.map((n) => (
                  <NoteItem key={n._id}>
                    {n.note}
                    <NoteMeta>
                      {n.authorAdminName} · {moment(n.createdAt).format("D MMM, HH:mm")}
                    </NoteMeta>
                  </NoteItem>
                ))
              ) : (
                <p style={{ fontSize: 12, color: token.ink500 }}>No internal notes yet.</p>
              )}
              <ReplyRow>
                <ReplyInput
                  placeholder="Add an internal note (never sent to the user)…"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                />
                <Button $variant="ghost" onClick={handleAddNote} disabled={!noteText.trim()}>
                  Add note
                </Button>
              </ReplyRow>
            </>
          ) : null}
        </DetailPanel>
      </Layout>
    </Page>
  );
};

const mapStateToProps = (state) => ({
  user: state.auth.user,
});

export default connect(mapStateToProps)(Messaging);
