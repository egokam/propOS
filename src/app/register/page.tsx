"use client";

import { useState, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";
import { authClient } from "@/lib/auth-client";

const PROPERTY_TYPES = [
    "Syndic",
    "commercial agent"
];

export default function Register() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(PROPERTY_TYPES[0]);
    const [propertyName, setPropertyName] = useState("");
    const [address, setAddress] = useState("");

    const handleOtpChange = (index: number, value: string) => {
        if (!/^[0-9]*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        if (value !== "" && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await authClient.signUp.email({
                email: email,
                password: password,
                name: name,
            });

            if (res.error) {
                alert(res.error.message || "Failed to sign up. This email might already exist!");
                setIsLoading(false);
                return;
            }

            if (res.data) {
                const otpRes = await authClient.emailOtp.sendVerificationOtp({
                    email: email,
                    type: "email-verification",
                });

                if (otpRes.error) {
                    alert(otpRes.error.message || "Account created, but failed to send OTP.");
                } else {
                    setStep(2);
                }
            }
        } catch (error: any) {
            console.error("Sign up error:", error);
            alert(error.message || "An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            const res = await authClient.emailOtp.verifyEmail({
                email,
                otp: otp.join(""),
            });
            
            if (res.error) {
                alert(res.error.message || "Invalid or expired verification code.");
            } else {
                setStep(3);
            }
        } catch (error: any) {
            alert(error.message || "An error occurred while verifying the code.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinueToSetup = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // تحويل نوع العقار إلى صيغة مناسبة للرابط (مثال: Centre commercial -> centre-commercial)
        const typeSlug = selectedProperty.toLowerCase().replace(/\s+/g, '-');
        
        // تجهيز البيانات لتمريرها في الرابط
        const queryParams = new URLSearchParams({
            type: selectedProperty,
            name: propertyName,
            address: address
        }).toString();

        // توجيه المستخدم إلى صفحة الإعداد المخصصة
        router.push(`/setup/${typeSlug}?${queryParams}`);
    };

    return (
        <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16 pb-16">
                <div className="w-full max-w-[540px] bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 md:p-10 shadow-2xl transition-all duration-300">

                    {step === 1 && (
                        <form onSubmit={handleSignUp} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <h1 className="text-[32px] font-medium leading-tight mb-2">Create Account</h1>
                            <p className="text-[14px] text-white/45 mb-8">Start managing your property properly.</p>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    />
                                </div>
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
                                <span>{isLoading ? "Loading..." : "Next Step"}</span>
                                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-[2px]" />}
                            </button>

                            <p className="mt-8 text-center text-[12px] text-white/45">
                                Already have an account?{" "}
                                <Link href="/login" className="text-[#02AFA9] hover:underline transition-all">
                                    Login
                                </Link>
                            </p>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h1 className="text-[32px] font-medium leading-tight mb-2">Confirm Email</h1>
                            <p className="text-[14px] text-white/45 mb-8">We've sent a 6-digit code to your email address.</p>

                            <div className="flex justify-between gap-2 sm:gap-4 mb-8">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { otpRefs.current[index] = el; }}
                                        type="text"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(index, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                        className="w-10 h-12 sm:w-14 sm:h-16 bg-[#1a1a24] border border-white/5 rounded-[4px] text-center text-[20px] font-medium text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    />
                                ))}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group mt-8 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] hover:shadow-[0_14px_28px_rgba(2,175,169,0.38),0_8px_16px_rgba(0,0,0,0.16)] active:translate-y-[1px] active:scale-[0.985] active:shadow-[0_4px_10px_rgba(2,175,169,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5EE4DE] focus-visible:ring-offset-2 focus-visible:ring-offset-[#232332] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isLoading ? "Verifying..." : "Verify Code"}</span>
                                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-[2px]" />}
                            </button>

                            <div className="flex flex-col gap-2 mt-3">
                                <button
                                    type="button"
                                    onClick={async () => {
                                        setIsLoading(true);
                                        const res = await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
                                        if (res.error) alert(res.error.message || "Failed to resend code.");
                                        else alert("A new code has been sent!");
                                        setIsLoading(false);
                                    }}
                                    disabled={isLoading}
                                    className="w-full inline-flex h-[46px] items-center justify-center whitespace-nowrap rounded-[4px] bg-transparent text-[10px] font-semibold uppercase tracking-[0.12em] text-[#02AFA9] transition-all duration-200 ease-out hover:bg-[#02AFA9]/10 focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Resend Code
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleContinueToSetup} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-500">
                            <h1 className="text-[32px] font-medium leading-tight mb-2">Primary Details</h1>
                            <p className="text-[14px] text-white/45 mb-8">What are you managing?</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Property Type</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 flex items-center justify-between text-[14px] text-white focus:outline-none focus:border-[#FF5E5F] focus:ring-1 focus:ring-[#FF5E5F] transition-all"
                                    >
                                        <span>{selectedProperty}</span>
                                        <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-2 py-2 bg-[#1a1a24] border border-white/10 rounded-[4px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {PROPERTY_TYPES.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProperty(type);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-[14px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Property Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Résidence Les Palmiers"
                                        value={propertyName}
                                        onChange={(e) => setPropertyName(e.target.value)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#FF5E5F] focus:ring-1 focus:ring-[#FF5E5F] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Address</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Main street, City"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#FF5E5F] focus:ring-1 focus:ring-[#FF5E5F] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group mt-8 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#FF5E5F] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(255,94,95,0.28),0_3px_8px_rgba(0,0,0,0.15)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#ff6b6c] hover:shadow-[0_14px_28px_rgba(255,94,95,0.35),0_8px_18px_rgba(0,0,0,0.18)] active:translate-y-[1px] active:scale-[0.985] active:shadow-[0_4px_10px_rgba(255,94,95,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8A8B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#232332] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isLoading ? "Loading..." : "Next: Complete Setup"}</span>
                                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1 group-active:translate-x-[2px]" />}
                            </button>

                        </form>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}