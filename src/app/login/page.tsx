"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { authClient } from "@/lib/auth-client";

// Added new steps for the forgot password flow
type LoginStep = "login" | "choose" | "verify_app" | "verify_email" | "forgot_pw_email" | "forgot_pw_otp" | "forgot_pw_reset";

export default function Login() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [step, setStep] = useState<LoginStep>("login");
  const [isLoading, setIsLoading] = useState(false);
  const [hasBothOptions, setHasBothOptions] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Forgot Password States
  const [forgotPwEmail, setForgotPwEmail] = useState("");
  const [forgotPwOtp, setForgotPwOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotPwCooldown, setForgotPwCooldown] = useState(0);

  useEffect(() => {
    if (!isPending && session) {
      router.replace("/dashboard");
    }
  }, [session, isPending, router]);

  // Timers for both 2FA and Forgot Password
  useEffect(() => {
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    if (cooldown > 0) timer1 = setInterval(() => setCooldown(c => c - 1), 1000);
    if (forgotPwCooldown > 0) timer2 = setInterval(() => setForgotPwCooldown(c => c - 1), 1000);
    return () => { clearInterval(timer1); clearInterval(timer2); };
  }, [cooldown, forgotPwCooldown]);

  const handleInitialSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const checkRes = await fetch("/api/auth/login-2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check", email, password })
      });

      if (!checkRes.ok) {
        const err = await checkRes.json();
        alert(err.message || "Invalid email or password.");
        setIsLoading(false);
        return;
      }

      const { appEnabled, emailEnabled } = await checkRes.json();
      setHasBothOptions(appEnabled && emailEnabled);

      if (!appEnabled && !emailEnabled) {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) alert(res.error.message);
        else window.location.href = "/dashboard";
      } 
      else if (appEnabled && emailEnabled) {
        setStep("choose");
      } 
      else if (appEnabled) {
        const res = await authClient.signIn.email({ email, password });
        if (res.error) { alert(res.error.message); setIsLoading(false); return; }
        if ((res.data as any)?.session) { window.location.href = "/dashboard"; return; }
        setStep("verify_app");
      } 
      else if (emailEnabled) {
        await requestEmailOtp();
        setStep("verify_email");
      }
    } catch (error) {
      alert("An unexpected error occurred during login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChooseApp = async () => {
    setIsLoading(true);
    const res = await authClient.signIn.email({ email, password });
    if (res.error) { alert(res.error.message); setIsLoading(false); return; }
    if ((res.data as any)?.session) { window.location.href = "/dashboard"; return; }
    setStep("verify_app");
    setIsLoading(false);
  };

  const handleChooseEmail = async () => {
    setIsLoading(true);
    await requestEmailOtp();
    setStep("verify_email");
    setIsLoading(false);
  };

  const requestEmailOtp = async () => {
    setCooldown(45);
    await fetch("/api/auth/login-2fa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send_email", email, password })
    });
  };

  const handleVerifyApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const cleanCode = otpCode.replace(/\s/g, '');
    const res = await authClient.twoFactor.verifyTotp({ code: cleanCode });
    if (res.error) {
      alert(res.error.message || "Invalid code");
      setIsLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const res = await fetch("/api/auth/login-2fa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "verify_email", email, password, otp: otpCode })
    });

    if (!res.ok) { alert("Invalid or expired OTP"); setIsLoading(false); return; }

    const authRes = await authClient.signIn.email({ email, password });

    await fetch("/api/auth/login-2fa", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "restore_2fa", email })
    });

    if (authRes.error) { alert("Verification succeeded, but login failed."); setIsLoading(false); } 
    else { window.location.href = "/dashboard"; }
  };

  // ================= FORGOT PASSWORD FLOW =================

  const handleRequestPwReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!forgotPwEmail || forgotPwCooldown > 0) return;
    setIsLoading(true);
    setForgotPwCooldown(45);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", email: forgotPwEmail })
      });
      setStep("forgot_pw_otp");
    } catch (error) {
      alert("Failed to send reset code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPwResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", email: forgotPwEmail, otp: forgotPwOtp })
      });
      if (!res.ok) alert("Invalid or expired code.");
      else setStep("forgot_pw_reset");
    } catch (error) {
      alert("Error verifying code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) return alert("Passwords do not match.");
    if (newPassword.length < 6) return alert("Password must be at least 6 characters.");
    
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset_password", email: forgotPwEmail, otp: forgotPwOtp, newPassword })
      });
      
      if (!res.ok) {
        alert("Failed to reset password. Please try again.");
      } else {
        alert("Password reset successfully! Please login with your new password.");
        setPassword("");
        setStep("login");
      }
    } catch (error) {
      alert("Error resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isPending) return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading...</div>;
  if (session) return null;

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16 pb-16">
        <div className="w-full max-w-[540px] bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 md:p-10 shadow-2xl transition-all duration-300">
          
          {step === "login" && (
            <form onSubmit={handleInitialSignIn} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-[32px] font-medium leading-tight mb-2">Welcome Back</h1>
              <p className="text-[14px] text-white/45 mb-8">Login to manage your properties.</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">Password</label>
                    <button 
                      type="button" 
                      onClick={() => { setForgotPwEmail(email); setStep("forgot_pw_email"); }} 
                      className="text-[10px] font-medium text-[#02AFA9] hover:text-[#05bbb5] hover:underline transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                </div>
              </div>

              <button type="submit" disabled={isLoading} className="group mt-8 w-full inline-flex h-[46px] items-center justify-center gap-2 rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white transition-all hover:-translate-y-[2px] hover:bg-[#05bbb5] disabled:opacity-50">
                <span>{isLoading ? "Signing in..." : "Login"}</span>
                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1" />}
              </button>

              <p className="mt-8 text-center text-[12px] text-white/45">
                Don't have an account yet? <Link href="/register" className="text-[#02AFA9] hover:underline">Create one</Link>
              </p>
            </form>
          )}

          {/* ... EXISTING 2FA STEPS ("choose", "verify_app", "verify_email") STAY EXACTLY THE SAME ... */}
          {step === "choose" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div><h1 className="text-[28px] font-medium leading-tight mb-2">Two-Factor Auth</h1><p className="text-[14px] text-white/45">Choose how you want to verify your identity.</p></div>
              <button onClick={handleChooseApp} disabled={isLoading} className="w-full flex items-center p-4 bg-[#1a1a24] border border-white/5 rounded-lg hover:border-[#02AFA9] transition-all group disabled:opacity-50">
                <div className="w-10 h-10 rounded-full bg-[#02AFA9]/10 flex items-center justify-center text-[#02AFA9] mr-4"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                <div className="text-left flex-1"><p className="text-sm font-medium text-white mb-0.5">Authenticator App</p><p className="text-[11px] text-white/40">Use Google Authenticator or Authy</p></div>
              </button>
              <button onClick={handleChooseEmail} disabled={isLoading} className="w-full flex items-center p-4 bg-[#1a1a24] border border-white/5 rounded-lg hover:border-[#02AFA9] transition-all group disabled:opacity-50">
                <div className="w-10 h-10 rounded-full bg-[#02AFA9]/10 flex items-center justify-center text-[#02AFA9] mr-4"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></div>
                <div className="text-left flex-1"><p className="text-sm font-medium text-white mb-0.5">Email Recovery</p><p className="text-[11px] text-white/40">Receive a 6-digit code at {email}</p></div>
              </button>
            </div>
          )}

          {step === "verify_app" && (
            <form onSubmit={handleVerifyApp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div><h1 className="text-[28px] font-medium leading-tight mb-2">Authenticator App</h1><p className="text-[14px] text-white/45">Enter the 6-digit code from your app.</p></div>
              <input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full h-[54px] bg-[#1a1a24] border border-[#02AFA9]/50 rounded-[4px] px-4 text-[18px] text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.4em] font-mono" placeholder="000000" />
              <button type="submit" disabled={otpCode.length < 6 || isLoading} className="w-full h-[46px] rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#05bbb5] transition-all disabled:opacity-50">{isLoading ? "Verifying..." : "Verify Code"}</button>
              {hasBothOptions && <div className="text-center pt-2"><button type="button" onClick={() => { setStep("choose"); setOtpCode(""); }} className="text-[12px] font-medium text-white/50 hover:text-[#02AFA9] transition-colors">Choose another method</button></div>}
            </form>
          )}

          {step === "verify_email" && (
            <form onSubmit={handleVerifyEmail} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div><h1 className="text-[28px] font-medium leading-tight mb-2">Check Your Email</h1><p className="text-[14px] text-white/45">We sent a 6-digit code to {email}.</p></div>
              <input type="text" required maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)} className="w-full h-[54px] bg-[#1a1a24] border border-[#02AFA9]/50 rounded-[4px] px-4 text-[18px] text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.4em] font-mono" placeholder="000000" />
              <button type="submit" disabled={otpCode.length < 6 || isLoading} className="w-full h-[46px] rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#05bbb5] transition-all disabled:opacity-50">{isLoading ? "Verifying..." : "Verify Code"}</button>
              <div className="text-center pt-2 flex flex-col gap-2">
                <button type="button" onClick={requestEmailOtp} disabled={cooldown > 0} className="text-[12px] font-medium text-[#02AFA9] hover:text-[#05bbb5] disabled:opacity-50 transition-colors">{cooldown > 0 ? `Request a new code in ${cooldown}s` : "Resend Code"}</button>
                {hasBothOptions && <button type="button" onClick={() => { setStep("choose"); setOtpCode(""); }} className="text-[12px] font-medium text-white/50 hover:text-[#02AFA9] transition-colors">Choose another method</button>}
              </div>
            </form>
          )}

          {/* ================= FORGOT PASSWORD SCREENS ================= */}
          
          {step === "forgot_pw_email" && (
            <form onSubmit={handleRequestPwReset} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-[28px] font-medium leading-tight mb-2">Reset Password</h1>
                <p className="text-[14px] text-white/45 mb-8">Enter your email to receive a reset code.</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Account Email</label>
                <input type="email" required value={forgotPwEmail} onChange={(e) => setForgotPwEmail(e.target.value)} className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
              </div>
              <button type="submit" disabled={isLoading || forgotPwCooldown > 0} className="w-full h-[46px] rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#05bbb5] transition-all disabled:opacity-50">
                {isLoading ? "Sending..." : forgotPwCooldown > 0 ? `Wait ${forgotPwCooldown}s` : "Send Reset Code"}
              </button>
              <div className="text-center pt-2">
                <button type="button" onClick={() => setStep("login")} className="text-[12px] font-medium text-white/50 hover:text-[#02AFA9] transition-colors">Back to Login</button>
              </div>
            </form>
          )}

          {step === "forgot_pw_otp" && (
            <form onSubmit={handleVerifyPwResetOtp} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-[28px] font-medium leading-tight mb-2">Verify Reset Code</h1>
                <p className="text-[14px] text-white/45">We sent a 6-digit code to {forgotPwEmail}.</p>
              </div>
              <input type="text" required maxLength={6} value={forgotPwOtp} onChange={(e) => setForgotPwOtp(e.target.value)} className="w-full h-[54px] bg-[#1a1a24] border border-[#02AFA9]/50 rounded-[4px] px-4 text-[18px] text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.4em] font-mono" placeholder="000000" />
              <button type="submit" disabled={forgotPwOtp.length < 6 || isLoading} className="w-full h-[46px] rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#05bbb5] transition-all disabled:opacity-50">
                {isLoading ? "Verifying..." : "Verify Code"}
              </button>
              <div className="text-center pt-2 flex flex-col gap-2">
                <button type="button" onClick={handleRequestPwReset} disabled={forgotPwCooldown > 0} className="text-[12px] font-medium text-[#02AFA9] hover:text-[#05bbb5] disabled:opacity-50 transition-colors">{forgotPwCooldown > 0 ? `Request a new code in ${forgotPwCooldown}s` : "Resend Code"}</button>
                <button type="button" onClick={() => { setStep("login"); setForgotPwOtp(""); }} className="text-[12px] font-medium text-white/50 hover:text-[#02AFA9] transition-colors">Back to Login</button>
              </div>
            </form>
          )}

          {step === "forgot_pw_reset" && (
            <form onSubmit={handleSaveNewPassword} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <h1 className="text-[28px] font-medium leading-tight mb-2">New Password</h1>
                <p className="text-[14px] text-white/45 mb-8">Set a strong new password for your account.</p>
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">New Password</label>
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Confirm New Password</label>
                <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
              </div>
              <button type="submit" disabled={isLoading || newPassword.length < 6 || newPassword !== confirmPassword} className="w-full h-[46px] rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white hover:bg-[#05bbb5] transition-all disabled:opacity-50">
                {isLoading ? "Saving..." : "Save New Password"}
              </button>
            </form>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
}