"use client";

import { LogoMark } from "@/components/icons/LogoMark";
import { Navbar } from "@/components/Navbar";
import Link from "next/link";
import { usePathname } from "next/navigation";

const authActions = [
  {
    label: "Login",
    href: "/login",
    className: `
      w-[72px]
      bg-white
      text-[#02AFA9]

      shadow-[0_6px_16px_rgba(0,0,0,0.08)]

      hover:-translate-y-[2px]
      hover:bg-[#fafafa]
      hover:shadow-[0_12px_24px_rgba(0,0,0,0.12)]

      active:translate-y-[1px]
      active:scale-[0.985]
      active:shadow-[0_4px_10px_rgba(0,0,0,0.10)]
    `,
  },
  {
    label: "Sign up",
    href: "/register",
    className: `
      w-[118px]
      bg-[#02AFA9]
      text-white

      shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)]

      hover:-translate-y-[2px]
      hover:bg-[#05bbb5]
      hover:shadow-[0_14px_28px_rgba(2,175,169,0.38),0_8px_16px_rgba(0,0,0,0.16)]

      active:translate-y-[1px]
      active:scale-[0.985]
      active:shadow-[0_4px_10px_rgba(2,175,169,0.25)]
    `,
  },
];

export function Header() {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="relative mx-auto h-[64px] max-w-[1440px] px-[22px] min-[1180px]:px-12">
        <Link
          href="/"
          aria-label="PropOS home"
          className="absolute left-[22px] top-[14px] flex h-[34px] items-center gap-[6px] transition-opacity duration-300 hover:opacity-80 min-[1180px]:left-12"
        >
          <LogoMark className="h-[32px] w-[32px]" />
          <span className="text-[18px] font-medium leading-none text-white">
            PropOS
          </span>
        </Link>

        <Navbar />

        {!isAuthPage && (
          <div className="absolute right-[21px] top-[14px] flex items-center gap-[11px] min-[1180px]:right-12 max-[620px]:right-[18px] max-[620px]:gap-2">
            {authActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                aria-label={action.label}
                className={[
                  `
                  inline-flex
                  h-[38px]
                  items-center
                  justify-center
                  whitespace-nowrap

                  rounded-[4px]

                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]

                  transition-all
                  duration-200
                  ease-out

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-[#5EE4DE]
                  focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#232332]
                  `,
                  action.className,
                  action.label === "Login" ? "max-[620px]:hidden" : "",
                ].join(" ")}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}