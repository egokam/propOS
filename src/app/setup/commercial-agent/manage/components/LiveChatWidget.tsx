"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

// تهيئة عميل Supabase للواجهة الأمامية (WebSockets)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LiveChatWidget({ propertyId, agentName }: { propertyId: string, agentName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 1. جلب الرسائل السابقة عند التحميل
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/commercial/chat?propertyId=${propertyId}`);
                if (res.ok) {
                    const data = await res.json();
                    setMessages(data.messages);
                    scrollToBottom();
                }
            } catch (error) {
                console.error("Failed to load chat history", error);
            }
        };
        
        fetchMessages();
    }, [propertyId]);

    // 2. الاستماع للرسائل الحية (Realtime Subscriptions)
    useEffect(() => {
        const channel = supabase
            .channel('realtime_agency_chat')
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'agency_messages',
                filter: `property_id=eq.${propertyId}` // استلام رسائل وكالتي فقط
            }, (payload) => {
                const newMsg = payload.new;
                setMessages((prev) => [...prev, newMsg]);
                
                // تنبيه إذا كانت النافذة مغلقة والرسالة ليست مني
                if (!isOpen && newMsg.sender_name !== agentName) {
                    setHasUnread(true);
                }
                scrollToBottom();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [propertyId, isOpen, agentName]);

    // التمرير للأسفل
    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
    };

    // 3. إرسال رسالة
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgText = newMessage.trim();
        setNewMessage(""); // تفريغ الحقل فوراً لتجربة سريعة

        try {
            await fetch("/api/commercial/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyId,
                    senderName: agentName,
                    message: msgText
                })
            });
            // لن نقوم بتحديث الـ State هنا لأن الـ Realtime سيجلبها تلقائياً
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    // عند فتح النافذة، إزالة التنبيه
    const toggleChat = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setHasUnread(false);
        scrollToBottom();
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* نافذة المحادثة الداخلية */}
            <div className={`mb-4 w-[350px] bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-bottom-right ${isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none"}`}>
                
                <div className="bg-[#14141d] border-b border-white/5 p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#02AFA9]/20 flex items-center justify-center text-[#02AFA9]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm">Agency Hub</h3>
                            <p className="text-[10px] text-[#02AFA9] uppercase tracking-widest flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#02AFA9] animate-pulse"></span> Internal Team
                            </p>
                        </div>
                    </div>
                    <button onClick={toggleChat} className="text-white/40 hover:text-white transition-colors bg-white/5 p-1.5 rounded-md">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="h-80 bg-[#222231] p-4 overflow-y-auto flex flex-col gap-4 custom-scrollbar">
                    {messages.length === 0 && (
                        <div className="text-center text-white/30 text-xs mt-10">
                            Welcome to the Agency Hub.<br/>Messages sent here are visible to your team.
                        </div>
                    )}
                    {messages.map((msg, index) => {
                        const isMe = msg.sender_name === agentName;
                        const showName = index === 0 || messages[index - 1].sender_name !== msg.sender_name;

                        return (
                            <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                {!isMe && showName && (
                                    <span className="text-[10px] text-white/40 mb-1 ml-1">{msg.sender_name}</span>
                                )}
                                <div className={`p-3 text-sm shadow-sm ${isMe ? 'bg-[#02AFA9] text-white rounded-2xl rounded-tr-sm' : 'bg-[#1a1a24] border border-white/5 text-white/90 rounded-2xl rounded-tl-sm'}`}>
                                    {msg.message}
                                </div>
                                <span className="text-[9px] text-white/30 mt-1 px-1">
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <form onSubmit={handleSendMessage} className="p-3 bg-[#1a1a24] border-t border-white/5 flex gap-2">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Message team..." 
                        className="flex-1 bg-[#222231] border border-white/5 rounded-lg px-4 text-xs text-white focus:outline-none focus:border-[#02AFA9] transition-all"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="w-10 h-10 rounded-lg bg-[#02AFA9] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#05bbb5] transition-colors shrink-0">
                        <svg className="w-4 h-4 translate-x-[1px]" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
                    </button>
                </form>
            </div>

            {/* الزر العائم */}
            <button 
                onClick={toggleChat}
                className={`w-14 h-14 rounded-full text-white shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex items-center justify-center hover:scale-110 transition-all duration-300 relative group border border-white/10 ${isOpen ? 'bg-[#1a1a24]' : 'bg-[#1a1a24] hover:bg-[#222231]'}`}
            >
                {hasUnread && !isOpen && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#02AFA9] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-[#02AFA9] border-2 border-[#222231]"></span>
                    </span>
                )}
                
                {isOpen ? (
                    <svg className="w-6 h-6 text-white/50 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                ) : (
                    <svg className="w-6 h-6 text-[#02AFA9]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
                )}
            </button>
        </div>
    );
}