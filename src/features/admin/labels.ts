export const ROLE_LABEL = {
  ADMIN: "Admin",
  EXPERT: "English Expert",
  MEMBER: "Member",
} as const;

export const STATUS_LABEL = {
  PENDING: "Pending",
  INTERVIEWED: "Interviewed",
} as const;

export const accountStatus = (user: { isActive: boolean; hasPassword: boolean }) =>
  !user.isActive
    ? ({ label: "Disabled", tone: "danger" } as const)
    : user.hasPassword
      ? ({ label: "Active", tone: "cream" } as const)
      : ({ label: "Invited", tone: "gold" } as const);

const dateFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Mexico_City",
});

export const formatDate = (date: Date) => dateFormat.format(date);
