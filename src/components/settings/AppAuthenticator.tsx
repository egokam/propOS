"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { QRCodeSVG } from "qrcode.react";

export default function AppAuthenticator() {
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    
    const [modal, setModal] = useState<{ isOpen: boolean, action: 'enable' | 'disable', step: number, totpUri: string }>({ 
        isOpen: false, action: 'enable', step: 0, totpUri: "" 
    });
    const [password, setPassword] = useState("");
    const [setupCode, setSetupCode] = useState("");

    // 🛡️ العزل: جلب حالة التطبيق فقط
    useEffect(() => {
        fetch(`/api/settings/2fa/app?t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                setIsEnabled(data.isEnabled === true);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, []);

    const handleToggle = (checked: boolean) => {
        setModal({ isOpen: true, action: checked ? 'enable' : 'disable', step: 0, totpUri: "" });
    };

    const closeModal = () => {
        setModal({ isOpen: false, action: 'enable', step: 0, totpUri: "" });
        setPassword("");
        setSetupCode("");
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;

        if (modal.action === 'enable') {
            const res = await authClient.twoFactor.enable({ password });
            if (res.error) return alert(res.error.message || "Incorrect Password");
            setModal(prev => ({ ...prev, step: 1, totpUri: res.data?.totpURI || "" }));
        } else {
            const res = await authClient.twoFactor.disable({ password });
            if (res.error) return alert(res.error.message || "Incorrect Password");
            setIsEnabled(false);
            closeModal();
        }
    };

    const handleConfirmSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (setupCode.length === 6) {
            const res = await authClient.twoFactor.verifyTotp({ code: setupCode });
            if (res.error) return alert(res.error.message || "Invalid Code");
            setIsEnabled(true);
            closeModal();
        }
    };

    if (isLoading) return <div className="p-4 border border-white/5 rounded-lg bg-[#222231] animate-pulse h-[74px]"></div>;

    return (
        <>
            <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-[#222231]">
                <div>
                    <p className="text-sm font-medium text-white">Authenticator App</p>
                    <p className="text-[11px] text-white/40">Google Authenticator, Authy, etc.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={(e) => handleToggle(e.target.checked)} />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#02AFA9]"></div>
                </label>
            </div>

            {/* NEW 2FA MODAL (APP) */}
            {modal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={closeModal} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-medium mb-1">
                            {modal.action === 'enable' ? 'Setup Two-Factor Auth' : 'Disable Two-Factor Auth'}
                        </h2>
                        <p className="text-sm text-white/50 mb-6">
                            {modal.step === 0 
                                ? 'Please enter your password to continue.' 
                                : 'Scan the QR code with your Authenticator App.'}
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
                                {modal.totpUri && (
                                    <div className="flex flex-col items-center justify-center mb-6 space-y-4">
                                        <div className="w-44 h-44 bg-white rounded-lg flex items-center justify-center border-4 border-white/10 p-2">
                                            <QRCodeSVG value={modal.totpUri} size={160} />
                                        </div>
                                        <div className="text-center w-full">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-1.5">
                                                Or enter this code manually:
                                            </p>
                                            <div className="bg-[#1a1a24] border border-white/10 px-3 py-2 rounded-md flex justify-center items-center">
                                                <code className="text-[#02AFA9] font-mono tracking-[0.15em] text-xs select-all">
                                                    {(() => {
                                                        try {
                                                            return new URL(modal.totpUri).searchParams.get("secret") || "No Secret Found";
                                                        } catch {
                                                            return "Invalid URI";
                                                        }
                                                    })()}
                                                </code>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                            </form>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}