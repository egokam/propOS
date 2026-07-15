export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

// جلب جميع العملاء والصفقات الخاصة بوكالة معينة
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");
        
        if (!propertyId) return NextResponse.json({ message: "Property ID required" }, { status: 400 });

        const result = await pool.query(
            `SELECT * FROM agent_leads WHERE property_id = $1 ORDER BY created_at DESC`,
            [propertyId]
        );

        return NextResponse.json({ leads: result.rows }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error fetching leads" }, { status: 500 });
    }
}

// إضافة عميل جديد
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        const insertQuery = `
            INSERT INTO agent_leads (property_id, client_name, client_email, client_phone, budget, preferred_type, stage)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [
            data.propertyId, data.client_name, data.client_email, data.client_phone, 
            data.budget, data.preferred_type, data.stage || 'New'
        ]);

        return NextResponse.json({ success: true, lead: result.rows[0] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error adding lead" }, { status: 500 });
    }
}

// تحديث مرحلة الصفقة (عند السحب والإفلات Drag & Drop)
export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        const updateQuery = `
            UPDATE agent_leads SET stage = $1 WHERE id = $2 RETURNING *;
        `;
        
        const result = await pool.query(updateQuery, [data.stage, data.id]);

        return NextResponse.json({ success: true, lead: result.rows[0] }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error updating deal stage" }, { status: 500 });
    }
}