type ArrowRightIconProps = {
  className?: string;
};

export function ArrowRightIcon({ className }: ArrowRightIconProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M1.5 6h8.1M6.5 2.9 9.6 6 6.5 9.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}
