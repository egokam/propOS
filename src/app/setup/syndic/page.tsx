"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";

function SyndicSetupForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const propType = searchParams.get("type") || "Syndic";
    const propName = searchParams.get("name") || "Your Residence";
    const propAddress = searchParams.get("address") || "";

    const [numberOfBlocks, setNumberOfBlocks] = useState("");
    const [apartmentsPerBlock, setApartmentsPerBlock] = useState("");

    const [isVariableBlocks, setIsVariableBlocks] = useState(false);
    const [blockApts, setBlockApts] = useState<string[]>([]);

    const [syndicType, setSyndicType] = useState("volunteer");
    const [isSyndicDropdownOpen, setIsSyndicDropdownOpen] = useState(false);
    const syndicDropdownRef = useRef<HTMLDivElement>(null);
    const [monthlyFee, setMonthlyFee] = useState("");

    const [hasElevator, setHasElevator] = useState(false);
    const [hasParking, setHasParking] = useState(false);
    const [hasSecurity, setHasSecurity] = useState(false);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (syndicDropdownRef.current && !syndicDropdownRef.current.contains(event.target as Node)) {
                setIsSyndicDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const getBlockLabel = (index: number) => {
        return index < 26 ? String.fromCharCode(65 + index) : `Block ${index + 1}`;
    };

    const handleBlocksChange = (val: string) => {
        setNumberOfBlocks(val);
        const count = parseInt(val) || 0;

        setBlockApts(prev => {
            const newArr = [...prev];
            if (count > newArr.length) {
                for (let i = newArr.length; i < count; i++) newArr.push("");
            } else if (count < newArr.length) {
                newArr.length = count;
            }
            return newArr;
        });
    };

    const totalApartments = isVariableBlocks
        ? blockApts.reduce((sum, val) => sum + (parseInt(val) || 0), 0)
        : (parseInt(numberOfBlocks) || 0) * (parseInt(apartmentsPerBlock) || 0);

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const blocksData = isVariableBlocks
            ? blockApts.map((apts, i) => ({ name: `Block ${getBlockLabel(i)}`, apts: parseInt(apts) || 0 }))
            : Array.from({ length: parseInt(numberOfBlocks) || 0 }).map((_, i) => ({ 
                name: `Block ${getBlockLabel(i)}`, 
                apts: parseInt(apartmentsPerBlock) || 0 
            }));

        const finalData = {
            property_type: propType,
            name: propName,
            address: propAddress,
            syndic_type: syndicType,
            monthly_fee: monthlyFee ? parseFloat(monthlyFee) : 0,
            amenities: { elevator: hasElevator, parking: hasParking, security: hasSecurity },
            blocks: blocksData
        };

        try {
            const res = await fetch("/api/properties", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });

            if (res.ok) {
                router.push("/dashboard");
            } else {
                const err = await res.json();
                alert(err.message || "Failed to save property");
            }
        } catch (error) {
            console.error("Save error:", error);
            alert("An error occurred while saving.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
                <h1 className="text-[32px] font-medium leading-tight mb-2">Residence Structure</h1>
                <p className="text-[14px] text-white/45">
                    Define the blueprint for <strong className="text-white">{propName}</strong>
                </p>
            </div>

            <div className="space-y-5">
                <div className="bg-[#1a1a24]/50 border border-[#02AFA9]/20 rounded-lg p-5 space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#02AFA9]"></div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Number of Blocks</label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={numberOfBlocks}
                                onChange={(e) => handleBlocksChange(e.target.value)}
                                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                placeholder="e.g. 3"
                            />
                        </div>

                        {!isVariableBlocks && (
                            <div className="animate-in fade-in duration-300">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Apts per Block</label>
                                <input
                                    type="number"
                                    required={!isVariableBlocks}
                                    min="1"
                                    value={apartmentsPerBlock}
                                    onChange={(e) => setApartmentsPerBlock(e.target.value)}
                                    className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    placeholder="e.g. 10"
                                />
                            </div>
                        )}
                    </div>

                    <label className="flex items-center gap-2 mt-2 cursor-pointer group w-fit">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                checked={isVariableBlocks}
                                onChange={(e) => setIsVariableBlocks(e.target.checked)}
                                className="peer sr-only"
                            />
                            <div className="w-4 h-4 bg-[#222231] border border-white/10 rounded-[3px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors"></div>
                            <svg className="absolute w-2.5 h-2.5 text-white top-0.5 left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[11px] text-white/50 group-hover:text-white/80 transition-colors uppercase tracking-[0.08em] font-medium mt-0.5">
                            Not same number of apts per block
                        </span>
                    </label>

                    {isVariableBlocks && (parseInt(numberOfBlocks) > 0) && (
                        <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-top-2 duration-300 max-h-48 overflow-y-auto pr-2">
                            {blockApts.map((val, idx) => (
                                <div key={idx}>
                                    <label className="block text-[9px] font-semibold uppercase text-[#02AFA9] mb-1">
                                        Block {getBlockLabel(idx)}
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        value={val}
                                        onChange={(e) => {
                                            const newArr = [...blockApts];
                                            newArr[idx] = e.target.value;
                                            setBlockApts(newArr);
                                        }}
                                        className="w-full h-[36px] bg-[#222231] border border-white/5 rounded-[4px] px-3 text-[13px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all placeholder:text-white/20"
                                        placeholder="Apts"
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-3 flex items-center justify-between border-t border-white/5 mt-4">
                        <span className="text-[12px] font-medium text-white/50 uppercase tracking-wider">Total Apartments</span>
                        <span className="text-xl font-bold text-[#02AFA9]">
                            {totalApartments} <span className="text-[12px] font-normal text-white/40">Units</span>
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Management Type</label>
                        <div className="relative" ref={syndicDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsSyndicDropdownOpen(!isSyndicDropdownOpen)}
                                className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 flex items-center justify-between text-[13px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                            >
                                <span className="truncate pr-2">{syndicType === "volunteer" ? "Volunteer (Copropriétaire)" : "Professional Agency"}</span>
                                <svg className={`w-4 h-4 shrink-0 text-white/50 transition-transform duration-200 ${isSyndicDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {isSyndicDropdownOpen && (
                                <div className="absolute z-50 w-full mt-1 py-1 bg-[#1a1a24] border border-white/10 rounded-[4px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSyndicType("volunteer");
                                            setIsSyndicDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-[#02AFA9] hover:bg-[#02AFA9]/10 transition-colors"
                                    >
                                        Volunteer (Copropriétaire)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSyndicType("professional");
                                            setIsSyndicDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2.5 text-[13px] text-white/70 hover:text-[#02AFA9] hover:bg-[#02AFA9]/10 transition-colors"
                                    >
                                        Professional Agency
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Monthly Fee / Unit (DH)</label>
                        <input
                            type="number"
                            min="0"
                            value={monthlyFee}
                            onChange={(e) => setMonthlyFee(e.target.value)}
                            className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                            placeholder="e.g. 150"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-3">Amenities Included</label>
                    <div className="bg-[#1a1a24]/50 border border-white/5 rounded-lg p-4 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={hasElevator} onChange={(e) => setHasElevator(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Elevator(s) available</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Underground / Private Parking</span>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input type="checkbox" checked={hasSecurity} onChange={(e) => setHasSecurity(e.target.checked)} className="peer sr-only" />
                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <span className="text-[13px] text-white/70 select-none group-hover:text-white transition-colors">Concierge / Security Guard</span>
                        </label>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className="group mt-4 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>{isLoading ? "Generating Structure..." : "Generate & Finish"}</span>
                {!isLoading && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1" />}
            </button>
        </form>
    );
}

export default function SyndicSetupPage() {
    return (
        <div className="relative min-h-dvh overflow-hidden bg-[#222231] text-white flex flex-col">
            <Header />
            <main className="flex-1 flex items-center justify-center relative z-20 px-6 mt-16 pb-16">
                <div className="w-full max-w-[580px] bg-[#2a2a3c]/40 backdrop-blur-md border border-white/5 rounded-lg p-8 md:p-10 shadow-2xl transition-all duration-300">
                    <Suspense fallback={<div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#02AFA9] border-t-transparent rounded-full animate-spin"></div></div>}>
                        <SyndicSetupForm />
                    </Suspense>
                </div>
            </main>
            <Footer />
        </div>
    );
}