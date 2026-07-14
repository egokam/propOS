"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

export default function ContactDeveloperPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();

    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
        }
    }, [session, isPending, router]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 🚀 استخدام الـ API الحقيقي لإرسال الإيميل فعلياً
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ subject, message })
            });

            if (res.ok) {
                setIsSuccess(true);
                setSubject("");
                setMessage("");

                // إخفاء رسالة النجاح بعد 5 ثواني للعودة للنموذج
                setTimeout(() => setIsSuccess(false), 5000);
            } else {
                alert("Failed to send message. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    if (isPending) return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading...</div>;
    if (!session) return null;

    const userInitials = session.user.name ? session.user.name.charAt(0).toUpperCase() : "U";
    const profileImage = session.user.image;

    return (
        <div className="min-h-dvh bg-[#222231] text-white flex relative overflow-hidden">
            {/* 🌟 تأثيرات الإضاءة الخلفية (Background Glow) 🌟 */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#02AFA9] rounded-full mix-blend-screen filter blur-[120px] opacity-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] bg-[#05bbb5] rounded-full mix-blend-screen filter blur-[100px] opacity-10 animate-pulse" style={{ animationDelay: "2s" }}></div>

            {/* Sidebar */}
            <aside className="w-64 bg-[#1a1a24]/90 backdrop-blur-xl border-r border-white/5 hidden md:flex flex-col z-20 shrink-0">
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
                    <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                    </Link>
                    <Link href="/contact" className="flex items-center gap-3 px-3 py-2.5 bg-[#02AFA9]/10 text-[#02AFA9] rounded-md text-sm font-medium transition-colors">
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

            <main className="flex-1 flex flex-col min-h-dvh overflow-y-auto z-20 relative custom-scrollbar">
                {/* Header */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#222231]/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
                    <div className="md:hidden text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </div>
                    <div className="hidden md:block text-sm text-white/50">
                        Support & Contact
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{session.user.name}</p>
                            <p className="text-xs text-white/40">{session.user.email}</p>
                        </div>
                        <div onClick={() => router.push("/settings")} className="w-10 h-10 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-[#222231] cursor-pointer hover:scale-105 transition-transform overflow-hidden">
                            {profileImage ? <img src={profileImage} alt="User" className="w-full h-full object-cover" /> : userInitials}
                        </div>
                    </div>
                </header>

                <div className="p-6 lg:p-10 max-w-6xl mx-auto w-full">
                    <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <h1 className="text-3xl font-semibold mb-2">Let's Connect 👋</h1>
                        <p className="text-white/50">Have a question, feedback, or a brilliant idea? I'm just a message away.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                        {/* 🌟 كارت المطور السحري (اليسار) 🌟 */}
                        <div className="lg:col-span-2 relative group animate-in fade-in slide-in-from-left-8 duration-700 delay-100">
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#02AFA9] to-[#222231] rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                            <div className="relative h-full bg-[#1a1a24] border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center overflow-hidden">

                                {/* دوائر تصميمية في الخلفية */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                                <div className="w-24 h-24 rounded-full border-4 border-[#222231] bg-[#02AFA9]/10 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(2,175,169,0.3)] relative group-hover:scale-105 transition-transform duration-500">
                                    <span className="text-3xl">👨‍💻</span>
                                </div>

                                <h2 className="text-2xl font-bold text-white mb-1">Kamal</h2>
                                <p className="text-[#02AFA9] text-sm font-medium uppercase tracking-widest mb-6">Full-Stack Developer</p>

                                <p className="text-sm text-white/60 mb-8 leading-relaxed">
                                    Architecting and building scalable digital solutions. Passionate about clean code, robust systems, and seamless user experiences.
                                </p>

                                <div className="w-full space-y-3 mt-auto">
                                    {/* زر GitHub - تمت إضافة z-10 والرابط الصحيح */}
                                    <a href="https://github.com/egokam" target="_blank" rel="noopener noreferrer" className="relative z-10 flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#02AFA9]/30 transition-all group/btn cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-[#222231] flex items-center justify-center text-white/50 group-hover/btn:text-[#02AFA9] transition-colors">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                        </div>
                                        <span className="text-sm font-medium text-white/80 group-hover/btn:text-white transition-colors">GitHub: egokam</span>
                                    </a>

                                    {/* زر الإيميل المباشر - تمت إضافة z-10 ورابط mailto */}
                                    {/* زر الإيميل المباشر الذكي مع ميزة النسخ */}
                                    <a
                                        href="mailto:contact@egokam.site?subject=propOS%20reclamation"
                                        onClick={() => {
                                            navigator.clipboard.writeText("contact@egokam.site");
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2000);
                                        }}
                                        className="relative z-10 flex items-center gap-3 w-full p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#02AFA9]/30 transition-all group/btn cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-[#222231] flex items-center justify-center text-white/50 group-hover/btn:text-[#02AFA9] transition-colors">
                                            {copied ? (
                                                <svg className="w-4 h-4 text-[#02AFA9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className={`text-sm font-medium transition-colors ${copied ? 'text-[#02AFA9]' : 'text-white/80 group-hover/btn:text-white'}`}>
                                            {copied ? "Email copied to clipboard!" : "contact@egokam.site"}
                                        </span>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* 🌟 نموذج التواصل الديناميكي (اليمين) 🌟 */}
                        <div className="lg:col-span-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-200">
                            <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-8 h-full relative overflow-hidden">

                                {/* أنيميشن النجاح */}
                                <div className={`absolute inset-0 z-10 bg-[#1a1a24] flex flex-col items-center justify-center transition-all duration-500 ${isSuccess ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                                    <div className="w-20 h-20 bg-[#02AFA9]/20 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-10 h-10 text-[#02AFA9]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                                    <p className="text-white/50 text-sm text-center max-w-xs">Thank you for reaching out. I will get back to you as soon as possible.</p>
                                </div>

                                <form onSubmit={handleSendMessage} className={`space-y-6 transition-opacity duration-300 ${isSuccess ? 'opacity-0' : 'opacity-100'}`}>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Your Name</label>
                                            <div className="w-full h-12 bg-[#222231] border border-white/5 rounded-lg px-4 flex items-center text-sm text-white/60 cursor-not-allowed select-none">
                                                {session.user.name}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Your Email</label>
                                            <div className="w-full h-12 bg-[#222231] border border-white/5 rounded-lg px-4 flex items-center text-sm text-white/60 cursor-not-allowed select-none">
                                                {session.user.email}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Subject</label>
                                        <input
                                            type="text"
                                            required
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                            placeholder="What is this regarding?"
                                            className="w-full h-12 bg-[#222231] border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all placeholder:text-white/20"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Message</label>
                                        <textarea
                                            required
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Type your message here..."
                                            rows={5}
                                            className="w-full bg-[#222231] border border-white/10 rounded-lg p-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all resize-none custom-scrollbar placeholder:text-white/20"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !subject || !message}
                                        className="group w-full sm:w-auto inline-flex h-12 items-center justify-center gap-3 px-8 rounded-lg bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(2,175,169,0.25)] transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-[#05bbb5] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>Sending...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Send Message</span>
                                                <svg className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                                </svg>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}