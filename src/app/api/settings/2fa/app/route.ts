export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ isEnabled: false }, { status: 401 });

        // السر هنا: نبحث في الجدول المنفصل الذي تنشئه better-auth لتخزين أسرار التطبيق
        const res = await pool.query(
            `SELECT id FROM "twoFactor" WHERE "userId" = $1`, 
            [session.user.id]
        );
        
        // إذا وجدنا صفاً مرتبطاً بهذا المستخدم في جدول twoFactor، فالتطبيق مفعل قطعاً
        const isEnabled = res.rows.length > 0;
        
        return NextResponse.json({ isEnabled });
    } catch (error) {
        console.error("App 2FA Check Error:", error);
        return NextResponse.json({ isEnabled: false }, { status: 500 });
    }
}