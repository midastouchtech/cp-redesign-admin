import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  Button,
  Field,
  FieldLabel,
  FontImport,
  Input,
  Page,
  PageHeader,
  StatusMessage,
  token,
} from "../../components/ListPage";
import { adminApi } from "../../lib/adminApi";

const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 0.8fr) minmax(320px, 1.2fr);
  gap: 18px;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const ProfilePanel = styled.section`
  background: #fff;
  border: 1px solid rgba(21, 21, 25, 0.08);
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 18px 50px rgba(21, 21, 25, 0.08);
`;

const IdentityCard = styled(ProfilePanel)`
  background:
    linear-gradient(145deg, rgba(254, 99, 78, 0.14), rgba(239, 155, 19, 0.08)),
    #151519;
  color: #fff;
  min-height: 300px;
`;

const Avatar = styled.img`
  width: 78px;
  height: 78px;
  border-radius: 22px;
  object-fit: cover;
  background: #fff;
  padding: 3px;
  box-shadow: 0 20px 44px rgba(254, 99, 78, 0.28);
`;

const IdBlock = styled.div`
  margin-top: 24px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(244, 246, 250, 0.08);
  border: 1px solid rgba(244, 246, 250, 0.12);
`;

const Label = styled.div`
  color: rgba(244, 246, 250, 0.56);
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 6px;
`;

const ImmutableId = styled.div`
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  word-break: break-all;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const PanelTitle = styled.h3`
  color: ${token.ink900};
  font-size: 18px;
  font-weight: 900;
  margin: 0 0 4px;
`;

const PanelCopy = styled.p`
  color: ${token.ink500};
  font-size: 13px;
  font-weight: 600;
  margin: 0 0 18px;
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
`;

const Profile = ({ user, saveUser }) => {
  const [profile, setProfile] = useState(null);
  const [details, setDetails] = useState({});
  const [passwords, setPasswords] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const userId = user?.id;
  const actorName = `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim();

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    adminApi(`/api/admin/profile?userId=${encodeURIComponent(userId)}`)
      .then((data) => {
        setProfile(data.user);
        setDetails(data.user?.details || {});
        setError("");
      })
      .catch(() => setError("We could not load your profile. Please refresh and try again."))
      .finally(() => setLoading(false));
  }, [userId]);

  const updateDetail = (key, value) => {
    setDetails((current) => ({ ...current, [key]: value }));
  };

  const saveDetails = async () => {
    setSaving(true);
    setStatus("");
    setError("");
    try {
      const data = await adminApi("/api/admin/profile", {
        method: "PATCH",
        body: JSON.stringify({
          userId,
          details,
          actorId: userId,
          actorName,
        }),
      });
      const nextUser = { ...user, details: { ...(user?.details || {}), ...(data.user?.details || details) } };
      saveUser(nextUser);
      setProfile(data.user);
      setStatus("Profile details saved.");
    } catch (err) {
      setError(err.message || "We could not save your profile details.");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    setStatus("");
    setError("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      await adminApi("/api/admin/profile/password", {
        method: "PATCH",
        body: JSON.stringify({
          userId,
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          actorId: userId,
          actorName,
        }),
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setStatus("Password changed.");
    } catch (err) {
      setError(err.message || "We could not change your password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <Page>
      <FontImport />
      <PageHeader
        eyebrow="Account"
        title="Profile"
        subtitle="Keep your admin account details current. Your user ID is permanent and cannot be changed."
      />

      {loading && <StatusMessage>Loading your profile...</StatusMessage>}
      {status && <StatusMessage $tone="success">{status}</StatusMessage>}
      {error && <StatusMessage $tone="danger">{error}</StatusMessage>}

      <ProfileGrid>
        <IdentityCard>
          <Avatar src={details.picture || user?.details?.picture || "/images/man.png"} alt="" />
          <h2 style={{ color: "#fff", fontWeight: 900, margin: "18px 0 4px" }}>
            {`${details.name || ""} ${details.surname || ""}`.trim() || "Admin"}
          </h2>
          <p style={{ color: "rgba(244,246,250,.68)", fontWeight: 700, margin: 0 }}>
            {details.email || user?.details?.email || ""}
          </p>
          <IdBlock>
            <Label>Immutable user ID</Label>
            <ImmutableId>{profile?.id || userId || "-"}</ImmutableId>
          </IdBlock>
        </IdentityCard>

        <div style={{ display: "grid", gap: 18 }}>
          <ProfilePanel>
            <PanelTitle>Account details</PanelTitle>
            <PanelCopy>These details appear across admin actions, support tickets, and audit history.</PanelCopy>
            <FormGrid>
              <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={details.name || ""} onChange={(e) => updateDetail("name", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Surname</FieldLabel>
                <Input value={details.surname || ""} onChange={(e) => updateDetail("surname", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <Input type="email" value={details.email || ""} onChange={(e) => updateDetail("email", e.target.value)} />
              </Field>
              <Field>
                <FieldLabel>Contact number</FieldLabel>
                <Input value={details.contactNumber || ""} onChange={(e) => updateDetail("contactNumber", e.target.value)} />
              </Field>
              <Field style={{ gridColumn: "1 / -1" }}>
                <FieldLabel>Profile image URL</FieldLabel>
                <Input value={details.picture || ""} onChange={(e) => updateDetail("picture", e.target.value)} />
              </Field>
            </FormGrid>
            <Actions>
              <Button type="button" onClick={saveDetails} disabled={saving || !userId}>
                {saving ? "Saving..." : "Save details"}
              </Button>
            </Actions>
          </ProfilePanel>

          <ProfilePanel>
            <PanelTitle>Change password</PanelTitle>
            <PanelCopy>Use at least 8 characters. You will use this password the next time you log in.</PanelCopy>
            <FormGrid>
              <Field>
                <FieldLabel>Current password</FieldLabel>
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords((current) => ({ ...current, currentPassword: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel>New password</FieldLabel>
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords((current) => ({ ...current, newPassword: e.target.value }))}
                />
              </Field>
              <Field>
                <FieldLabel>Confirm new password</FieldLabel>
                <Input
                  type="password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords((current) => ({ ...current, confirmPassword: e.target.value }))}
                />
              </Field>
            </FormGrid>
            <Actions>
              <Button
                type="button"
                onClick={changePassword}
                disabled={passwordSaving || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              >
                {passwordSaving ? "Changing..." : "Change password"}
              </Button>
            </Actions>
          </ProfilePanel>
        </div>
      </ProfileGrid>
    </Page>
  );
};

const mapStateToProps = (state) => ({ user: state.auth.user });
const mapDispatchToProps = (dispatch) => ({
  saveUser: (user) => dispatch({ type: "SAVE_USER", payload: user }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Profile);
