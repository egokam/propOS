"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

// 🧩 استدعاء المكونات الذكية
import OverviewTab from "./components/OverviewTab";
import LeadsTab from "./components/LeadsTab";
import PipelineTab from "./components/PipelineTab";
import ListingsTab from "./components/ListingsTab";
import LiveChatWidget from "./components/LiveChatWidget";

type TabType = "overview" | "listings" | "leads" | "pipeline";

function CommercialAgentDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const propertyId = searchParams.get("id");

    const { data: session, isPending } = authClient.useSession();
    const [activeTab, setActiveTab] = useState<TabType>("listings");

    const [showTutorial, setShowTutorial] = useState(false);

    // 🌟 جلب العملاء (Leads) الحقيقيين من قاعدة البيانات بدلاً من البيانات الوهمية
    const [leads, setLeads] = useState<any[]>([]);
    const [isLeadsLoading, setIsLeadsLoading] = useState(true);

    useEffect(() => {
        const fetchLeads = async () => {
            if (!propertyId) return;
            try {
                const res = await fetch(`/api/commercial/leads?propertyId=${propertyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setLeads(data.leads);
                }
            } catch (error) {
                console.error("Failed to fetch leads");
            } finally {
                setIsLeadsLoading(false);
            }
        };
        fetchLeads();
    }, [propertyId]);

    useEffect(() => {
        if (!isPending && !session) router.push("/login");
    }, [session, isPending, router]);

    useEffect(() => {
        const tourDone = localStorage.getItem('propOs_agent_tour');
        if (!tourDone && session) {
            setTimeout(() => setShowTutorial(true), 500);
        }
    }, [session]);

    const handleCompleteTour = () => {
        localStorage.setItem('propOs_agent_tour', 'true');
        setShowTutorial(false);
    };

    if (isPending) return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading CRM Shell...</div>;
    if (!session) return null;

    const userInitials = session.user.name ? session.user.name.charAt(0).toUpperCase() : "A";

    // 🔄 محرك التبديل بين الشاشات (الآن يتم تمرير الـ Props بشكل صحيح وبدون أخطاء TypeScript)
    const renderTabContent = () => {
        switch (activeTab) {
            case "pipeline": return <PipelineTab leads={leads} setLeads={setLeads} onAddDeal={() => setActiveTab("leads")} />;
            case "listings": return <ListingsTab propertyId={propertyId} />;
            case "overview": return <OverviewTab propertyId={propertyId} />; 
            case "leads": return <LeadsTab propertyId={propertyId} leads={leads} setLeads={setLeads} isLoading={isLeadsLoading} />; // 👈 تم الحل
            default: return null;
        }
    };

    return (
        <div className="min-h-dvh bg-[#222231] text-white flex relative overflow-hidden text-sm md:text-base">
            
            {showTutorial && <TutorialOverlay onComplete={handleCompleteTour} />}

            {/* Sidebar */}
            <aside id="tour-sidebar" className="w-64 bg-[#1a1a24] border-r border-white/5 hidden lg:flex flex-col z-10 shrink-0">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span> <span className="text-[10px] text-[#02AFA9] bg-[#02AFA9]/10 px-1.5 py-0.5 rounded font-mono ml-1">CRM</span>
                    </span>
                </div>
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    <div className="pt-4 pb-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-white/30 px-3">Workspace</p>
                    </div>
                    {(["overview", "listings", "leads", "pipeline"] as TabType[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all capitalize ${activeTab === tab ? "bg-[#02AFA9]/10 text-[#02AFA9]" : "text-white/50 hover:text-white hover:bg-white/5"}`}
                        >
                            {tab === "pipeline" ? "Deals Pipeline" : tab}
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 flex flex-col min-h-dvh overflow-x-hidden relative z-10">
                <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#222231]/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="lg:hidden text-base font-bold tracking-wider mr-2">Prop<span className="text-[#02AFA9]">OS</span></span>
                        <h1 className="text-xs md:text-sm font-medium text-white/60 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">Commercial Agent</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{session.user.name}</p>
                            <p className="text-xs text-white/40">{session.user.email}</p>
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-sm shadow-md overflow-hidden cursor-pointer">
                            {session.user.image ? <img src={session.user.image} alt="User" className="w-full h-full object-cover" /> : userInitials}
                        </div>
                    </div>
                </header>

                <div className="lg:hidden bg-[#1a1a24] border-b border-white/5 p-2 flex gap-1 overflow-x-auto shrink-0 custom-scrollbar">
                    {(["overview", "listings", "leads", "pipeline"] as TabType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveTab(t)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === t ? "bg-[#02AFA9] text-white" : "text-white/40"}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] w-full mx-auto animate-in fade-in duration-500 flex flex-col">
                    {renderTabContent()}
                </div>
            </main>

            {/* 💬 واجهة المحادثة المباشرة (العائمة) */}
            {propertyId && <LiveChatWidget propertyId={propertyId} agentName={session.user.name || "Agent"} />}
        </div>
    );
}

// 🌟 محرك الجولة التعليمية الفخم 🌟
function TutorialOverlay({ onComplete }: { onComplete: () => void }) {
    const [step, setStep] = useState(0);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    const steps = [
        { id: "tour-sidebar", title: "Navigation Hub", desc: "Switch between your listings, leads database, and deals pipeline here." },
        { id: "tour-new-listing", title: "Add Inventory", desc: "Click here to add new properties. Upload multiple images, set pricing, and add keywords for search." },
        { id: "tour-filter", title: "Smart Filters", desc: "Quickly sort your portfolio. Combine this with the search bar to find exactly what you need." }
    ];

    useEffect(() => {
        const updateRect = () => {
            const el = document.getElementById(steps[step].id);
            if (el) setTargetRect(el.getBoundingClientRect());
        };
        updateRect();
        window.addEventListener('resize', updateRect);
        const interval = setInterval(updateRect, 500); 
        return () => {
            window.removeEventListener('resize', updateRect);
            clearInterval(interval);
        };
    }, [step]);

    if (!targetRect) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-auto">
            <div
                className="absolute border-2 border-[#02AFA9] rounded-lg transition-all duration-500 ease-out pointer-events-none"
                style={{
                    top: targetRect.top - 8, left: targetRect.left - 8,
                    width: targetRect.width + 16, height: targetRect.height + 16,
                    boxShadow: '0 0 0 9999px rgba(0,0,0,0.85)'
                }}
            >
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce text-[#02AFA9]">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                </div>
            </div>

            <div
                className="absolute z-50 bg-[#2a2a3c] border border-[#02AFA9]/30 rounded-xl p-5 shadow-2xl transition-all duration-500 w-80"
                style={{
                    top: Math.min(targetRect.bottom + 20, window.innerHeight - 250),
                    left: Math.max(20, Math.min(targetRect.left, window.innerWidth - 340)) 
                }}
            >
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold uppercase text-[#02AFA9] bg-[#02AFA9]/10 px-2 py-1 rounded">Step {step + 1} of {steps.length}</span>
                    <button onClick={onComplete} className="text-xs text-white/40 hover:text-white transition-colors">Skip Tour</button>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{steps[step].title}</h3>
                <p className="text-sm text-white/60 mb-6 leading-relaxed">{steps[step].desc}</p>

                <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                        {steps.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-[#02AFA9] w-4' : 'bg-white/20'}`} />
                        ))}
                    </div>
                    <button
                        onClick={() => step < steps.length - 1 ? setStep(step + 1) : onComplete()}
                        className="bg-[#02AFA9] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded hover:bg-[#05bbb5] transition-colors shadow-[0_4px_14px_rgba(2,175,169,0.25)]"
                    >
                        {step < steps.length - 1 ? "Next Step" : "Finish Tour"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CommercialAgentManagePage() {
    return <Suspense fallback={<div className="min-h-dvh bg-[#222231]" />}><CommercialAgentDashboard /></Suspense>;
}