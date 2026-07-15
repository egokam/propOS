"use client";

import { useState, useEffect } from "react";

const PROPERTY_CATEGORIES = ["Apartment", "House", "Villa", "Studio", "Bureau", "Commercial", "Land"];

function ListingCard({ item, onStatusChange }: { item: any, onStatusChange: (id: string, newStatus: string) => void }) {
    const [currentImg, setCurrentImg] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const hasImages = item.images && item.images.length > 0;
    const features = item.features || {};

    const nextImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImg((prev) => (prev + 1) % item.images.length);
    };

    const prevImg = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImg((prev) => (prev - 1 + item.images.length) % item.images.length);
    };

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        e.stopPropagation();
        const newStatus = e.target.value;
        setIsUpdating(true);
        try {
            await onStatusChange(item.id, newStatus);
        } finally {
            setIsUpdating(false);
        }
    };

    const isResidential = ["Apartment", "House", "Villa", "Studio"].includes(item.property_category);

    return (
        <div className="bg-[#1a1a24] border border-white/5 rounded-2xl overflow-hidden flex flex-col group hover:border-[#02AFA9]/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300 relative h-full">
            <div className="h-48 bg-gradient-to-br from-[#222231] to-[#2a2a3c] relative overflow-hidden group/image">
                {hasImages ? (
                    <img src={item.images[currentImg]} alt={item.title} className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#02AFA9] to-transparent"></div>
                )}
                
                {hasImages && item.images.length > 1 && (
                    <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                        <button onClick={prevImg} className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-[#02AFA9] transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                        <button onClick={nextImg} className="w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-[#02AFA9] transition-colors"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></button>
                    </div>
                )}

                <div className="absolute top-3 left-3 flex gap-2">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 ${item.listing_type === 'Sale' ? 'text-blue-400' : 'text-purple-400'}`}>
                        For {item.listing_type}
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-black/50 backdrop-blur-md border border-white/10 text-white">
                        {item.property_category || "Property"}
                    </span>
                </div>
                
                {/* 🌟 قائمة منسدلة ذكية لتغيير الحالة مباشرة */}
                <div className="absolute top-3 right-3 z-10">
                    <select 
                        value={item.status} 
                        onChange={handleStatusChange}
                        disabled={isUpdating}
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded backdrop-blur-md border outline-none appearance-none cursor-pointer ${
                            item.status === 'Available' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 
                            item.status === 'Reserved' ? 'bg-amber-500/20 text-amber-400 border-amber-500/20' : 
                            'bg-[#FF5E5F]/20 text-[#FF5E5F] border-[#FF5E5F]/20'
                        } ${isUpdating ? 'opacity-50' : ''}`}
                    >
                        <option value="Available" className="bg-[#1a1a24] text-white">Available</option>
                        <option value="Reserved" className="bg-[#1a1a24] text-white">Reserved</option>
                        <option value="Sold" className="bg-[#1a1a24] text-white">Sold</option>
                    </select>
                </div>

                {hasImages && (
                    <div className="absolute bottom-2 right-3 text-[9px] font-bold bg-black/50 px-2 py-0.5 rounded text-white border border-white/10 shadow-lg pointer-events-none">
                        {currentImg + 1} / {item.images.length}
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="mb-3">
                    <p className="text-[10px] text-[#02AFA9] font-semibold uppercase tracking-widest mb-1 line-clamp-1">{item.location}</p>
                    <h3 className="text-base font-semibold text-white group-hover:text-[#02AFA9] transition-colors line-clamp-1">{item.title}</h3>
                </div>
                
                <div className="flex flex-wrap gap-x-3 gap-y-2 mb-4 text-[11px] text-white/60">
                    <div className="flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#02AFA9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        <span>{item.area_sqm} m²</span>
                    </div>
                    {isResidential && (
                        <>
                            {features.bedrooms > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-lg leading-none mt-px">🛏️</span>
                                    <span>{features.bedrooms} Beds</span>
                                </div>
                            )}
                            {features.bathrooms > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-lg leading-none mt-px">🚿</span>
                                    <span>{features.bathrooms} Baths</span>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4 mt-auto">
                    {features.furnished && <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase tracking-wider">Furnished</span>}
                    {Array.isArray(item.keywords) && item.keywords.slice(0, 2).map((kw: string, i: number) => (
                        <span key={i} className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/60 uppercase tracking-wider">{kw}</span>
                    ))}
                </div>
                
                <div className="pt-4 border-t border-white/5 text-right mt-auto">
                    <p className="text-[10px] text-white/40 uppercase tracking-wider mb-0.5">Price</p>
                    <p className="font-mono text-lg font-bold text-white group-hover:text-[#02AFA9] transition-colors">{Number(item.price).toLocaleString()} MAD</p>
                </div>
            </div>
        </div>
    );
}

export default function ListingsTab({ propertyId }: { propertyId: string | null }) {
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({ 
        title: "", price: "", listing_type: "Sale", surface_m2: "", location: "",
        property_category: "Apartment"
    });
    
    const [dynamicFeatures, setDynamicFeatures] = useState({
        furnished: false, bedrooms: 1, bathrooms: 1, living_rooms: 1, condition: "Fitted", zoning: "Residential"
    });

    const [keywords, setKeywords] = useState<string[]>([]);
    const [keywordInput, setKeywordInput] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);

    useEffect(() => {
        if (propertyId) fetchListings();
    }, [propertyId]);

    const fetchListings = async () => {
        try {
            const res = await fetch(`/api/commercial/listings?propertyId=${propertyId}`);
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings);
            }
        } catch (error) {} finally { setIsLoading(false); }
    };

    // 🌟 دالة تحديث حالة العقار في الواجهة وقاعدة البيانات
    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await fetch("/api/commercial/listings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status: newStatus })
            });

            if (res.ok) {
                setListings(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
            }
        } catch (error) {
            console.error("Failed to update status");
        }
    };

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && keywordInput.trim()) {
            e.preventDefault();
            if (!keywords.includes(keywordInput.trim())) setKeywords([...keywords, keywordInput.trim()]);
            setKeywordInput("");
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles([...selectedFiles, ...filesArray]);
            const newPreviews = filesArray.map(file => URL.createObjectURL(file));
            setImagePreviews([...imagePreviews, ...newPreviews]);
        }
    };

    const removeImage = (indexToRemove: number) => {
        setImagePreviews(imagePreviews.filter((_, idx) => idx !== indexToRemove));
        setSelectedFiles(selectedFiles.filter((_, idx) => idx !== indexToRemove));
    };

    const handleAddListing = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const uploadedUrls: string[] = [];
            for (const file of selectedFiles) {
                const uploadData = new FormData();
                uploadData.append("file", file);
                const uploadRes = await fetch("/api/commercial/upload", { method: "POST", body: uploadData });
                if (uploadRes.ok) {
                    const { url } = await uploadRes.json();
                    uploadedUrls.push(url);
                }
            }

            const res = await fetch("/api/commercial/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId, 
                    title: formData.title,
                    price: parseFloat(formData.price), 
                    listing_type: formData.listing_type,
                    surface_m2: parseFloat(formData.surface_m2),
                    location: formData.location,
                    property_category: formData.property_category,
                    keywords: keywords,
                    images: uploadedUrls,
                    features: dynamicFeatures
                })
            });

            if (res.ok) {
                const data = await res.json();
                setListings([data.listing, ...listings]);
                setIsModalOpen(false);
                setFormData({ title: "", price: "", listing_type: "Sale", surface_m2: "", location: "", property_category: "Apartment" });
                setDynamicFeatures({ furnished: false, bedrooms: 1, bathrooms: 1, living_rooms: 1, condition: "Fitted", zoning: "Residential" });
                setKeywords([]); 
                setImagePreviews([]);
                setSelectedFiles([]);
            }
        } catch (error) {
            console.error("Submission error:", error);
        } finally { setIsSubmitting(false); }
    };

    // 🌟 إصلاح محرك البحث (يدعم الـ Keywords الآن بشكل آمن)
    const filteredListings = listings.filter(item => {
        const searchLower = searchQuery.toLowerCase();
        const matchesFilter = filter === "All" || item.status === filter;
        
        const matchesSearch = 
            (item.title && item.title.toLowerCase().includes(searchLower)) || 
            (item.location && item.location.toLowerCase().includes(searchLower)) ||
            (item.property_category && item.property_category.toLowerCase().includes(searchLower)) ||
            (Array.isArray(item.keywords) && item.keywords.some((k: string) => k.toLowerCase().includes(searchLower)));
            
        return matchesFilter && matchesSearch;
    });

    const isResidential = ["Apartment", "House", "Villa", "Studio"].includes(formData.property_category);
    const isCommercial = ["Bureau", "Commercial"].includes(formData.property_category);
    const isLand = formData.property_category === "Land";

    if (isLoading) return <div className="h-full flex items-center justify-center text-[#02AFA9]">Loading portfolio...</div>;

    return (
        <div className="flex flex-col h-full space-y-6 relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Property Portfolio</h2>
                    <p className="text-sm text-white/50">Manage your active, reserved, and sold listings.</p>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                    <div className="relative w-full sm:w-64">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search properties or keywords..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-9 bg-[#1a1a24] border border-white/5 rounded-lg pl-9 pr-4 text-xs text-white focus:outline-none focus:border-[#02AFA9] transition-all" />
                    </div>

                    <div className="flex bg-[#1a1a24] border border-white/5 rounded-lg p-1" id="tour-filter">
                        {["All", "Available", "Reserved", "Sold"].map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filter === f ? "bg-white/10 text-white" : "text-white/40 hover:text-white"}`}>{f}</button>
                        ))}
                    </div>
                    <button id="tour-new-listing" onClick={() => setIsModalOpen(true)} className="h-9 px-4 rounded-lg bg-[#02AFA9] text-xs font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(2,175,169,0.25)] hover:bg-[#05bbb5] hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                        + New Listing
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredListings.map((item) => <ListingCard key={item.id} item={item} onStatusChange={handleStatusUpdate} />)}
            </div>

            {filteredListings.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl py-20 text-center">
                    <p className="text-white/50 text-sm mb-4">No properties match your criteria.</p>
                </div>
            )}

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#222231]/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-[650px] bg-[#2a2a3c] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
                        <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 p-2 text-white/50 hover:text-white hover:bg-[#FF5E5F]/20 hover:text-[#FF5E5F] rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                        
                        <h2 className="text-2xl font-semibold mb-6">New Property Listing</h2>
                        
                        <form onSubmit={handleAddListing} className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#02AFA9] mb-3">1. Select Property Type</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x">
                                    {PROPERTY_CATEGORIES.map(category => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, property_category: category })}
                                            className={`px-4 py-2 shrink-0 snap-center rounded-lg text-xs font-semibold uppercase tracking-wider transition-all border ${formData.property_category === category ? 'bg-[#02AFA9]/10 text-[#02AFA9] border-[#02AFA9]' : 'bg-[#1a1a24] text-white/50 border-white/5 hover:border-white/20'}`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#02AFA9] mb-3">2. Basic Details</label>
                                
                                <div><label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Property Title</label><input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm text-white focus:border-[#02AFA9] outline-none" placeholder="e.g. Modern Office Space" /></div>
                                
                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div><label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Price (MAD)</label><input type="number" required value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm outline-none focus:border-[#02AFA9]" /></div>
                                    <div><label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Surface (m²)</label><input type="number" required value={formData.surface_m2} onChange={(e) => setFormData({ ...formData, surface_m2: e.target.value })} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm outline-none focus:border-[#02AFA9]" placeholder="e.g. 120" /></div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <div><label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Location</label><input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm outline-none focus:border-[#02AFA9]" /></div>
                                    <div><label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Listing Type</label>
                                        <select value={formData.listing_type} onChange={(e) => setFormData({ ...formData, listing_type: e.target.value })} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm outline-none focus:border-[#02AFA9]">
                                            <option value="Sale">For Sale</option><option value="Rent">For Rent</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-white/5 pt-4 bg-[#1a1a24]/30 rounded-lg p-4">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#02AFA9] mb-3">3. {formData.property_category} Features</label>
                                
                                {isResidential && (
                                    <div className="space-y-4 animate-in fade-in">
                                        <label className="flex items-center gap-3 cursor-pointer group w-fit">
                                            <div className="relative flex items-center">
                                                <input type="checkbox" checked={dynamicFeatures.furnished} onChange={(e) => setDynamicFeatures({...dynamicFeatures, furnished: e.target.checked})} className="peer sr-only" />
                                                <div className="w-5 h-5 bg-[#222231] border border-white/10 rounded peer-checked:bg-[#02AFA9] transition-colors"></div>
                                                <svg className="absolute w-3 h-3 text-white top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <span className="text-xs text-white/70">Equipped / Furnished</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div><label className="block text-[10px] text-white/50 mb-1">Bedrooms</label><input type="number" min="0" value={dynamicFeatures.bedrooms} onChange={(e) => setDynamicFeatures({...dynamicFeatures, bedrooms: parseInt(e.target.value) || 0})} className="w-full h-9 bg-[#222231] border border-white/5 rounded px-3 text-sm text-white focus:border-[#02AFA9] outline-none" /></div>
                                            <div><label className="block text-[10px] text-white/50 mb-1">Bathrooms</label><input type="number" min="0" value={dynamicFeatures.bathrooms} onChange={(e) => setDynamicFeatures({...dynamicFeatures, bathrooms: parseInt(e.target.value) || 0})} className="w-full h-9 bg-[#222231] border border-white/5 rounded px-3 text-sm text-white focus:border-[#02AFA9] outline-none" /></div>
                                            <div><label className="block text-[10px] text-white/50 mb-1">Salons (Living)</label><input type="number" min="0" value={dynamicFeatures.living_rooms} onChange={(e) => setDynamicFeatures({...dynamicFeatures, living_rooms: parseInt(e.target.value) || 0})} className="w-full h-9 bg-[#222231] border border-white/5 rounded px-3 text-sm text-white focus:border-[#02AFA9] outline-none" /></div>
                                        </div>
                                    </div>
                                )}

                                {isCommercial && (
                                    <div className="animate-in fade-in">
                                        <label className="block text-[10px] text-white/50 mb-1">Condition</label>
                                        <select value={dynamicFeatures.condition} onChange={(e) => setDynamicFeatures({...dynamicFeatures, condition: e.target.value})} className="w-full h-11 bg-[#222231] border border-white/5 rounded-lg px-4 text-sm text-white focus:border-[#02AFA9] outline-none">
                                            <option value="Fitted">Fitted Out (Aménagé)</option>
                                            <option value="Raw">Raw / Shell (Brut)</option>
                                        </select>
                                    </div>
                                )}

                                {isLand && (
                                    <div className="animate-in fade-in">
                                        <label className="block text-[10px] text-white/50 mb-1">Zoning Type</label>
                                        <select value={dynamicFeatures.zoning} onChange={(e) => setDynamicFeatures({...dynamicFeatures, zoning: e.target.value})} className="w-full h-11 bg-[#222231] border border-white/5 rounded-lg px-4 text-sm text-white focus:border-[#02AFA9] outline-none">
                                            <option value="Residential">Residential</option>
                                            <option value="Agricultural">Agricultural</option>
                                            <option value="Commercial">Commercial / Industrial</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-white/5 pt-4">
                                <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[#02AFA9] mb-3">4. Media & SEO</label>
                                
                                <div className="mb-4">
                                    <div className="w-full border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center hover:border-[#02AFA9]/50 transition-colors bg-[#1a1a24] relative cursor-pointer group">
                                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                        <svg className="w-8 h-8 text-white/30 mb-2 group-hover:text-[#02AFA9] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-xs text-white/50 text-center">Click or drag images here to upload.</p>
                                    </div>
                                    {imagePreviews.length > 0 && (
                                        <div className="flex gap-2 mt-3 overflow-x-auto pb-2 custom-scrollbar">
                                            {imagePreviews.map((src, i) => (
                                                <div key={i} className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-white/10">
                                                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-4 h-4 bg-black/60 rounded-full text-white flex items-center justify-center text-[8px] hover:bg-red-500 transition-colors">X</button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55 mb-2">Keywords / Tags (Press Enter)</label>
                                    <input type="text" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} onKeyDown={handleAddKeyword} className="w-full h-11 bg-[#1a1a24] border border-white/5 rounded-lg px-4 text-sm outline-none focus:border-[#02AFA9]" placeholder="e.g. Pool, Sea View, Balcony..." />
                                    {keywords.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {keywords.map((kw, i) => (
                                                <span key={i} className="flex items-center gap-1 bg-[#02AFA9]/10 text-[#02AFA9] px-2 py-1 rounded text-[10px] font-bold border border-[#02AFA9]/20 uppercase">
                                                    {kw} <button type="button" onClick={() => setKeywords(keywords.filter((_, idx) => idx !== i))} className="hover:text-white ml-1">×</button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button type="submit" disabled={isSubmitting} className="w-full mt-6 h-12 rounded-lg bg-[#02AFA9] text-xs font-bold uppercase tracking-wider text-white hover:bg-[#05bbb5] transition-colors disabled:opacity-50">
                                {isSubmitting ? "Publishing..." : "Publish Listing"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}