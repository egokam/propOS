import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";

export default function Login() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16">
        <div className="w-full max-w-md bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 shadow-2xl">
          <h1 className="text-[32px] font-medium leading-tight mb-2">Login</h1>
          <p className="text-[14px] text-white/45 mb-8">Welcome back to PropOS</p>
          
          <form className="space-y-5">
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">
                Email
              </label>
              <input 
                type="email" 
                required 
                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">
                Password
              </label>
              <input 
                type="password" 
                required 
                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
              />
            </div>
            
            <button 
              type="submit"
              className="mt-8 w-full inline-flex h-[46px] items-center justify-center whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] hover:shadow-[0_14px_28px_rgba(2,175,169,0.38),0_8px_16px_rgba(0,0,0,0.16)] active:translate-y-[1px] active:scale-[0.985] active:shadow-[0_4px_10px_rgba(2,175,169,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE4DE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#232332]"
            >
              Sign In
            </button>
          </form>
          
          <p className="mt-8 text-center text-[12px] text-white/45">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#02AFA9] hover:underline transition-all">
              Sign up
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}