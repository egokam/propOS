import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) return NextResponse.json({ message: "Missing ID" }, { status: 400 });

        const propertyResult = await pool.query(`SELECT * FROM properties WHERE id = $1 AND user_id = $2`, [id, session.user.id]);
        if (propertyResult.rows.length === 0) return NextResponse.json({ message: "Not found" }, { status: 404 });

        const aptsResult = await pool.query(`
            SELECT a.*, b.name as block_name 
            FROM apartments a 
            JOIN blocks b ON a.block_id = b.id 
            WHERE b.property_id = $1
            ORDER BY b.name, LENGTH(a.apartment_number), a.apartment_number
        `, [id]);

        return NextResponse.json({
            property: propertyResult.rows[0],
            apartments: aptsResult.rows
        }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const data = await request.json();
        
        if (data.action === "toggle_status") {
            await pool.query(`UPDATE apartments SET status = $1 WHERE id = $2`, [data.status, data.id]);
        } else if (data.action === "update_details") {
            await pool.query(
                `UPDATE apartments SET owner_name = $1, phone = $2, email = $3, floor = $4 WHERE id = $5`,
                [data.owner_name, data.phone, data.email, data.floor, data.id]
            );
        }
        
        return NextResponse.json({ message: "Success" }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}