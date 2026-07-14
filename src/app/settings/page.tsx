"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
// استدعاء المكونات المستقلة الجديدة
import AppAuthenticator from "@/components/settings/AppAuthenticator";
import EmailAuthenticator from "@/components/settings/EmailAuthenticator";

export default function SettingsPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const [activeTab, setActiveTab] = useState("personal");

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [pendingEmail, setPendingEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [newEmailInput, setNewEmailInput] = useState("");
    const [isOldOtpSent, setIsOldOtpSent] = useState(false);
    const [oldEmailOtp, setOldEmailOtp] = useState("");
    const [emailCooldown, setEmailCooldown] = useState(0);

    const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
    const [newEmailOtp, setNewEmailOtp] = useState("");
    const [newEmailCooldown, setNewEmailCooldown] = useState(0);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [isForgotPwModalOpen, setIsForgotPwModalOpen] = useState(false);
    const [forgotPwStep, setForgotPwStep] = useState(0);
    const [forgotPwCooldown, setForgotPwCooldown] = useState(0);
    const [forgotPwOtp, setForgotPwOtp] = useState("");
    const [forgotPwError, setForgotPwError] = useState("");
    const [resetPw1, setResetPw1] = useState("");
    const [resetPw2, setResetPw2] = useState("");

    const [activeDevices, setActiveDevices] = useState<any[]>([]);
    const [isLoadingDevices, setIsLoadingDevices] = useState(true);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
            return;
        }
        if (session?.user) {
            setFullName(session.user.name || "");
            setEmail(session.user.email || "");
            fetchActiveSessions();
        }
    }, [session, isPending, router]);

    useEffect(() => {
        let timer1: NodeJS.Timeout;
        let timer2: NodeJS.Timeout;
        let timer3: NodeJS.Timeout;
        if (emailCooldown > 0) timer1 = setInterval(() => setEmailCooldown(c => c - 1), 1000);
        if (forgotPwCooldown > 0) timer2 = setInterval(() => setForgotPwCooldown(c => c - 1), 1000);
        if (newEmailCooldown > 0) timer3 = setInterval(() => setNewEmailCooldown(c => c - 1), 1000);
        return () => { clearInterval(timer1); clearInterval(timer2); clearInterval(timer3); };
    }, [emailCooldown, forgotPwCooldown, newEmailCooldown]);

    const fetchActiveSessions = async () => {
        try {
            const { data, error } = await authClient.listSessions();
            if (data) setActiveDevices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoadingDevices(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    const handleRevokeDevice = async (token: string) => {
        try {
            await authClient.revokeSession({ token });
            setActiveDevices(prev => prev.filter(d => d.token !== token));
        } catch (error) {
            console.error(error);
        }
    };

    const handleSavePersonalDetails = async () => {
        try {
            const res = await fetch("/api/settings/personal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_profile", fullName, phoneNumber })
            });
            if (res.ok) alert("Personal details updated successfully!");
        } catch (error) {
            console.error(error);
        }
    };

    const handleSendOldOtp = async (e: React.MouseEvent | React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newEmailInput || emailCooldown > 0) return;
        setIsOldOtpSent(true);
        setEmailCooldown(45);
        try {
            await fetch("/api/settings/personal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "request_email_change", newEmail: newEmailInput })
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleVerifyOldOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (oldEmailOtp.length === 6) {
            try {
                const res = await fetch("/api/settings/personal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "verify_old_email", otp: oldEmailOtp, newEmail: newEmailInput })
                });
                if (res.ok) {
                    setPendingEmail(newEmailInput);
                    setIsEmailModalOpen(false);
                    setNewEmailInput("");
                    setOldEmailOtp("");
                    setIsOldOtpSent(false);
                    setEmailCooldown(0);
                } else {
                    alert("Invalid OTP");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleOpenVerifyModal = () => {
        setIsVerifyModalOpen(true);
        setNewEmailCooldown(45);
    };

    const handleResendNewEmailOtp = async () => {
        if (newEmailCooldown > 0) return;
        setNewEmailCooldown(45);
        try {
            await fetch("/api/settings/personal", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "resend_new_email_otp" })
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleVerifyNewOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newEmailOtp.length === 6) {
            try {
                const res = await fetch("/api/settings/personal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "verify_new_email", otp: newEmailOtp })
                });
                if (res.ok) {
                    setEmail(pendingEmail);
                    setPendingEmail("");
                    setIsVerifyModalOpen(false);
                    setNewEmailOtp("");
                    setNewEmailCooldown(0);
                } else {
                    alert("Invalid OTP");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return alert("New passwords do not match!");
        if (!currentPassword) return alert("Please enter your current password.");

        try {
            const res = await authClient.changePassword({ newPassword, currentPassword, revokeOtherSessions: true });
            if (res.error) {
                alert(res.error.message || "Failed to update password");
            } else {
                alert("Password updated successfully! Other sessions have been revoked.");
                setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
                fetchActiveSessions();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleForgotPwRequest = async () => {
        if (forgotPwCooldown > 0) return;
        setForgotPwCooldown(45);
        setForgotPwError("");
        setForgotPwStep(1);
        setIsForgotPwModalOpen(true);
        try {
            await fetch("/api/settings/security", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "request_forgot_password" })
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleForgotPwVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (forgotPwOtp.length === 6) {
            try {
                const res = await fetch("/api/settings/security", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "verify_forgot_password", otp: forgotPwOtp })
                });
                if (res.ok) {
                    setForgotPwStep(2);
                    setForgotPwError("");
                } else {
                    setForgotPwError("Incorrect verification code, please try again.");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const handleForgotPwSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (resetPw1 === resetPw2 && resetPw1.length > 5) {
            try {
                const res = await fetch("/api/settings/security", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "reset_password", otp: forgotPwOtp, newPassword: resetPw1 })
                });
                if (res.ok) {
                    alert("Password reset successfully!");
                    closeForgotPwModal();
                } else {
                    alert("Failed to reset password.");
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    const closeForgotPwModal = () => {
        setIsForgotPwModalOpen(false);
        setForgotPwStep(0); setForgotPwOtp(""); setForgotPwError(""); setResetPw1(""); setResetPw2("");
    };

    if (isPending) return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading...</div>;
    if (!session) return null;

    const userInitials = session.user.name ? session.user.name.charAt(0).toUpperCase() : "U";

    return (
        <div className="min-h-dvh bg-[#222231] text-white flex relative">
            <aside className="w-64 bg-[#1a1a24] border-r border-white/5 hidden md:flex flex-col z-10 shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    <button onClick={() => setActiveTab('personal')} className="w-full flex items-center gap-3 px-3 py-2.5 bg-[#02AFA9]/10 text-[#02AFA9] rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                    </button>
                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Contact Developer
                    </Link>
                </nav>
                <div className="p-4 border-t border-white/5">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2 text-white/50 hover:text-[#FF5E5F] hover:bg-[#FF5E5F]/10 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-h-dvh overflow-hidden z-10 relative">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#222231]/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
                    <div className="md:hidden text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </div>
                    <div className="hidden md:block text-sm text-white/50">
                        Settings
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                            <p className="text-xs text-white/40">{session?.user?.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-[#222231]">
                            {userInitials}
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 p-4 lg:p-6 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto shrink-0 custom-scrollbar">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'personal' ? 'bg-[#02AFA9]/10 text-[#02AFA9]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Personal Details
                        </button>
                        <button
                            onClick={() => setActiveTab('security')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'security' ? 'bg-[#02AFA9]/10 text-[#02AFA9]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Security
                        </button>
                        <button
                            onClick={() => setActiveTab('subscription')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === 'subscription' ? 'bg-[#02AFA9]/10 text-[#02AFA9]' : 'text-white/50 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            Subscription
                        </button>
                    </div>

                    <div className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                        <div className="max-w-3xl">

                            {/* PERSONAL DETAILS TAB */}
                            {activeTab === 'personal' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1">Personal Details</h2>
                                        <p className="text-sm text-white/50">Update your basic profile information.</p>
                                    </div>

                                    <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-6 space-y-6">
                                        <div>
                                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Full Name</label>
                                            <input
                                                type="text"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full max-w-md h-11 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                            />
                                        </div>

                                        <div className="border-t border-white/5 pt-6">
                                            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-2">Email Address</label>
                                            <div className="flex items-center gap-3">
                                                <div className="w-full max-w-sm h-11 bg-[#222231] border border-white/5 rounded-lg px-4 flex items-center text-sm text-white/50 cursor-not-allowed select-none">
                                                    {email}
                                                </div>
                                                <button
                                                    onClick={() => setIsEmailModalOpen(true)}
                                                    className="w-11 h-11 flex items-center justify-center rounded-lg border border-white/5 text-white/30 hover:bg-white/5 hover:text-white transition-colors shrink-0"
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                </button>
                                            </div>

                                            {pendingEmail && (
                                                <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in fade-in zoom-in duration-300">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-[#FF5E5F] animate-pulse"></div>
                                                        <p className="text-xs text-white/60">Pending confirmation: <span className="font-medium text-white">{pendingEmail}</span></p>
                                                    </div>
                                                    <button
                                                        onClick={handleOpenVerifyModal}
                                                        className="h-8 px-4 rounded-md bg-[#02AFA9]/10 text-[#02AFA9] text-xs font-semibold uppercase tracking-wider hover:bg-[#02AFA9] hover:text-white transition-colors"
                                                    >
                                                        Verify Now
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-white/5 pt-6">
                                            <div className="flex items-center gap-2 mb-2">
                                                <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50">Mobile Number</label>
                                                <span className="bg-white/10 text-white/70 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Recommended</span>
                                            </div>
                                            <input
                                                type="tel"
                                                value={phoneNumber}
                                                onChange={(e) => setPhoneNumber(e.target.value)}
                                                placeholder="+212 6 00 00 00 00"
                                                className="w-full max-w-md h-11 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button onClick={handleSavePersonalDetails} className="h-11 px-6 rounded-lg bg-[#02AFA9] text-white text-xs font-semibold uppercase tracking-wider shadow-[0_8px_20px_rgba(2,175,169,0.30)] hover:-translate-y-0.5 hover:bg-[#05bbb5] transition-all">
                                            Save Changes
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* SECURITY TAB */}
                            {activeTab === 'security' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1">Security</h2>
                                        <p className="text-sm text-white/50">Manage your passwords and secure your account.</p>
                                    </div>

                                    <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-6 space-y-5">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-sm font-medium text-white">Update Password</h3>
                                            <button
                                                onClick={handleForgotPwRequest}
                                                disabled={forgotPwCooldown > 0}
                                                className="text-xs font-medium text-[#02AFA9] hover:text-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {forgotPwCooldown > 0 ? `Wait ${forgotPwCooldown}s` : "Forgot Password?"}
                                            </button>
                                        </div>
                                        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
                                            <div>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="Current Password"
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    className="w-full h-11 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="New Password"
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full h-11 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                                />
                                            </div>
                                            <div>
                                                <input
                                                    type="password"
                                                    required
                                                    placeholder="Confirm New Password"
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="w-full h-11 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                                />
                                            </div>
                                            <button type="submit" className="h-10 px-5 rounded-lg bg-white/10 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-colors">
                                                Update Password
                                            </button>
                                        </form>
                                    </div>

                                    {/* 🛡️ THE ISOLATED 2FA COMPONENTS 🛡️ */}
                                    <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-6">
                                        <h3 className="text-sm font-medium text-white mb-1">Two-Factor Authentication (2FA)</h3>
                                        <p className="text-xs text-white/40 mb-6">Add an extra layer of security to your account.</p>

                                        <div className="space-y-4">
                                            <AppAuthenticator />
                                            <EmailAuthenticator />
                                        </div>
                                    </div>

                                    <div className="bg-[#1a1a24] border border-white/5 rounded-xl overflow-hidden">
                                        <div className="p-6 border-b border-white/5">
                                            <h3 className="text-sm font-medium text-white mb-1">Devices Logged In</h3>
                                            <p className="text-xs text-white/40">Review the devices that have accessed your account.</p>
                                        </div>
                                        <div className="divide-y divide-white/5">
                                            {isLoadingDevices ? (
                                                <div className="p-6 flex justify-center"><div className="w-5 h-5 border-2 border-[#02AFA9] border-t-transparent rounded-full animate-spin"></div></div>
                                            ) : activeDevices.length > 0 ? activeDevices.map(device => (
                                                <div key={device.token || device.id} className="p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-[#222231] flex items-center justify-center text-white/50 shrink-0">
                                                            {(device.userAgent?.includes("Mac") || device.userAgent?.includes("Windows")) ? (
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                            ) : (
                                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white flex items-center gap-2">
                                                                {device.userAgent ? device.userAgent.split(' ')[0] : 'Unknown Device'}
                                                                {device.token === session?.session?.token && <span className="bg-[#02AFA9]/20 text-[#02AFA9] text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded">This Device</span>}
                                                            </p>
                                                            <p className="text-xs text-white/40 mt-0.5">{device.ipAddress || "Unknown Location"} • {new Date(device.updatedAt || device.createdAt).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    {device.token !== session?.session?.token && (
                                                        <button
                                                            onClick={() => handleRevokeDevice(device.token)}
                                                            className="text-[11px] font-medium text-white/30 hover:text-[#FF5E5F] transition-colors"
                                                        >
                                                            Log Out
                                                        </button>
                                                    )}
                                                </div>
                                            )) : (
                                                <div className="p-6 text-center text-xs text-white/40">No active sessions found.</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* SUBSCRIPTION TAB */}
                            {activeTab === 'subscription' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div>
                                        <h2 className="text-2xl font-semibold mb-1">Subscription</h2>
                                        <p className="text-sm text-white/50">Manage your PropOS billing and plan.</p>
                                    </div>

                                    <div className="bg-gradient-to-br from-[#1a1a24] to-[#222231] border border-[#02AFA9]/20 rounded-xl p-8 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#02AFA9]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-xl font-bold text-white">Pro Plan</h3>
                                                    <span className="bg-[#02AFA9] text-white text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full">Active</span>
                                                </div>
                                                <p className="text-sm text-white/50 max-w-md">
                                                    You are currently on the Pro plan. You have full access to all Syndic, Villa, and Building management features.
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                <button
                                                    onClick={() => router.push("/settings/billing")}
                                                    className="h-12 px-6 rounded-lg bg-white/10 text-white text-xs font-semibold uppercase tracking-wider hover:bg-white/20 transition-all border border-white/5"
                                                >
                                                    Manage Subscription
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </main>

            {/* MODALS */}
            {isEmailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => { setIsEmailModalOpen(false); setIsOldOtpSent(false); setNewEmailInput(""); setEmailCooldown(0); setOldEmailOtp(""); }} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-medium mb-6">Change Email Address</h2>
                        <form onSubmit={handleVerifyOldOtp} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">New Email Address</label>
                                <input
                                    type="email" required value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} disabled={isOldOtpSent}
                                    className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all disabled:opacity-50"
                                    placeholder="Enter your new email"
                                />
                            </div>

                            {!isOldOtpSent ? (
                                <button type="button" onClick={handleSendOldOtp} disabled={!newEmailInput || emailCooldown > 0} className="w-full h-11 rounded-md bg-white/10 text-xs font-semibold uppercase tracking-wider text-white hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {emailCooldown > 0 ? `Wait ${emailCooldown}s` : "Send OTP to Current Email"}
                                </button>
                            ) : (
                                <div className="space-y-4 animate-in fade-in duration-300">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Enter OTP sent to {email}</label>
                                        <input
                                            type="text" required maxLength={6} value={oldEmailOtp} onChange={(e) => setOldEmailOtp(e.target.value)}
                                            className="w-full h-11 bg-[#1a1a24] border border-[#02AFA9]/50 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.3em]"
                                            placeholder="000000"
                                        />
                                    </div>
                                    <button type="submit" disabled={oldEmailOtp.length < 6} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">Confirm</button>
                                    <div className="mt-4 text-center">
                                        <p className="text-[11px] text-white/40 mb-2">Didn't get the OTP? Check your spam folder.</p>
                                        <button type="button" onClick={handleSendOldOtp} disabled={emailCooldown > 0} className="text-xs font-medium text-[#02AFA9] hover:text-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                            {emailCooldown > 0 ? `Request a new one in ${emailCooldown}s` : "Request new OTP"}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {isVerifyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => { setIsVerifyModalOpen(false); setNewEmailOtp(""); }} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-medium mb-1">Verify New Email</h2>
                        <p className="text-sm text-white/50 mb-6">Enter the OTP sent to <span className="text-white">{pendingEmail}</span></p>

                        <form onSubmit={handleVerifyNewOtp} className="space-y-5">
                            <div>
                                <input
                                    type="text" required maxLength={6} value={newEmailOtp} onChange={(e) => setNewEmailOtp(e.target.value)}
                                    className="w-full h-11 bg-[#1a1a24] border border-[#02AFA9]/50 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.3em]"
                                    placeholder="000000"
                                />
                            </div>
                            <button type="submit" disabled={newEmailOtp.length < 6} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">Verify & Update</button>
                            <div className="mt-4 text-center">
                                <p className="text-[11px] text-white/40 mb-2">Didn't get the OTP? Check your spam folder.</p>
                                <button type="button" onClick={handleResendNewEmailOtp} disabled={newEmailCooldown > 0} className="text-xs font-medium text-[#02AFA9] hover:text-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {newEmailCooldown > 0 ? `Request a new one in ${newEmailCooldown}s` : "Request new OTP"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isForgotPwModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={closeForgotPwModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-medium mb-1">Reset Password</h2>
                        <p className="text-sm text-white/50 mb-6">We will send a secure code to your email.</p>

                        {forgotPwStep === 0 && (
                            <div className="flex flex-col gap-4">
                                <button onClick={handleForgotPwRequest} disabled={forgotPwCooldown > 0} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                    {forgotPwCooldown > 0 ? `Wait ${forgotPwCooldown}s` : "Confirm by Email"}
                                </button>
                            </div>
                        )}

                        {forgotPwStep === 1 && (
                            <form onSubmit={handleForgotPwVerify} className="space-y-4 animate-in fade-in duration-300">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Enter Recovery Code</label>
                                    <input
                                        type="text" required maxLength={6} value={forgotPwOtp} onChange={(e) => setForgotPwOtp(e.target.value)}
                                        className={`w-full h-11 bg-[#1a1a24] border rounded-md px-4 text-sm text-white focus:outline-none transition-all text-center tracking-[0.3em] ${forgotPwError ? 'border-[#FF5E5F] focus:border-[#FF5E5F]' : 'border-[#02AFA9]/50 focus:border-[#02AFA9]'}`}
                                        placeholder="000000"
                                    />
                                    {forgotPwError && <p className="text-[10px] text-[#FF5E5F] mt-2 font-medium">{forgotPwError}</p>}
                                </div>
                                <button type="submit" disabled={forgotPwOtp.length < 6} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">Verify Code</button>
                                <div className="mt-4 text-center">
                                    <p className="text-[11px] text-white/40 mb-2">Didn't get the OTP? Check your spam folder.</p>
                                    <button type="button" onClick={handleForgotPwRequest} disabled={forgotPwCooldown > 0} className="text-xs font-medium text-[#02AFA9] hover:text-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                                        {forgotPwCooldown > 0 ? `Request a new one in ${forgotPwCooldown}s` : "Request new OTP"}
                                    </button>
                                </div>
                            </form>
                        )}

                        {forgotPwStep === 2 && (
                            <form onSubmit={handleForgotPwSave} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div><input type="password" required value={resetPw1} onChange={(e) => setResetPw1(e.target.value)} className="w-full h-11 bg-[#1a1a24] border border-white/10 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" placeholder="New Password" /></div>
                                <div><input type="password" required value={resetPw2} onChange={(e) => setResetPw2(e.target.value)} className="w-full h-11 bg-[#1a1a24] border border-white/10 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" placeholder="Confirm New Password" /></div>
                                <button type="submit" disabled={resetPw1 !== resetPw2 || resetPw1.length < 6} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">Save New Password</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}