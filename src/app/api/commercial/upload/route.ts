export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) return NextResponse.json({ message: "No file provided" }, { status: 400 });

        // إنشاء اسم فريد للصورة لتجنب استبدال الصور المتشابهة في الاسم
        const fileExtension = file.name.split('.').pop();
        const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;

        // رابط مشروعك في Supabase والمفتاح السري
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // إرسال الصورة مباشرة إلى Supabase Storage عبر الـ REST API السريع
        const uploadRes = await fetch(`${supabaseUrl}/storage/v1/object/properties_images/${uniqueFilename}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${supabaseServiceKey}`,
                "Content-Type": file.type,
            },
            body: file,
        });

        if (!uploadRes.ok) {
            const errorData = await uploadRes.json();
            throw new Error(errorData.message || "Upload failed");
        }

        // تكوين الرابط العام للصورة (Public URL)
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/properties_images/${uniqueFilename}`;

        return NextResponse.json({ success: true, url: publicUrl }, { status: 200 });

    } catch (error) {
        console.error("Upload Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}