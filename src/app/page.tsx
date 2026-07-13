import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
    </div>
  );
}
