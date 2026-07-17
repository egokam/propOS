"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

function ManageSyndicContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const propertyId = searchParams.get("id");

    const { data: session, isPending } = authClient.useSession();
    const [activeTab, setActiveTab] = useState("apartments");
    const [searchQuery, setSearchQuery] = useState("");

    const [property, setProperty] = useState<any>(null);
    const [apartments, setApartments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingApt, setEditingApt] = useState<any>(null);
    const [editForm, setEditForm] = useState({ owner_name: "", phone: "", email: "", floor: "" });
    const [isSavingApt, setIsSavingApt] = useState(false);

    const [selectedOwner, setSelectedOwner] = useState<any>(null);
    const [selectedAptsToAssign, setSelectedAptsToAssign] = useState<string[]>([]);
    const [isAssigning, setIsAssigning] = useState(false);

    const [manualOwners, setManualOwners] = useState<any[]>([]);
    const [isAddingOwner, setIsAddingOwner] = useState(false);
    const [newOwnerForm, setNewOwnerForm] = useState({ owner_name: "", phone: "", email: "" });

    const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
            return;
        }

        if (propertyId && session) {
            fetchPropertyData();
        }
    }, [propertyId, session, isPending, router]);

    const fetchPropertyData = async () => {
        try {
            const res = await fetch(`/api/manage?id=${propertyId}`);
            if (res.ok) {
                const data = await res.json();
                setProperty(data.property);
                setApartments(data.apartments);
            }
        } catch (error) {
        } finally {
            setIsLoading(false);
        }
    };

    const toggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "Available" ? "Occupied" : "Available";
        setApartments(prev => prev.map(apt => apt.id === id ? { ...apt, status: newStatus } : apt));

        try {
            await fetch(`/api/manage`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "toggle_status", id, status: newStatus })
            });
        } catch (error) {
            setApartments(prev => prev.map(apt => apt.id === id ? { ...apt, status: currentStatus } : apt));
        }
    };

    const toggleOwnerPayment = async (ownerName: string, currentStatus: boolean, totalDue: number) => {
        const newStatus = !currentStatus;
        
        setApartments(prev => prev.map(apt => 
            apt.owner_name === ownerName ? { ...apt, is_paid: newStatus } : apt
        ));

        try {
            const res = await fetch(`/api/manage`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    action: "toggle_owner_payment", 
                    property_id: propertyId,
                    owner_name: ownerName, 
                    is_paid: newStatus, 
                    month: currentMonthLabel,
                    total_amount: totalDue
                })
            });

            if (!res.ok) throw new Error("Failed");
        } catch (error) {
            setApartments(prev => prev.map(apt => 
                apt.owner_name === ownerName ? { ...apt, is_paid: currentStatus } : apt
            ));
            alert("Failed to update payment status.");
        }
    };

    const handleFeeUpdate = async (newFee: number) => {
        setProperty((prev: any) => ({ ...prev, monthly_fee: newFee }));
        try {
            await fetch(`/api/manage`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_fee", id: property.id, monthly_fee: newFee })
            });
        } catch (error) {
        }
    };

    const openEditModal = (apt: any) => {
        setEditingApt(apt);
        setEditForm({
            owner_name: apt.owner_name || "",
            phone: apt.phone || "",
            email: apt.email || "",
            floor: apt.floor || ""
        });
    };

    const handleUpdateApartment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingApt(true);
        try {
            await fetch(`/api/manage`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_details", id: editingApt.id, ...editForm })
            });
            setApartments(prev => prev.map(apt => apt.id === editingApt.id ? { ...apt, ...editForm } : apt));
            setEditingApt(null);
        } catch (error) {
            alert("Failed to update apartment details");
        } finally {
            setIsSavingApt(false);
        }
    };

    const handleAddNewOwner = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOwnerForm.owner_name.trim()) return;
        setManualOwners(prev => [...prev, newOwnerForm]);
        setIsAddingOwner(false);
        setNewOwnerForm({ owner_name: "", phone: "", email: "" });
    };

    const handleAssignApartment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedAptsToAssign.length === 0 || !selectedOwner) return;
        setIsAssigning(true);
        try {
            await Promise.all(selectedAptsToAssign.map(async (aptId) => {
                const floor = apartments.find(a => a.id === aptId)?.floor || "";
                await fetch(`/api/manage`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ 
                        action: "update_details", 
                        id: aptId, 
                        owner_name: selectedOwner.owner_name,
                        phone: selectedOwner.phone || "",
                        email: selectedOwner.email || "",
                        floor: floor
                    })
                });
            }));
            
            setApartments(prev => prev.map(apt => selectedAptsToAssign.includes(apt.id) ? { 
                ...apt, 
                owner_name: selectedOwner.owner_name, 
                phone: selectedOwner.phone || "", 
                email: selectedOwner.email || "" 
            } : apt));
            
            setManualOwners(prev => prev.filter(mo => mo.owner_name !== selectedOwner.owner_name));
            setSelectedAptsToAssign([]);
            setSelectedOwner(null);
        } catch (error) {
            alert("Failed to assign apartments");
        } finally {
            setIsAssigning(false);
        }
    };

    const toggleAptSelection = (aptId: string) => {
        setSelectedAptsToAssign(prev => 
            prev.includes(aptId) ? prev.filter(id => id !== aptId) : [...prev, aptId]
        );
    };

    const filteredApartments = apartments.filter(apt =>
        apt.apartment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.block_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (apt.owner_name && apt.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const groupedOwners = apartments.reduce((acc, apt) => {
        if (!apt.owner_name) return acc;
        if (!acc[apt.owner_name]) {
            acc[apt.owner_name] = {
                owner_name: apt.owner_name,
                phone: apt.phone,
                email: apt.email,
                owned_units: [],
                aptIds: [],
                allPaid: true
            };
        }
        acc[apt.owner_name].owned_units.push(`${apt.block_name} - Apt ${apt.apartment_number}`);
        acc[apt.owner_name].aptIds.push(apt.id);
        if (!apt.is_paid) acc[apt.owner_name].allPaid = false;
        return acc;
    }, {} as Record<string, any>);

    const existingOwnersArray = Object.values(groupedOwners);
    const allOwnersArray = [...existingOwnersArray];

    manualOwners.forEach(mo => {
        if (!allOwnersArray.find((eo: any) => eo.owner_name === mo.owner_name)) {
            allOwnersArray.push({ ...mo, owned_units: [], aptIds: [], allPaid: true });
        }
    });

    const aptsByBlock = apartments.filter(a => a.owner_name !== selectedOwner?.owner_name).reduce((acc, apt) => {
        if (!acc[apt.block_name]) acc[apt.block_name] = [];
        acc[apt.block_name].push(apt);
        return acc;
    }, {} as Record<string, any[]>);

    if (isPending || isLoading) {
        return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading...</div>;
    }

    if (!property) {
        return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-white">Property not found</div>;
    }

    return (
        <div className="min-h-dvh bg-[#222231] text-white flex relative">
            <aside className="w-64 bg-[#1a1a24] border-r border-white/5 hidden md:flex flex-col z-10">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Back to Dashboard
                    </Link>
                </nav>
            </aside>

            <main className="flex-1 flex flex-col min-h-dvh overflow-y-auto z-10 relative">
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#222231]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="md:hidden text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </div>
                    <div className="hidden md:block text-sm text-white/50">
                        Managing: <span className="text-white font-medium">{property.name}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{session?.user?.name}</p>
                            <p className="text-xs text-white/40">{session?.user?.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-[#222231]">
                            {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                    </div>
                </header>

                <div className="p-8 max-w-6xl mx-auto w-full">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold mb-2">{property.name}</h1>
                        <p className="text-white/50 text-sm flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            {property.address}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">Total Apartments</p>
                            <p className="text-2xl font-bold text-white">{apartments.length}</p>
                        </div>
                        <div className="bg-[#1a1a24] border border-[#02AFA9]/20 rounded-xl p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#02AFA9] mb-1">Available for Rent</p>
                            <p className="text-2xl font-bold text-white">{apartments.filter(a => a.status === "Available").length}</p>
                        </div>
                        <div className="bg-[#1a1a24] border border-white/5 rounded-xl p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-1">Occupied</p>
                            <p className="text-2xl font-bold text-white">{apartments.filter(a => a.status === "Occupied").length}</p>
                        </div>
                    </div>

                    <div className="flex gap-6 border-b border-white/5 mb-6">
                        <button onClick={() => setActiveTab('apartments')} className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'apartments' ? 'text-[#02AFA9] border-b-2 border-[#02AFA9]' : 'text-white/50 hover:text-white'}`}>Apartments</button>
                        <button onClick={() => setActiveTab('owners')} className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'owners' ? 'text-[#02AFA9] border-b-2 border-[#02AFA9]' : 'text-white/50 hover:text-white'}`}>Owners Directory</button>
                        <button onClick={() => setActiveTab('payments')} className={`pb-3 text-sm font-medium transition-colors ${activeTab === 'payments' ? 'text-[#02AFA9] border-b-2 border-[#02AFA9]' : 'text-white/50 hover:text-white'}`}>Payments</button>
                    </div>

                    {activeTab === 'apartments' && (
                        <div className="space-y-4">
                            <div className="relative w-full max-w-md">
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <input
                                    type="text"
                                    placeholder="Search by Apt, Block, or Owner..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                />
                            </div>

                            <div className="bg-[#1a1a24] border border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white/5 text-white/50 text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Block</th>
                                            <th className="px-6 py-4 font-medium">Apt No.</th>
                                            <th className="px-6 py-4 font-medium">Owner</th>
                                            <th className="px-6 py-4 font-medium">Contact</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredApartments.map(apt => (
                                            <tr key={apt.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4 text-white/70">{apt.block_name}</td>
                                                <td className="px-6 py-4 font-medium text-white">{apt.apartment_number}</td>
                                                <td className="px-6 py-4 text-white/70">{apt.owner_name || "—"}</td>
                                                <td className="px-6 py-4 text-white/70">{apt.phone || apt.email || "—"}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${apt.status === 'Available' ? 'bg-[#02AFA9]/10 text-[#02AFA9]' : 'bg-white/10 text-white/50'}`}>
                                                        {apt.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => openEditModal(apt)}
                                                        className="text-[11px] font-medium text-white/70 hover:text-white transition-colors bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md ml-2"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => toggleStatus(apt.id, apt.status)}
                                                        className="text-[11px] font-medium text-[#02AFA9] hover:text-white transition-colors bg-[#02AFA9]/10 hover:bg-[#02AFA9] px-3 py-1.5 rounded-md"
                                                    >
                                                        Toggle Status
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredApartments.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-8 text-center text-white/40">No apartments found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'owners' && (
                        <div className="space-y-6">
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setIsAddingOwner(true)} 
                                    className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-[#02AFA9]/10 text-[#02AFA9] text-xs font-semibold uppercase tracking-wider hover:bg-[#02AFA9] hover:text-white transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                    Add New Owner
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allOwnersArray.length > 0 ? allOwnersArray.map((owner: any, idx) => {
                                    const isPending = owner.owned_units.length === 0;
                                    return (
                                        <div 
                                            key={idx} 
                                            onClick={() => { setSelectedOwner(owner); setSelectedAptsToAssign([]); }}
                                            className={`border rounded-xl p-5 flex flex-col gap-4 cursor-pointer transition-all group ${isPending ? 'bg-[#1a1a24]/40 border-white/5 border-dashed opacity-60 hover:opacity-100' : 'bg-[#1a1a24] border-white/5 hover:border-[#02AFA9]/50 hover:bg-white/[0.02]'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${isPending ? 'bg-white/5 text-white/50' : 'bg-white/5 text-[#02AFA9]'}`}>
                                                    {owner.owner_name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={`font-medium transition-colors ${isPending ? 'text-white/70' : 'text-white group-hover:text-[#02AFA9]'}`}>{owner.owner_name}</p>
                                                    <p className="text-xs text-white/40">{owner.phone || "No phone provided"}</p>
                                                </div>
                                            </div>
                                            <div className="border-t border-white/5 pt-3">
                                                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30 mb-2">Owned Properties</p>
                                                {isPending ? (
                                                    <p className="text-xs text-[#FF5E5F]/80 font-medium">No properties assigned yet</p>
                                                ) : (
                                                    <div className="flex flex-wrap gap-2">
                                                        {owner.owned_units.map((unit: string, i: number) => (
                                                            <span key={i} className="bg-[#02AFA9]/10 text-[#02AFA9] text-xs font-medium px-3 py-1.5 rounded-md border border-[#02AFA9]/20">
                                                                {unit}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                }) : (
                                    <div className="col-span-full py-12 text-center text-white/40 bg-[#1a1a24] rounded-xl border border-white/5">
                                        No owners registered yet.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#1a1a24] p-5 rounded-xl border border-white/5 gap-4">
                                <div>
                                    <h3 className="text-lg font-medium text-white">{currentMonthLabel}</h3>
                                    <p className="text-sm text-white/40">Monthly Syndic Collection</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50">Monthly Fee / Unit</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={property.monthly_fee || 0}
                                            onChange={(e) => setProperty({ ...property, monthly_fee: parseFloat(e.target.value) || 0 })}
                                            onBlur={(e) => handleFeeUpdate(parseFloat(e.target.value) || 0)}
                                            className="w-20 h-10 bg-[#222231] border border-white/10 rounded-md px-2 py-1 text-right text-lg font-bold text-[#02AFA9] focus:outline-none focus:border-[#02AFA9] transition-all"
                                        />
                                        <span className="text-lg font-bold text-[#02AFA9]">DH</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1a1a24] border border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-white/5 text-white/50 text-[11px] uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">Owner</th>
                                            <th className="px-6 py-4 font-medium">Owned Units</th>
                                            <th className="px-6 py-4 font-medium">Total Due</th>
                                            <th className="px-6 py-4 font-medium">Status</th>
                                            <th className="px-6 py-4 font-medium text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {existingOwnersArray.map((owner: any, idx: number) => {
                                            const totalDue = owner.owned_units.length * (property.monthly_fee || 0);
                                            return (
                                                <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="px-6 py-4 font-medium text-white">{owner.owner_name}</td>
                                                    <td className="px-6 py-4 text-white/70">
                                                        <div className="flex flex-wrap gap-1">
                                                            {owner.owned_units.map((u: string, i: number) => (
                                                                <span key={i} className="bg-white/5 border border-white/10 text-[11px] px-2 py-0.5 rounded">{u}</span>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-white/70 font-medium">{totalDue} DH</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wider ${owner.allPaid ? 'bg-[#02AFA9]/10 text-[#02AFA9]' : 'bg-[#FF5E5F]/10 text-[#FF5E5F]'}`}>
                                                            {owner.allPaid ? 'Paid' : 'Pending'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <label className="flex items-center justify-end gap-2 cursor-pointer group">
                                                            <span className="text-[11px] font-medium text-white/50 group-hover:text-white transition-colors">
                                                                {owner.allPaid ? 'Mark Unpaid' : 'Mark Paid'}
                                                            </span>
                                                            <div className="relative flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={owner.allPaid}
                                                                    onChange={() => toggleOwnerPayment(owner.owner_name, owner.allPaid, totalDue)}
                                                                    className="peer sr-only"
                                                                />
                                                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded-[4px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors group-hover:border-[#02AFA9]/50"></div>
                                                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                        </label>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {existingOwnersArray.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-8 text-center text-white/40">No owners found to collect payments from.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isAddingOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[400px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setIsAddingOwner(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-medium mb-6">Add New Owner</h2>

                        <form onSubmit={handleAddNewOwner} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={newOwnerForm.owner_name}
                                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, owner_name: e.target.value })}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                    placeholder="e.g. Youssef Alaoui"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Phone Number</label>
                                <input
                                    type="text"
                                    value={newOwnerForm.phone}
                                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, phone: e.target.value })}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                    placeholder="e.g. 06 00 00 00 00"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={newOwnerForm.email}
                                    onChange={(e) => setNewOwnerForm({ ...newOwnerForm, email: e.target.value })}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                    placeholder="owner@email.com"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full mt-2 h-10 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors"
                            >
                                Add Owner
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {editingApt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[500px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => setEditingApt(null)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-medium mb-1">Edit Apartment {editingApt.apartment_number}</h2>
                        <p className="text-sm text-white/50 mb-6">{editingApt.block_name}</p>

                        <form onSubmit={handleUpdateApartment} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Owner Name</label>
                                <input
                                    type="text"
                                    value={editForm.owner_name}
                                    onChange={(e) => setEditForm({ ...editForm, owner_name: e.target.value })}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                    placeholder="e.g. Ahmed Benali"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Phone Number</label>
                                    <input
                                        type="text"
                                        value={editForm.phone}
                                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                        className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                        placeholder="e.g. 06 00 00 00 00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Email (Optional)</label>
                                    <input
                                        type="email"
                                        value={editForm.email}
                                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                        className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                        placeholder="owner@email.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Floor (Optional)</label>
                                <input
                                    type="text"
                                    value={editForm.floor}
                                    onChange={(e) => setEditForm({ ...editForm, floor: e.target.value })}
                                    className="w-full h-10 bg-[#1a1a24] border border-white/5 rounded-md px-3 text-sm text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                                    placeholder="e.g. 3rd Floor"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isSavingApt}
                                className="w-full mt-4 h-10 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50"
                            >
                                {isSavingApt ? "Saving..." : "Save Details"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {selectedOwner && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[600px] bg-[#2a2a3c] border border-white/10 rounded-lg p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
                        <button onClick={() => { setSelectedOwner(null); setSelectedAptsToAssign([]); }} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h2 className="text-xl font-medium mb-1">Manage Properties</h2>
                        <p className="text-sm text-white/50 mb-6">{selectedOwner.owner_name}</p>

                        <div className="mb-6">
                            <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Currently Owned Units</label>
                            {selectedOwner.owned_units.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {selectedOwner.owned_units.map((unit: string, i: number) => (
                                        <span key={i} className="bg-[#02AFA9]/10 text-[#02AFA9] text-xs font-medium px-3 py-1.5 rounded-md border border-[#02AFA9]/20">
                                            {unit}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-white/40">No units assigned yet.</p>
                            )}
                        </div>

                        <form onSubmit={handleAssignApartment} className="space-y-4 pt-4 border-t border-white/5">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-3">Assign Apartments to {selectedOwner.owner_name}</label>
                                
                                <div className="max-h-[300px] overflow-y-auto space-y-5 pr-2 custom-scrollbar">
                                    {Object.keys(aptsByBlock).length > 0 ? Object.entries(aptsByBlock).map(([block, apts]: any) => (
                                        <div key={block} className="bg-[#1a1a24]/50 p-4 rounded-lg border border-white/5">
                                            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#02AFA9] mb-3">{block}</h4>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {apts.map((apt: any) => (
                                                    <label key={apt.id} className={`flex items-center gap-3 p-2.5 rounded-md border transition-colors cursor-pointer ${selectedAptsToAssign.includes(apt.id) ? 'border-[#02AFA9] bg-[#02AFA9]/5' : 'border-white/5 bg-[#1a1a24] hover:border-white/20'}`}>
                                                        <div className="relative flex items-center shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAptsToAssign.includes(apt.id)}
                                                                onChange={() => toggleAptSelection(apt.id)}
                                                                className="peer sr-only"
                                                            />
                                                            <div className="w-4 h-4 bg-[#222231] border border-white/10 rounded-[3px] peer-checked:bg-[#02AFA9] peer-checked:border-[#02AFA9] transition-colors"></div>
                                                            <svg className="absolute w-2.5 h-2.5 text-white top-0.5 left-[3px] opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-xs font-medium text-white truncate">Apt {apt.apartment_number}</span>
                                                            <span className="text-[9px] text-white/40 truncate">{apt.owner_name ? `(${apt.owner_name})` : "Unassigned"}</span>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )) : (
                                        <p className="text-sm text-white/40 text-center py-4">No available apartments to assign.</p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isAssigning || selectedAptsToAssign.length === 0}
                                className="w-full mt-4 h-11 rounded-md bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:hover:bg-white/10"
                            >
                                {isAssigning ? "Assigning..." : `Assign ${selectedAptsToAssign.length > 0 ? `(${selectedAptsToAssign.length})` : ''} Selected`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ManageSyndic() {
    return (
        <Suspense fallback={<div className="min-h-dvh bg-[#222231]" />}>
            <ManageSyndicContent />
        </Suspense>
    );
}