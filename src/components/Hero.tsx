import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative min-h-dvh overflow-hidden" aria-labelledby="hero-title">
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute right-[-23vw] top-[15.3vh] z-0 aspect-square w-[65.2vw] min-w-[580px] max-w-[900px]"
        height={674}
        priority
        src="/circle.svg"
        width={674}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-[-17.1vw] z-10 h-auto w-[59.5vw] min-w-[604px] max-w-[830px]"
        height={420}
        priority
        src="/city.svg"
        width={615}
      />

      <div className="relative z-20 mx-auto min-h-dvh max-w-[1440px] px-[43px] min-[1180px]:px-20 max-[720px]:px-6">
        <div className="absolute top-[37.75vh] max-w-[540px] min-[1180px]:max-w-[760px] max-[720px]:left-6 max-[720px]:right-6 max-[720px]:top-[23vh]">
          <h1
            className="max-w-[520px] text-[44px] font-normal leading-[1.23] tracking-[0] text-white min-[1180px]:max-w-[760px] min-[1180px]:text-[64px] min-[1180px]:leading-[1.1] max-[720px]:text-[38px]"
            id="hero-title"
          >
            Manage Your Property
            <br />
            Properly
          </h1>

          <p className="mt-[24px] max-w-[500px] text-[17px] font-normal leading-[1.75] tracking-[0] text-white/45 min-[1180px]:mt-7 min-[1180px]:text-[26px] min-[1180px]:leading-[1.55] max-[720px]:max-w-[360px] max-[720px]:text-[16px]">
            PropOS helps you manage your property, from all
            <br className="max-[720px]:hidden" />
            sides
          </p>

          <Link
            href="/register"
            aria-label="Get started"
            className="
    group
    ml-[2px]
    mt-8

    inline-flex
    h-[42px]
    w-[138px]

    items-center
    justify-center
    gap-2

    whitespace-nowrap
    rounded-[4px]

    bg-[#FF5E5F]

    text-[10px]
    font-semibold
    uppercase
    tracking-[0.12em]
    text-white

    shadow-[0_8px_18px_rgba(255,94,95,0.28),0_3px_8px_rgba(0,0,0,0.15)]

    transition-all
    duration-200
    ease-out

    hover:-translate-y-[2px]
    hover:bg-[#ff6b6c]
    hover:shadow-[0_14px_28px_rgba(255,94,95,0.35),0_8px_18px_rgba(0,0,0,0.18)]

    active:translate-y-[1px]
    active:scale-[0.985]
    active:shadow-[0_4px_10px_rgba(255,94,95,0.25)]

    focus-visible:outline-none
    focus-visible:ring-2
    focus-visible:ring-[#FF8A8B]
    focus-visible:ring-offset-2
    focus-visible:ring-offset-[#232332]

    min-[1180px]:mt-10
    min-[1180px]:h-[46px]
    min-[1180px]:w-[152px]
  "
          >
            <span className="whitespace-nowrap">Get Started</span>

            <ArrowRightIcon
              className="
      h-[10px]
      w-[10px]
      transition-transform
      duration-200
      group-hover:translate-x-1
      group-active:translate-x-[2px]
    "
            />
          </Link>
        </div>
      </div>
    </section>
  );
}