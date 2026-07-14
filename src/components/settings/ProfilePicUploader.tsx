"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";

// 🛠️ دالة مساعدة لاستخراج الصورة المقصوصة وتحويلها إلى Base64
const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener("load", () => resolve(image));
        image.addEventListener("error", (error) => reject(error));
        image.setAttribute("crossOrigin", "anonymous");
        image.src = url;
    });

async function getCroppedImg(imageSrc: string, pixelCrop: any, filter: string): Promise<string | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // تطبيق الفلتر على الـ Canvas
    ctx.filter = filter !== "none" ? filter : "none";
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // تحويل النتيجة إلى Base64 جاهزة للإرسال للـ API
    return canvas.toDataURL("image/jpeg", 0.9);
}

// 🎨 خيارات الفلاتر المتاحة
const FILTERS = [
    { name: "Normal", value: "none" },
    { name: "Grayscale", value: "grayscale(100%)" },
    { name: "Sepia", value: "sepia(100%)" },
    { name: "Vintage", value: "sepia(50%) contrast(150%) saturate(150%)" },
];

interface ProfilePicUploaderProps {
    currentImage: string;
    onImageChange: (base64Image: string) => void;
    userInitials: string;
}

export default function ProfilePicUploader({ currentImage, onImageChange, userInitials }: ProfilePicUploaderProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [selectedFilter, setSelectedFilter] = useState(FILTERS[0].value);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // عند اختيار المستخدم لصورة من جهازه
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener("load", () => {
                setImageSrc(reader.result?.toString() || null);
                setIsModalOpen(true);
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    // حفظ التعديلات وإنتاج الصورة النهائية
    const handleSave = async () => {
        if (!imageSrc || !croppedAreaPixels) return;
        try {
            const croppedBase64 = await getCroppedImg(imageSrc, croppedAreaPixels, selectedFilter);
            if (croppedBase64) {
                onImageChange(croppedBase64); // إرسال الصورة للـ Parent (page.tsx)
            }
            handleClose();
        } catch (e) {
            console.error(e);
        }
    };

    const handleClose = () => {
        setIsModalOpen(false);
        setImageSrc(null);
        setZoom(1);
        setSelectedFilter(FILTERS[0].value);
    };

    return (
        <div className="mb-8">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-4">
                Profile Picture (Optional)
            </label>
            <div className="flex items-center gap-6">
                {/* دائرة عرض الصورة الحالية */}
                <div className="relative w-20 h-20 rounded-full bg-[#02AFA9] flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-white/5 overflow-hidden group">
                    {currentImage ? (
                        <img src={currentImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                        <span>{userInitials}</span>
                    )}
                    
                    {/* زر التعديل فوق الصورة */}
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                </div>

                <div className="flex flex-col">
                    <p className="text-sm text-white font-medium">Upload a new photo</p>
                    <p className="text-[11px] text-white/40 mt-1">Recommended size: 400x400px. Max 2MB.</p>
                </div>
            </div>

            {/* ✂️ نافذة القص والفلاتر */}
            {isModalOpen && imageSrc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#222231]/90 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-[#2a2a3c] border border-white/10 rounded-xl overflow-hidden shadow-2xl flex flex-col">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h2 className="text-lg font-medium text-white">Edit Profile Picture</h2>
                            <button onClick={handleClose} className="text-white/50 hover:text-white transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* مساحة القص */}
                        <div className="relative w-full h-64 bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1} // فرض نسبة 1:1 (مربع/دائرة)
                                cropShape="round"
                                showGrid={false}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                                style={{ mediaStyle: { filter: selectedFilter } }} // تطبيق الفلتر المباشر
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            {/* شريط التقريب (Zoom) */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-3">Zoom</label>
                                <input 
                                    type="range" min={1} max={3} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#02AFA9]"
                                />
                            </div>

                            {/* الفلاتر (Filters) */}
                            <div>
                                <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/50 mb-3">Filters</label>
                                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2">
                                    {FILTERS.map((f) => (
                                        <button
                                            key={f.name}
                                            onClick={() => setSelectedFilter(f.value)}
                                            className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                                                selectedFilter === f.value 
                                                ? 'bg-[#02AFA9]/20 border-[#02AFA9] text-[#02AFA9]' 
                                                : 'bg-[#1a1a24] border-white/5 text-white/50 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            {f.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button onClick={handleClose} className="px-5 py-2.5 rounded-lg text-xs font-semibold uppercase text-white/50 hover:text-white hover:bg-white/5 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSave} className="px-5 py-2.5 rounded-lg bg-[#02AFA9] text-white text-xs font-semibold uppercase shadow-lg hover:bg-[#05bbb5] transition-colors">
                                    Apply & Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}