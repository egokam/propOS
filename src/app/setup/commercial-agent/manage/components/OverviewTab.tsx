"use client";

import { useState, useEffect } from "react";

export default function OverviewTab({ propertyId }: { propertyId: string | null }) {
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // 🌟 جلب البيانات الحقيقية للإحصائيات
    useEffect(() => {
        if (propertyId) fetchDashboardData();
    }, [propertyId]);

    const fetchDashboardData = async () => {
        try {
            // جلب العروض الحقيقية من الـ API الذي بنيناه
            const res = await fetch(`/api/commercial/listings?propertyId=${propertyId}`);
            if (res.ok) {
                const data = await res.json();
                setListings(data.listings);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // 🧮 العمليات الحسابية الديناميكية
    const activeListings = listings.filter(l => l.status === 'Available').length;
    const soldListings = listings.filter(l => l.status === 'Sold').length;
    const totalPortfolioValue = listings.reduce((sum, item) => sum + Number(item.price), 0);
    const estimatedCommission = totalPortfolioValue * 0.025; // افتراض 2.5% عمولة

    // بيانات وهمية للرسم البياني (لتعطي مظهراً فخماً حتى نربطها بالتواريخ الحقيقية)
    const chartData = [
        { month: "Jan", value: 40 }, { month: "Feb", value: 65 }, { month: "Mar", value: 45 },
        { month: "Apr", value: 80 }, { month: "May", value: 55 }, { month: "Jun", value: 90 },
        { month: "Jul", value: activeListings > 0 ? 100 : 20 } // الشهر الحالي يتفاعل مع نشاطك
    ];

    if (isLoading) {
        return <div className="h-full flex items-center justify-center text-[#02AFA9] animate-pulse">Calculating Metrics...</div>;
    }

    return (
        <div className="flex flex-col h-full space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-semibold text-white mb-1">Agency Overview</h2>
                    <p className="text-sm text-white/50">Your commercial real estate performance at a glance.</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-[#02AFA9]">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">Real-time Data</p>
                </div>
            </div>

            {/* 📊 Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-[#02AFA9]/10 flex items-center justify-center text-[#02AFA9]">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">Portfolio</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">Total Value</p>
                    <h3 className="text-2xl font-bold text-white">${(totalPortfolioValue / 1000000).toFixed(2)}M</h3>
                </div>

                <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${activeListings > 0 ? 'text-emerald-400 bg-emerald-400/10' : 'text-white/40 bg-white/5'}`}>
                            {activeListings > 0 ? 'Active' : 'Empty'}
                        </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">Available Listings</p>
                    <h3 className="text-2xl font-bold text-white">{activeListings}</h3>
                </div>

                <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-5 shadow-sm hover:border-white/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-400/10 px-2 py-1 rounded-md">Closed</span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">Sold Properties</p>
                    <h3 className="text-2xl font-bold text-white">{soldListings}</h3>
                </div>

                <div className="bg-gradient-to-br from-[#1a1a24] to-[#02AFA9]/10 border border-[#02AFA9]/20 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#02AFA9]/20 rounded-full blur-xl group-hover:bg-[#02AFA9]/30 transition-colors"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="w-10 h-10 rounded-lg bg-[#02AFA9] flex items-center justify-center text-white shadow-lg">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/60 mb-1 relative z-10">Est. Commission</p>
                    <h3 className="text-2xl font-bold text-[#02AFA9] relative z-10">${estimatedCommission.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
                </div>
            </div>

            {/* 📈 Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-[400px]">
                
                {/* 🎨 Custom Pure CSS Bar Chart */}
                <div className="lg:col-span-2 bg-[#1a1a24] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-semibold text-white">Activity Overview (YTD)</h3>
                        <span className="text-[10px] uppercase tracking-wider bg-white/5 text-white/50 px-2 py-1 rounded">2026</span>
                    </div>
                    
                    <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-4 border-b border-white/5 relative">
                        {/* خطوط الخلفية (Grid Lines) */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-4">
                            {[100, 75, 50, 25, 0].map(line => (
                                <div key={line} className="w-full h-px bg-white/5"></div>
                            ))}
                        </div>
                        
                        {/* الأعمدة (Bars) */}
                        {chartData.map((data, i) => (
                            <div key={i} className="flex flex-col items-center gap-2 w-full z-10 group">
                                <div className="w-full max-w-[40px] bg-[#222231] rounded-t-sm h-[200px] relative flex items-end">
                                    <div 
                                        className="w-full bg-gradient-to-t from-[#02AFA9]/50 to-[#02AFA9] rounded-t-sm transition-all duration-1000 ease-out group-hover:opacity-80" 
                                        style={{ height: `${data.value}%` }}
                                    ></div>
                                </div>
                                <span className="text-[10px] text-white/40 font-medium uppercase">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 🕒 Recent Activities (Real Data) */}
                <div className="bg-[#1a1a24] border border-white/5 rounded-2xl p-6 flex flex-col">
                    <h3 className="text-sm font-semibold text-white mb-6">Recent Additions</h3>
                    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                        {listings.length > 0 ? listings.slice(0, 5).map((act, i) => (
                            <div key={act.id} className="flex gap-4 group">
                                <div className="flex flex-col items-center">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${act.listing_type === 'Sale' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                    {i !== Math.min(listings.length - 1, 4) && <div className="w-px h-full bg-white/10 mt-2 group-hover:bg-[#02AFA9]/50 transition-colors"></div>}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white mb-0.5">{act.title}</p>
                                    <p className="text-xs text-white/40 mb-1">Listed for {act.listing_type} in {act.location}</p>
                                    <p className="text-[10px] text-white/20 uppercase tracking-wider font-mono">${Number(act.price).toLocaleString()}</p>
                                </div>
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-white/20">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm text-white/40">No recent activity.</p>
                                <p className="text-[10px] text-white/20 mt-1">Add listings to see them here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}