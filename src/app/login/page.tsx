"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { authClient } from "@/lib/auth-client";

export default function Login() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        alert(res.error.message || "Invalid email or password.");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      alert("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">
        Loading...
      </div>
    );
  }

  if (session) return null;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16 pb-16">
        <div className="w-full max-w-[540px] bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 md:p-10 shadow-2xl transition-all duration-300">
          <form onSubmit={handleSignIn} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-[32px] font-medium leading-tight mb-2">Welcome Back</h1>
            <p className="text-[14px] text-white/45 mb-8">Login to manage your properties.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="group mt-8 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] hover:shadow-[0_14px_28px_rgba(2,175,169,0.38),0_8px_16px_rgba(0,0,0,0.16)] active:translate-y-[1px] active:scale-[0.985] active:shadow-[0_4px_10px_rgba(2,175,169,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE4DE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#232332] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? "Signing in..." : "Login"}</span>
              {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-[2px]" />}
            </button>

            <p className="mt-8 text-center text-[12px] text-white/45">
              Don't have an account yet?{" "}
              <Link href="/register" className="text-[#02AFA9] hover:underline transition-all">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}