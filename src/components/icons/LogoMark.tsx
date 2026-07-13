type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="17" cy="17" fill="white" r="17" />
      <path
        d="M17.14 7.88 9.72 22.08c-.33.64.35 1.33.98.98l5.86-3.27c.35-.2.47-.64.27-.99l-2.07-3.59 2.38-4.55 5.46 10.42c.35.67 1.33.67 1.68 0l.79-1.51c.15-.3.15-.65 0-.94L17.98 7.88a.48.48 0 0 0-.84 0Z"
        fill="#FF5E5F"
      />
      <path
        d="m16.56 19.79 5.83 3.25c.64.36 1.33-.34.99-.98l-2.98-5.69-3.58 2.42c-.34.23-.3.8-.26 1Z"
        fill="#13C7C1"
      />
    </svg>
  );
}
