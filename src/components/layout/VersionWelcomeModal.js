import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import {
  MdBusiness,
  MdCalendarViewMonth,
  MdClose,
  MdHistory,
  MdOutlineSupportAgent,
  MdSettings,
  MdVerifiedUser,
} from "react-icons/md";
import { theme } from "./theme";

const STORAGE_KEY = "clinicplus_admin_v31_welcome";
const VERSION = "3.1";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SHOWS = 4;

const FEATURE_LINKS = [
  {
    icon: MdSettings,
    label: "System controls",
    text: "Manage platform kill-switches and clinic booking limits.",
    to: "/system-controls",
  },
  {
    icon: MdBusiness,
    label: "Company 360",
    text: "Review company details, appointments, invoices, and audit history in one place.",
    to: "/companies",
  },
  {
    icon: MdCalendarViewMonth,
    label: "Availability views",
    text: "Check booked employees by clinic, service, day, week, or month.",
    to: "/availability",
  },
  {
    icon: MdHistory,
    label: "Recycle Bin",
    text: "Restore deleted appointments, companies, and users when needed.",
    to: "/recycle-bin",
  },
  {
    icon: MdOutlineSupportAgent,
    label: "Support tickets",
    text: "Send and track requests, complaints, and suggestions.",
    to: "/support-tickets",
  },
  {
    icon: MdVerifiedUser,
    label: "Profile security",
    text: "Update your account details and password from your profile.",
    to: "/profile",
  },
];

const modalIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(18px) scale(.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  min-height: 100vh;
  z-index: 10050;
  display: grid;
  place-items: center;
  padding: clamp(14px, 3vw, 34px);
  background:
    radial-gradient(circle at 15% 15%, rgba(254, 99, 78, .22), transparent 30rem),
    radial-gradient(circle at 85% 70%, rgba(239, 155, 19, .2), transparent 28rem),
    rgba(21, 21, 25, .72);
  backdrop-filter: blur(18px);
`;

const Modal = styled.div`
  width: min(980px, 100%);
  max-height: min(820px, calc(100vh - 28px));
  display: grid;
  grid-template-columns: minmax(280px, .78fr) minmax(0, 1fr);
  overflow: hidden;
  border-radius: 28px;
  background: #ffffff;
  border: 1px solid rgba(255, 255, 255, .72);
  box-shadow: 0 32px 90px rgba(0, 0, 0, .34);
  animation: ${modalIn} 320ms cubic-bezier(.22,.8,.28,1) both;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const ImagePanel = styled.div`
  position: relative;
  min-height: 560px;
  background: #151519;

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(21, 21, 25, .05), rgba(21, 21, 25, .62)),
      linear-gradient(45deg, rgba(254, 99, 78, .26), transparent 52%);
  }

  @media (max-width: 820px) {
    min-height: 230px;
  }
`;

const TeamImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
`;

const ImageCaption = styled.div`
  position: absolute;
  left: 24px;
  right: 24px;
  bottom: 24px;
  z-index: 1;
  color: #fff;
`;

const VersionPill = styled.div`
  width: fit-content;
  margin-bottom: 12px;
  padding: 7px 10px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.42);
  background: rgba(255,255,255,.14);
  backdrop-filter: blur(12px);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
`;

const ImageTitle = styled.div`
  max-width: 290px;
  font-size: clamp(25px, 4vw, 38px);
  line-height: 1;
  font-weight: 900;
  letter-spacing: 0;
`;

const Content = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: clamp(24px, 4vw, 42px);
  background:
    linear-gradient(180deg, rgba(244, 246, 250, .72), rgba(255,255,255,1) 42%),
    #fff;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 18px;
  right: 18px;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(21, 21, 25, .08);
  border-radius: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,.86);
  color: ${theme.ink};
  cursor: pointer;
  box-shadow: 0 12px 28px rgba(21, 21, 25, .08);
  transition: transform 160ms ease, background 160ms ease;

  &:hover {
    transform: translateY(-1px);
    background: #fff;
  }
`;

const Eyebrow = styled.div`
  width: fit-content;
  padding: 8px 11px;
  border-radius: 999px;
  background: rgba(254, 99, 78, .1);
  color: ${theme.brand};
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .08em;
  text-transform: uppercase;
`;

const Title = styled.h2`
  max-width: 600px;
  margin: 0;
  color: ${theme.ink};
  font-size: clamp(30px, 4vw, 46px);
  line-height: .98;
  font-weight: 900;
  letter-spacing: 0;
`;

const Copy = styled.p`
  max-width: 620px;
  margin: -8px 0 0;
  color: ${theme.inkMuted};
  font-size: 15px;
  line-height: 1.65;
`;

const DevLine = styled.p`
  margin: -8px 0 0;
  color: rgba(21, 21, 25, .55);
  font-size: 12px;
  line-height: 1.5;

  a {
    color: rgba(21, 21, 25, .7);
    font-weight: 800;
    text-decoration: none;
    border-bottom: 1px solid rgba(21, 21, 25, .18);
  }
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureButton = styled.button`
  min-height: 112px;
  padding: 15px;
  text-align: left;
  border: 1px solid rgba(21, 21, 25, .08);
  border-radius: 16px;
  background: #fff;
  color: ${theme.ink};
  cursor: pointer;
  box-shadow: 0 14px 34px rgba(21, 21, 25, .05);
  transition: transform 170ms ease, border-color 170ms ease, box-shadow 170ms ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(254, 99, 78, .28);
    box-shadow: 0 18px 42px rgba(21, 21, 25, .08);
  }
`;

const FeatureIcon = styled.span`
  width: 34px;
  height: 34px;
  margin-bottom: 12px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(254, 99, 78, .1);
  color: ${theme.brand};
  font-size: 19px;
`;

const FeatureTitle = styled.strong`
  display: block;
  margin-bottom: 4px;
  font-size: 13px;
  font-weight: 900;
`;

const FeatureCopy = styled.span`
  display: block;
  color: ${theme.inkMuted};
  font-size: 12px;
  line-height: 1.45;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding-top: 2px;

  @media (max-width: 620px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const Hint = styled.span`
  color: rgba(21, 21, 25, .48);
  font-size: 12px;
`;

const PrimaryButton = styled.button`
  min-height: 44px;
  padding: 0 18px;
  border: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, #FE634E, #ef9b13);
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 16px 34px rgba(254, 99, 78, .28);
  transition: transform 160ms ease, box-shadow 160ms ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 20px 40px rgba(254, 99, 78, .34);
  }
`;

function readWelcomeState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function shouldShowWelcome() {
  const state = readWelcomeState();
  if (state.version !== VERSION) return true;
  if ((state.showCount || 0) >= MAX_SHOWS) return false;
  if (!state.lastShownAt) return true;
  return Date.now() - Number(state.lastShownAt) >= WEEK_MS;
}

function saveWelcomeSeen() {
  const state = readWelcomeState();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: VERSION,
      showCount: Math.min((state.version === VERSION ? state.showCount || 0 : 0) + 1, MAX_SHOWS),
      lastShownAt: Date.now(),
    })
  );
}

const VersionWelcomeModal = ({ user }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user) return;
    setVisible(shouldShowWelcome());
  }, [user]);

  if (!visible) return null;

  const close = () => {
    saveWelcomeSeen();
    setVisible(false);
  };

  const openFeature = (to) => {
    close();
    navigate(to);
  };

  return (
    <Overlay role="presentation">
      <Modal role="dialog" aria-modal="true" aria-labelledby="version-welcome-title">
        <ImagePanel>
          <TeamImage src="/team.png" alt="" />
          <ImageCaption>
            <VersionPill>Version {VERSION}</VersionPill>
            <ImageTitle>ClinicPlus Booking Admin System</ImageTitle>
          </ImageCaption>
        </ImagePanel>
        <Content>
          <CloseButton type="button" onClick={close} aria-label="Close welcome message">
            <MdClose />
          </CloseButton>
          <Eyebrow>Welcome back</Eyebrow>
          <Title id="version-welcome-title">
            A sharper admin workspace is ready for you.
          </Title>
          <Copy>
            Welcome to version {VERSION} of the ClinicPlus Booking Admin System. This update gives you more control, clearer recovery paths, better visibility into bookings, and faster ways to get support while keeping your daily workflows familiar.
          </Copy>
          <DevLine>
            Built with care by Qwabi Engineering. Learn more at{" "}
            <a href="https://business.qwabi.co.za" target="_blank" rel="noreferrer">
              business.qwabi.co.za
            </a>.
          </DevLine>

          <FeatureGrid>
            {FEATURE_LINKS.map((feature) => {
              const Icon = feature.icon;
              return (
                <FeatureButton key={feature.label} type="button" onClick={() => openFeature(feature.to)}>
                  <FeatureIcon>
                    <Icon />
                  </FeatureIcon>
                  <FeatureTitle>{feature.label}</FeatureTitle>
                  <FeatureCopy>{feature.text}</FeatureCopy>
                </FeatureButton>
              );
            })}
          </FeatureGrid>

          <Footer>
            <Hint>This appears weekly for four weeks, then stays out of your way.</Hint>
            <PrimaryButton type="button" onClick={close}>
              Start working
            </PrimaryButton>
          </Footer>
        </Content>
      </Modal>
    </Overlay>
  );
};

export default VersionWelcomeModal;
