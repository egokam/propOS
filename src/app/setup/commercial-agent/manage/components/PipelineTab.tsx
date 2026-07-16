"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// 🌟 الاستدعاء الديناميكي لمنع الانهيار (Hydration Crash)
const ContractGenerator = dynamic(() => import("./ContractGenerator"), { ssr: false });

const STAGES = ["New", "Showing", "Negotiation", "Won"];

export default function PipelineTab({ leads, setLeads, onAddDeal }: { leads: any[], setLeads: any, onAddDeal: () => void }) {

    const [selectedLeadForContract, setSelectedLeadForContract] = useState<any>(null);

    const handleMoveDeal = async (leadId: string, newStage: string) => {
        const previousLeads = [...leads];
        setLeads((prev: any[]) => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));

        try {
            const res = await fetch("/api/commercial/leads", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: leadId, stage: newStage })
            });

            if (!res.ok) throw new Error("Failed to update");
        } catch (error) {
            console.error("Deal update failed, reverting...");
            setLeads(previousLeads);
            alert("Failed to move the deal. Please try again.");
        }
    };

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Deals Pipeline</h2>
                    <p className="text-sm text-white/50">Track and move your clients through the sales funnel.</p>
                </div>
                <button onClick={onAddDeal} className="h-10 px-5 rounded-lg bg-[#02AFA9] text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(2,175,169,0.25)] hover:bg-[#05bbb5] hover:-translate-y-0.5 transition-all cursor-pointer pointer-events-auto">
                    + Add Deal
                </button>
            </div>

            <div className="flex-1 flex lg:grid lg:grid-cols-4 gap-6 overflow-x-auto pb-4 snap-x custom-scrollbar">
                {STAGES.map((stage, index) => {
                    const stageLeads = leads.filter(l => l.stage === stage);
                    const stageTotalValue = stageLeads.reduce((acc, curr) => acc + Number(curr.budget), 0);

                    const stageColor =
                        stage === "New" ? "text-blue-400 border-blue-400/20 bg-blue-400/5" :
                            stage === "Showing" ? "text-amber-400 border-amber-400/20 bg-amber-400/5" :
                                stage === "Negotiation" ? "text-purple-400 border-purple-400/20 bg-purple-400/5" :
                                    "text-emerald-400 border-emerald-400/20 bg-emerald-400/5";

                    return (
                        <div key={stage} className="w-[300px] md:w-[340px] lg:w-auto shrink-0 snap-center flex flex-col bg-[#1a1a24] rounded-2xl border border-white/5 max-h-[75vh]">

                            <div className={`p-4 border-b border-white/5 rounded-t-2xl flex items-center justify-between ${stageColor}`}>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold uppercase tracking-widest">{stage}</span>
                                    <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                                        {stageLeads.length}
                                    </span>
                                </div>
                                <span className="text-xs font-mono font-bold opacity-80">
                                    {(stageTotalValue / 1000).toFixed(0)}k MAD
                                </span>
                            </div>

                            <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar relative z-10">
                                {stageLeads.map(lead => (

                                    <div key={lead.id} className="bg-[#222231] border border-white/5 rounded-xl p-4 hover:border-white/20 transition-all shadow-sm group relative z-20">

                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/5 text-white/50">{lead.preferred_type || "Property"}</span>

                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity relative z-30">
                                                {index > 0 && (
                                                    <button onClick={() => handleMoveDeal(lead.id, STAGES[index - 1])} className="w-5 h-5 rounded bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white cursor-pointer pointer-events-auto">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                                    </button>
                                                )}
                                                {index < STAGES.length - 1 && (
                                                    <button onClick={() => handleMoveDeal(lead.id, STAGES[index + 1])} className="w-5 h-5 rounded bg-white/5 hover:bg-white/20 flex items-center justify-center text-white/50 hover:text-white cursor-pointer pointer-events-auto">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="font-semibold text-white text-sm mb-1">{lead.client_name}</h3>
                                        <p className="text-xs text-white/40 mb-4">{lead.client_phone || lead.client_email}</p>

                                        <div className="pt-3 border-t border-white/5 mt-3 relative z-30">
                                            {stage === "Won" ? (

                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedLeadForContract(lead);
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 bg-[#02AFA9]/10 text-[#02AFA9] hover:bg-[#02AFA9] hover:text-white border border-[#02AFA9]/20 transition-all rounded-md py-2 text-[10px] font-bold uppercase tracking-wider shadow-sm relative z-[99] cursor-pointer pointer-events-auto"
                                                >
                                                    <svg className="w-4 h-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    Generate Contract
                                                </button>
                                            ) : (
                                                <div className="flex items-center justify-between">
                                                    <div className="flex -space-x-2">
                                                        <div className="w-6 h-6 rounded-full bg-[#02AFA9] flex items-center justify-center text-[9px] font-bold border border-[#222231] z-10">
                                                            {lead.client_name.charAt(0).toUpperCase()}
                                                        </div>
                                                    </div>
                                                    <span className="font-mono text-xs font-bold text-[#02AFA9]">
                                                        {Number(lead.budget).toLocaleString()} MAD
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {stageLeads.length === 0 && (
                                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-xs text-white/20 font-medium">
                                        Drop deals here
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedLeadForContract && (
                <ContractGenerator
                    lead={selectedLeadForContract}
                    onClose={() => setSelectedLeadForContract(null)}
                />
            )}
        </div>
    );
}