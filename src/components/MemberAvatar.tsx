type Props = { size?: number };

// Avatar genérico de los mockups (silueta dorada en un círculo).
const MemberAvatar = ({ size = 72 }: Props) => (
  <svg width={size} height={size} viewBox="0 0 72 72" aria-hidden="true" className="shrink-0">
    <circle cx="36" cy="36" r="35" fill="rgba(215,163,97,0.12)" stroke="rgba(215,163,97,0.45)" />
    <circle cx="36" cy="29" r="11" fill="rgba(215,163,97,0.6)" />
    <path d="M15 58c3-11 11-17 21-17s18 6 21 17z" fill="rgba(215,163,97,0.6)" />
  </svg>
);

export default MemberAvatar;
