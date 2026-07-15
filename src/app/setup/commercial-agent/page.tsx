"use client";

import PipelineTab from "@/app/setup/commercial-agent/manage/components/PipelineTab";
import ListingsTab from "@/app/setup/commercial-agent/manage/components/ListingsTab";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";

function CommercialAgentSetupForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const propType = searchParams.get("type") || "Commercial Agent";
    const propName = searchParams.get("name") || "Your Real Estate Agency";
    const propAddress = searchParams.get("address") || "";

    // 🏢 منطق الفروع والوكلاء بدلاً من العمارات والشقق
    const [numberOfBranches, setNumberOfBranches] = useState("");
    const [agentsPerBranch, setAgentsPerBranch] = useState("");

    const [isVariableBranches, setIsVariableBranches] = useState(false);
    const [branchAgents, setBranchAgents] = useState<string[]>([]);

    // 📊 نوع الوكالة بدلاً من نوع السنديك
    const [agencyType, setAgencyType] = useState("independent");
    const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
    const agencyDropdownRef = useRef<HTMLDivElement>(null);
    
    // 💰 نسبة العمولة بدلاً من الواجب الشهري
    const [commissionRate, setCommissionRate] = useState("");

    // 🎯 مجالات التخصص بدلاً من المرافق
    const [focusSales, setFocusSales] = useState(false);
    const [focusRentals, setFocusRentals] = useState(false);
    const [focusCommercial, setFocusCommercial] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (agencyDropdownRef.current && !agencyDropdownRef.current.contains(event.target as Node)) {
                setIsAgencyDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getBranchLabel = (index: number) => {
        return index < 26 ? String.fromCharCode(65 + index) : `Branch ${index + 1}`;
    };

    const handleBranchesChange = (val: string) => {
        setNumberOfBranches(val);
        const count = parseInt(val) || 0;

        setBranchAgents(prev => {
            const newArr = [...prev];
            if (count > newArr.length) {
                for (let i = newArr.length; i < count; i++) newArr.push("");
            } else if (count < newArr.length) {
                newArr.length = count;
            }
            return newArr;
        });
    };

    const totalAgents = isVariableBranches
        ? branchAgents.reduce((sum, val) => sum + (parseInt(val) || 0), 0)
        : (parseInt(numberOfBranches) || 0) * (parseInt(agentsPerBranch) || 0);

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const branchesData = isVariableBranches
            ? branchAgents.map((agents, i) => ({ name: `Branch ${getBranchLabel(i)}`, agents: parseInt(agents) || 0 }))
            : Array.from({ length: parseInt(numberOfBranches) || 0 }).map((_, i) => ({ 
                name: `Branch ${getBranchLabel(i)}`, 
                agents: parseInt(agentsPerBranch) || 0 
            }));

        const finalData = {
            property_type: propType,
            name: propName,
            address: propAddress,
            agency_type: agencyType,
            commission_rate: commissionRate ? parseFloat(commissionRate) : 0,
            focus_areas: { sales: focusSales, rentals: focusRentals, commercial: focusCommercial },
            branches: branchesData
        };

        try {
            const res = await fetch("/api/commercial/setup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });

            if (res.ok) {
                const data = await res.json();
                // 🚀 تحويل الوكيل مباشرة إلى لوحة التحكم الخاصة به لبدء العمل على الـ CRM
                router.push(`/setup/commercial-agent/manage?id=${data.property?.id || data.id}`);
            } else {
                const err = await res.json();
                alert(err.message || "Failed to initialize CRM workspace");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("An error occurred while generating the CRM environment.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h1 className="text-[32px] font-medium leading-tight mb-2">Agency Structure</h1>
                <p className="text-[14px] text-white/45">
                    Define the operational blueprint for <strong className="text-white">{propName}</strong>
                </p>
            </div>

            <div className="space-y-5">
                {/* قسم هيكلة الوكالة (الفروع والوكلاء) */}
                <div className="bg-[#1a1a24]/50 border border-[#02AFA9]/20 rounded-lg p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#02AFA9]"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Number of Branches</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={numberOfBranches}
                                onChange={(e) => handleBranchesChange(e.target.value)}
                                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                placeholder="e.g. 1 (Main Office)"
                            />
                        </div>

                        {!isVariableBranches && (
                            <div className="animate-in fade-in duration-300">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Agents per Branch</label>
                                <input
                                    type="number"
                                    required={!isVariableBranches}
                                    min="1"
                                    value={agentsPerBranch}
                                    onChange={(e) => setAgentsPerBranch(e.target.value)}
                                    className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    placeholder="e.g. 5"
                                />
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-2 mt-2 cursor-pointer group w-fit">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isVariableBranches}
                                onChange={(e) => setIsVariableBranches(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-4 h-4 bg-[#222231] border border-white/10 rounded-[3px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors"></div>
                            <svg className="absolute w-2.5 h-2.5 text-white top-0.5 left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-[0.08em] font-medium mt-0.5">
                            Not same number of agents per branch
                        </span>
                    </label>

                    {isVariableBranches && (parseInt(numberOfBranches) > 0) && (
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300 max-h-48 overflow-y-auto pr-2">
                            {branchAgents.map((val, idx) => (
                                <div key={idx}>
                                    <label className="block text-[9px] font-semibold uppercase text-[#02AFA9] mb-1">
                                        Branch {getBranchLabel(idx)}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={val}
                                        onChange={(e) => {
                                            const newArr = [...branchAgents];
                                            newArr[idx] = e.target.value;
                                            setBranchAgents(newArr);
                                        }}
                                        className="w-full h-[36px] bg-[#222231] border border-white/5 rounded-[4px] px-3 text-[13px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all placeholder:text-white/20"
                                        placeholder="Agents"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-3 flex items-center justify-between border-t border-white/5 mt-4">
                        <span className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Total Sales Team</span>
                        <span className="text-xl font-bold text-[#02AFA9]">
                            {totalAgents} <span className="text-[12px] font-normal text-white/40">Agents</span>
                        </span>
                    </div>
                </div>

                {/* قسم إعدادات الوكالة (النوع والعمولة) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Agency Model</label>
                        <div className="relative" ref={agencyDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsAgencyDropdownOpen(!isAgencyDropdownOpen)}
                                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 flex items-center justify-between text-[13px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                            >
                                <span className="truncate pr-2">{agencyType === "independent" ? "Independent Broker" : "Franchise / Corporate"}</span>
                                <svg className={`w-4 h-4 shrink-0 text-white/50 transition-transform duration-200 ${isAgencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isAgencyDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 py-1 bg-[#1a1a24] border border-white/10 rounded-[4px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAgencyType("independent");
                                            setIsAgencyDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-[#02AFA9] hover:bg-[#02AFA9]/10 transition-colors"
                                    >
                                        Independent Broker
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAgencyType("franchise");
                                            setIsAgencyDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-[#02AFA9] hover:bg-[#02AFA9]/10 transition-colors"
                                    >
                                        Franchise / Corporate
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Default Commission (%)</label>
                        <input
                            type="number"
                            step="0.1"
                            min="0"
                            value={commissionRate}
                            onChange={(e) => setCommissionRate(e.target.value)}
                            className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                            placeholder="e.g. 2.5"
                        />
                    </div>
                </div>

                {/* قسم التخصصات (بدل المرافق) */}
                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-3">Core Expertise</label>
                    <div className="bg-[#1a1a24]/50 border border-white/5 rounded-lg p-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={focusSales} onChange={(e) => setFocusSales(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Property Sales (Ventes)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={focusRentals} onChange={(e) => setFocusRentals(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Rentals & Leases (Locations)</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={focusCommercial} onChange={(e) => setFocusCommercial(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Commercial & Industrial</span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="group mt-4 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>{isLoading ? "Generating CRM..." : "Generate & Launch CRM"}</span>
                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1" />}
            </button>
        </form>
    );
}

export default function CommercialAgentSetupPage() {
    return (
        <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16 pb-16">
                <div className="w-full max-w-[580px] bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 md:p-10 shadow-2xl transition-all duration-300">
                    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#02AFA9] border-t-transparent rounded-full animate-spin"></div></div>}>
                        <CommercialAgentSetupForm />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}