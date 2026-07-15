export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        const userId = session.user.id;

        // 1. إنشاء العقار الأساسي
        const insertWorkspaceQuery = `
            INSERT INTO properties (user_id, property_type, name, address)
            VALUES ($1, $2, $3, $4)
            RETURNING id;
        `;
        
        const workspaceResult = await pool.query(insertWorkspaceQuery, [
            userId,
            data.property_type || 'Commercial Agent',
            data.name,
            data.address
        ]);

        const newWorkspaceId = workspaceResult.rows[0].id;

        // 2. حفظ تفاصيل الوكالة (العمولة، الفروع، التخصصات) في الجدول المخصص
        const insertSettingsQuery = `
            INSERT INTO commercial_settings 
            (property_id, agency_type, default_commission_rate, focus_sales, focus_rentals, focus_commercial, branches_data)
            VALUES ($1, $2, $3, $4, $5, $6, $7);
        `;

        await pool.query(insertSettingsQuery, [
            newWorkspaceId,
            data.agency_type,
            data.commission_rate,
            data.focus_areas.sales,
            data.focus_areas.rentals,
            data.focus_areas.commercial,
            JSON.stringify(data.branches) // تحويل مصفوفة الفروع إلى نص JSON
        ]);

        return NextResponse.json({ success: true, id: newWorkspaceId }, { status: 200 });

    } catch (error) {
        console.error("Commercial CRM Setup Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}