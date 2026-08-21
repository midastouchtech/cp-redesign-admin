const COMPANION_API_URL = process.env.REACT_APP_COMPANION_API_URL;

export function trackLoginEvent(user) {
  if (!COMPANION_API_URL || !user?.id) return;

  const companies = [
    ...(Array.isArray(user.companiesCanEdit) ? user.companiesCanEdit : []),
    ...(Array.isArray(user.companiesManaging) ? user.companiesManaging : []),
  ];

  const companyIds = Array.from(
    new Set(companies.map((company) => company?.id).filter((id) => typeof id === "string" && id.length > 0))
  );
  const companyNames = Array.from(
    new Set(companies.map((company) => company?.name).filter((name) => typeof name === "string" && name.length > 0))
  );

  fetch(`${COMPANION_API_URL}/api/usage/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: user.id,
      role: "admin",
      source: "cp-redesign-admin",
      userName: `${user?.details?.name || ""} ${user?.details?.surname || ""}`.trim(),
      email: user?.details?.email,
      companyIds,
      companyNames,
    }),
  }).catch((err) => console.warn("[trackLoginEvent] failed", err));
}
