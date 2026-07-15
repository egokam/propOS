export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

// جلب العروض من قاعدة البيانات
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const propertyId = searchParams.get("propertyId");
        
        if (!propertyId) {
            return NextResponse.json({ message: "Property ID is required" }, { status: 400 });
        }

        const result = await pool.query(
            `SELECT * FROM agent_listings WHERE property_id = $1 ORDER BY created_at DESC`,
            [propertyId]
        );

        return NextResponse.json({ listings: result.rows }, { status: 200 });
    } catch (error) {
        console.error("Fetch listings error:", error);
        return NextResponse.json({ message: "Error fetching listings" }, { status: 500 });
    }
}

// إضافة عرض جديد إلى قاعدة البيانات
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await request.json();
        
        const insertQuery = `
            INSERT INTO agent_listings (property_id, title, price, listing_type, status, area_sqm, location, images, keywords, property_category, features)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        
        const result = await pool.query(insertQuery, [
            data.propertyId,
            data.title,
            data.price,
            data.listing_type,
            'Available',
            data.surface_m2, // الواجهة ترسل surface_m2 ونحن نخزنها في area_sqm
            data.location,
            data.images || [],
            data.keywords || [],
            data.property_category || 'Apartment',
            data.features || {}
        ]);

        return NextResponse.json({ success: true, listing: result.rows[0] }, { status: 200 });
    } catch (error) {
        console.error("Add listing error:", error);
        return NextResponse.json({ message: "Error adding listing" }, { status: 500 });
    }
}
export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        const updateQuery = `
            UPDATE agent_listings 
            SET status = $1 
            WHERE id = $2 
            RETURNING *;
        `;
        
        const result = await pool.query(updateQuery, [data.status, data.id]);

        return NextResponse.json({ success: true, listing: result.rows[0] }, { status: 200 });
    } catch (error) {
        console.error("Update status error:", error);
        return NextResponse.json({ message: "Error updating status" }, { status: 500 });
    }
}