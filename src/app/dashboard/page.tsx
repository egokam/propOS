"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons/ArrowRightIcon";

const PROPERTY_TYPES = [
    "Syndic",
    "Villa",
    "Immeuble",
    "Commercial Agent"
];

export default function Dashboard() {
    const router = useRouter();
    
    // جلب بيانات الجلسة والمستخدم
    const { data: session, isPending } = authClient.useSession();
    
    const [properties, setProperties] = useState<any[]>([]);
    const [isLoadingProps, setIsLoadingProps] = useState(true);

    // حالات (States) خاصة بالـ Popup (Modal) الخاص بالإضافة
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedProperty, setSelectedProperty] = useState(PROPERTY_TYPES[0]);
    const [propertyName, setPropertyName] = useState("");
    const [address, setAddress] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // حالة خاصة بالقائمة المنسدلة (النقاط الثلاث)
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        if (!isPending && !session) {
            router.push("/login");
            return;
        }

        if (session) {
            fetchProperties();
        }
    }, [session, isPending, router]);

    const fetchProperties = async () => {
        try {
            const res = await fetch("/api/properties");
            if (res.ok) {
                const data = await res.json();
                setProperties(data); 
            } else {
                setProperties([]);
            }
        } catch (error) {
            console.error("Failed to fetch properties:", error);
            setProperties([]);
        } finally {
            setIsLoadingProps(false);
        }
    };

    const handleSignOut = async () => {
        await authClient.signOut();
        router.push("/login");
    };

    // دالة الانتقال إلى صفحة إعداد العقار بناءً على النوع
    const handleContinueToSetup = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const typeSlug = selectedProperty.toLowerCase().replace(/\s+/g, '-');
        
        const queryParams = new URLSearchParams({
            type: selectedProperty,
            name: propertyName,
            address: address
        }).toString();

        router.push(`/setup/${typeSlug}?${queryParams}`);
    };

    // دالة لإغلاق وتصفير الـ Modal
    const closeModal = () => {
        setIsModalOpen(false);
        setPropertyName("");
        setAddress("");
        setSelectedProperty(PROPERTY_TYPES[0]);
        setIsDropdownOpen(false);
    };

    // دالة حذف العقار
    const handleDeleteProperty = async (id: string) => {
        if (!confirm("Are you sure you want to delete this property?")) return;
        try {
            const res = await fetch(`/api/properties?id=${id}`, { method: "DELETE" });
            if (res.ok) {
                setProperties(prev => prev.filter(p => p.id !== id));
            } else {
                alert("Failed to delete property.");
            }
        } catch (error) {
            console.error("Delete error:", error);
            alert("An error occurred while deleting.");
        } finally {
            setOpenMenuId(null);
        }
    };

    if (isPending) {
        return <div className="min-h-dvh bg-[#222231] flex items-center justify-center text-[#02AFA9]">Loading PropOS...</div>;
    }

    if (!session) return null;

    const userInitials = session.user.name ? session.user.name.charAt(0).toUpperCase() : "U";

    return (
        <div className="min-h-dvh bg-[#222231] text-white flex relative" onClick={() => setOpenMenuId(null)}>
            {/* Sidebar */}
            <aside className="w-64 bg-[#1a1a24] border-r border-white/5 hidden md:flex flex-col z-10">
                <div className="h-16 flex items-center px-6 border-b border-white/5">
                    <span className="text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </span>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 bg-[#02AFA9]/10 text-[#02AFA9] rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                        Dashboard
                    </Link>
                    
                   
                    <Link href="#" className="flex items-center gap-3 px-3 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        Settings
                    </Link>
                </nav>
                
                <div className="p-4 border-t border-white/5">
                    <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2 text-white/50 hover:text-[#FF5E5F] hover:bg-[#FF5E5F]/10 rounded-md text-sm font-medium transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-dvh overflow-y-auto z-10 relative">
                {/* Topbar */}
                <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 bg-[#222231]/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="md:hidden text-lg font-bold tracking-wider">
                        Prop<span className="text-[#02AFA9]">OS</span>
                    </div>
                    <div className="hidden md:block text-sm text-white/50">
                        Overview
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium">{session.user.name}</p>
                            <p className="text-xs text-white/40">{session.user.email}</p>
                        </div>
                        {/* Account Icon */}
                        <div className="w-10 h-10 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-[#222231] cursor-pointer hover:scale-105 transition-transform">
                            {userInitials}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="p-8 max-w-6xl mx-auto w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                        <div>
                            <h1 className="text-2xl font-semibold mb-1">Welcome back, {session.user.name?.split(' ')[0]}! 👋</h1>
                            <p className="text-white/50 text-sm">Here is what's happening with your properties today.</p>
                        </div>
                        
                        {properties.length > 0 && (
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[4px] bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors shadow-lg"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Property
                            </button>
                        )}
                    </div>

                    {isLoadingProps ? (
                        <div className="h-64 flex items-center justify-center border border-white/5 border-dashed rounded-lg">
                            <div className="w-8 h-8 border-4 border-[#02AFA9] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : properties.length === 0 ? (
                        /* Empty State */
                        <div className="flex flex-col items-center justify-center py-20 px-4 border border-white/10 border-dashed rounded-xl bg-[#1a1a24]/50 text-center shadow-sm">
                            <div className="w-16 h-16 bg-[#02AFA9]/10 text-[#02AFA9] rounded-full flex items-center justify-center mb-6">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            </div>
                            <h3 className="text-xl font-medium mb-2">No properties yet</h3>
                            <p className="text-white/50 text-sm max-w-md mb-8">
                                You haven't added any properties to manage. Start by setting up your first Syndic, Villa, or building.
                            </p>
                            <button 
                                onClick={() => setIsModalOpen(true)}
                                className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-[4px] bg-[#02AFA9] text-xs font-semibold uppercase tracking-wider text-white hover:bg-[#05bbb5] hover:-translate-y-0.5 transition-all shadow-[0_8px_20px_rgba(2,175,169,0.30)]"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Add Your First Property
                            </button>
                        </div>
                    ) : (
                        /* Populated State (Grid of properties) */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {properties.map((prop, idx) => (
                                <Link 
                                    href={`/setup/${(prop.property_type || "Syndic").toLowerCase().replace(/\s+/g, '-')}/manage?id=${prop.id}`}
                                    key={idx} 
                                    className="bg-[#1a1a24] border border-white/5 rounded-xl p-6 hover:border-white/10 transition-colors group cursor-pointer block relative"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="px-2.5 py-1 rounded bg-white/5 text-xs font-medium text-white/70">
                                            {prop.property_type || "Property"}
                                        </div>
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setOpenMenuId(openMenuId === prop.id ? null : prop.id);
                                                }}
                                                className="text-white/30 hover:text-white transition-colors p-1"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                                            </button>
                                            
                                            {openMenuId === prop.id && (
                                                <div className="absolute right-0 mt-2 w-32 bg-[#2a2a3c] border border-white/10 rounded-md shadow-xl z-50 overflow-hidden">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDeleteProperty(prop.id);
                                                        }}
                                                        className="w-full text-left px-4 py-2 text-sm text-[#FF5E5F] hover:bg-white/5 transition-colors"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-[#02AFA9] transition-colors">{prop.name || "Unnamed Property"}</h3>
                                    <p className="text-sm text-white/40 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        {prop.address || "No address provided"}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Add Property Modal Popup */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div 
                        className="w-full max-w-[540px] bg-[#2a2a3c]/90 border border-white/10 rounded-lg p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-200"
                    >
                        {/* Close Button */}
                        <button 
                            onClick={closeModal}
                            className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <form onSubmit={handleContinueToSetup} className="space-y-5">
                            <h2 className="text-[32px] font-medium leading-tight mb-2">Primary Details</h2>
                            <p className="text-[14px] text-white/45 mb-8">What are you managing?</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Property Type</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 flex items-center justify-between text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    >
                                        <span>{selectedProperty}</span>
                                        <svg className={`w-4 h-4 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {isDropdownOpen && (
                                        <div className="absolute z-50 w-full mt-2 py-2 bg-[#1a1a24] border border-white/10 rounded-[4px] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                            {PROPERTY_TYPES.map((type) => (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedProperty(type);
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-2.5 text-[14px] text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Property Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Résidence Les Palmiers"
                                        value={propertyName}
                                        onChange={(e) => setPropertyName(e.target.value)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Address</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Main street, City"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        className="w-full h-[46px] bg-[#1a1a24] border border-white/5 rounded-[4px] px-4 text-[14px] text-white focus:outline-none focus:border-[#02AFA9] focus:ring-1 focus:ring-[#02AFA9] transition-all"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group mt-8 w-full inline-flex h-[46px] items-center justify-center gap-2 whitespace-nowrap rounded-[4px] bg-[#02AFA9] text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_20px_rgba(2,175,169,0.30),0_2px_6px_rgba(0,0,0,0.14)] transition-all duration-200 ease-out hover:-translate-y-[2px] hover:bg-[#05bbb5] active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>{isSubmitting ? "Loading..." : "Next: Complete Setup"}</span>
                                {!isSubmitting && <ArrowRightIcon className="h-[10px] w-[10px] transition-transform duration-200 group-hover:translate-x-1" />}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}