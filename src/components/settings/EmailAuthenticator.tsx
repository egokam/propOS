"use client";

import { useState, useEffect } from "react";

export default function EmailAuthenticator() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [modal, setModal] = useState<{ isOpen: boolean, action: 'enable' | 'disable', step: number }>({ 
        isOpen: false, action: 'enable', step: 0 
    });
    const [password, setPassword] = useState("");
    const [setupCode, setSetupCode] = useState("");
    const [cooldown, setCooldown] = useState(0);

    // 🛡️ العزل: جلب حالة الإيميل فقط
    useEffect(() => {
        fetch(`/api/settings/2fa/email?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                setIsEnabled(data.isEnabled === true);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    // مؤقت الإيميل المعزول
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (cooldown > 0) timer = setInterval(() => setCooldown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleToggle = (checked: boolean) => {
        setModal({ isOpen: true, action: checked ? 'enable' : 'disable', step: 0 });
    };

    const closeModal = () => {
        setModal({ isOpen: false, action: 'enable', step: 0 });
        setPassword("");
        setSetupCode("");
        setCooldown(0);
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        const actionType = modal.action === 'enable' ? 'request_setup' : 'disable';
        
        const res = await fetch("/api/settings/2fa/email", { 
            method: "POST", 
            headers: { "Content-Type": "application/json" }, 
            body: JSON.stringify({ action: actionType, password }) 
        });

        if (!res.ok) return alert("Incorrect password or error");

        if (modal.action === 'enable') {
            setModal(prev => ({ ...prev, step: 1 }));
            setCooldown(45); // تشغيل العداد
        } else {
            setIsEnabled(false);
            closeModal();
        }
    };

    const handleResendOtp = async () => {
        if (cooldown > 0) return;
        setCooldown(45);
        try {
            await fetch("/api/settings/2fa/email", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ action: "request_setup", password }) 
            });
        } catch (error) {
            console.error(error);
        }
    };

    const handleConfirmSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (setupCode.length === 6) {
            const res = await fetch("/api/settings/2fa/email", { 
                method: "POST", 
                headers: { "Content-Type": "application/json" }, 
                body: JSON.stringify({ action: "verify_setup", otp: setupCode }) 
            });
            
            if (!res.ok) return alert("Invalid Code");
            
            setIsEnabled(true);
            closeModal();
        }
    };

    if (isLoading) return <div className="p-4 border border-white/5 rounded-lg bg-[#222231] animate-pulse h-[74px]"></div>;

    return (
        <>
            <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-[#222231]">
                <div>
                    <p className="text-sm font-medium text-white">Email Recovery</p>
                    <p className="text-[11px] text-white/40">Receive a code via Email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => handleToggle(e.target.checked)} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#02AFA9]"></div>
                </label>
            </div>

            {/* NEW 2FA MODAL (EMAIL) */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-medium mb-1">
                            {modal.action === 'enable' ? 'Setup Email Auth' : 'Disable Email Auth'}
                        </h2>
                        <p className="text-sm text-white/50 mb-6">
                            {modal.step === 0 
                                ? 'Please enter your password to continue.' 
                                : 'We sent a secure code to your email.'}
                        </p>

                        {modal.step === 0 ? (
                            <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Your Password</label>
                                    <input
                                        type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                                        className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                        placeholder="Enter password"
                                    />
                                </div>
                                <button type="submit" disabled={!password} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">
                                    Continue
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleConfirmSetup} className="space-y-5 animate-in slide-in-from-right-4 duration-300">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Enter Verification Code</label>
                                    <input
                                        type="text" required maxLength={6} value={setupCode} onChange={(e) => setSetupCode(e.target.value)}
                                        className="w-full h-11 bg-[#1a1a24] border border-[#02AFA9]/50 rounded-md px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all text-center tracking-[0.3em]"
                                        placeholder="000000"
                                    />
                                </div>
                                <button type="submit" disabled={setupCode.length < 6} className="w-full h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">
                                    Verify & Enable
                                </button>

                                <div className="mt-4 text-center">
                                    <p className="text-[11px] text-white/40 mb-2">Didn't get the OTP? Check your spam folder.</p>
                                    <button
                                        type="button"
                                        onClick={handleResendOtp}
                                        disabled={cooldown > 0}
                                        className="text-xs font-medium text-[#02AFA9] hover:text-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {cooldown > 0 ? `Request a new one in ${cooldown}s` : "Request new OTP"}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}