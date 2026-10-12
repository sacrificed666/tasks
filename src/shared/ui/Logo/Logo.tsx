import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

// The brand mark
const Logo = ({ size = 32, className }: LogoProps) => {
  const id = useId();
  const fill = `${id}-fill`;
  const sheen = `${id}-sheen`;
  return (
    <svg className={className} viewBox="0 0 512 512" width={size} height={size} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2f95ff" />
          <stop offset="1" stopColor="#3d55f0" />
        </linearGradient>
        <linearGradient id={sheen} x1="0" y1="0" x2="0" y2="512" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity="0.3" />
          <stop offset="0.55" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="144" fill={`url(#${fill})`} />
      <rect width="512" height="512" rx="144" fill={`url(#${sheen})`} />
      <path
        d="M150 262L222 334L362 190"
        fill="none"
        stroke="#fff"
        strokeWidth="50"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default Logo;
