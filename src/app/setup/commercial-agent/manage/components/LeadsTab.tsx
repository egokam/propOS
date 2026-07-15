"use client";

import { useState } from "react";

export default function LeadsTab({ propertyId, leads, setLeads, isLoading }: { propertyId: string | null, leads: any[], setLeads: any, isLoading: boolean }) {
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // نموذج بيانات العميل الجديد
    const [formData, setFormData] = useState({
        client_name: "", client_email: "", client_phone: "", budget: "", preferred_type: "Apartment", stage: "New"
    });

    const handleAddLead = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/commercial/leads", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    ...formData,
                    budget: parseFloat(formData.budget)
                })
            });

            if (res.ok) {
                const data = await res.json();
                // تحديث الواجهة والـ Pipeline فوراً
                setLeads([data.lead, ...leads]);
                setIsModalOpen(false);
                setFormData({ client_name: "", client_email: "", client_phone: "", budget: "", preferred_type: "Apartment", stage: "New" });
            }
        } catch (error) {
            console.error("Error adding lead:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredLeads = leads.filter(l => 
        l.client_name?.toLowerCase().includes(search.toLowerCase()) || 
        l.client_email?.toLowerCase().includes(search.toLowerCase()) ||
        l.preferred_type?.toLowerCase().includes(search.toLowerCase())
    );

    if (isLoading) return <div className="h-full flex items-center justify-center text-[#02AFA9]">Loading leads database...</div>;

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Leads Database</h2>
                    <p className="text-sm text-white/50">Manage your contacts, buyers, and tenants.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="h-10 px-5 rounded-lg bg-[#02AFA9] text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_rgba(2,175,169,0.25)] hover:bg-[#05bbb5] hover:-translate-y-0.5 transition-all">
                    + Add New Lead
                </button>
            </div>

            <div className="bg-[#1a1a24] border border-white/5 rounded-2xl flex flex-col flex-1 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-white/5 bg-white/[0.01]">
                    <div className="relative max-w-md">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input
                            type="text"
                            placeholder="Search leads by name, email, or property type..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full h-10 bg-[#222231] border border-white/10 rounded-lg pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-[#14141d] text-white/40 text-[10px] uppercase tracking-widest sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Client Info</th>
                                <th className="px-6 py-4 font-semibold">Contact</th>
                                <th className="px-6 py-4 font-semibold">Target Property</th>
                                <th className="px-6 py-4 font-semibold">Max Budget</th>
                                <th className="px-6 py-4 font-semibold">Pipeline Stage</th>
                                <th className="px-6 py-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLeads.map((lead) => (
                                <tr key={lead.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#02AFA9]/10 flex items-center justify-center text-xs font-bold text-[#02AFA9]">
                                                {lead.client_name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-white group-hover:text-[#02AFA9] transition-colors">{lead.client_name}</p>
                                                <p className="text-[10px] text-white/30 uppercase tracking-wider">{new Date(lead.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-white/70">
                                        <p className="font-mono text-xs">{lead.client_phone || "—"}</p>
                                        <p className="text-xs">{lead.client_email || "—"}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2.5 py-1 rounded bg-white/5 text-xs text-white/70 border border-white/5">
                                            {lead.preferred_type || "Any"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-[#02AFA9]">
                                        ${Number(lead.budget).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded border text-[10px] font-bold uppercase tracking-wider ${
                                            lead.stage === 'New' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                            lead.stage === 'Showing' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            lead.stage === 'Negotiation' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                            'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                        }`}>
                                            {lead.stage}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 rounded bg-white/5 hover:bg-[#02AFA9] hover:text-white transition-colors text-white/50">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLeads.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-white/40">
                                        No leads found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 🌟 نافذة إضافة عميل جديد */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[450px] bg-[#2a2a3c] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        <h2 className="text-xl font-semibold mb-6">Add New Lead</h2>
                        
                        <form onSubmit={handleAddLead} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Client Name</label>
                                <input type="text" required value={formData.client_name} onChange={(e) => setFormData({...formData, client_name: e.target.value})} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Phone</label>
                                    <input type="text" value={formData.client_phone} onChange={(e) => setFormData({...formData, client_phone: e.target.value})} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Email</label>
                                    <input type="email" value={formData.client_email} onChange={(e) => setFormData({...formData, client_email: e.target.value})} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Budget ($)</label>
                                    <input type="number" required min="0" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Target Property</label>
                                    <input type="text" placeholder="e.g. Villa" value={formData.preferred_type} onChange={(e) => setFormData({...formData, preferred_type: e.target.value})} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                                </div>
                            </div>
                            <button type="submit" disabled={isSubmitting} className="w-full mt-4 h-11 rounded-lg bg-[#02AFA9] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">
                                {isSubmitting ? "Adding..." : "Save Lead"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}