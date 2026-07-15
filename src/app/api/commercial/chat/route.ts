export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

// 1. جلب الرسائل السابقة للوكالة
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");
        
        if (!propertyId) return NextResponse.json({ message: "Property ID required" }, { status: 400 });

        // نجلب آخر 50 رسالة ونرتبها
        const result = await pool.query(
            `SELECT * FROM agency_messages WHERE property_id = $1 ORDER BY created_at ASC LIMIT 50`,
            [propertyId]
        );

        return NextResponse.json({ messages: result.rows }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching messages" }, { status: 500 });
    }
}

// 2. إرسال رسالة جديدة
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        const insertQuery = `
            INSERT INTO agency_messages (property_id, sender_name, message)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [
            data.propertyId, 
            data.senderName, 
            data.message
        ]);

        return NextResponse.json({ success: true, message: result.rows[0] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error sending message" }, { status: 500 });
    }
}