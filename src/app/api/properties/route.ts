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

        const propertyResult = await pool.query(
            `INSERT INTO properties (user_id, property_type, name, address, syndic_type, monthly_fee, amenities) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [
                userId, 
                data.property_type, 
                data.name, 
                data.address, 
                data.syndic_type, 
                data.monthly_fee, 
                data.amenities
            ]
        );

        const propertyId = propertyResult.rows[0].id;

        for (const blockData of data.blocks) {
            const blockResult = await pool.query(
                `INSERT INTO blocks (property_id, name) VALUES ($1, $2) RETURNING id`,
                [propertyId, blockData.name]
            );

            const blockId = blockResult.rows[0].id;
            const blockLetter = blockData.name.split(" ")[1] || "";

            for (let i = 0; i < blockData.apts; i++) {
                const aptNumber = `${blockLetter}${i + 1}`;
                await pool.query(
                    `INSERT INTO apartments (block_id, apartment_number, status) VALUES ($1, $2, $3)`,
                    [blockId, aptNumber, 'Available']
                );
            }
        }

        return NextResponse.json({ message: "Success" }, { status: 200 });

    } catch (error) {
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        
        if (!session) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const result = await pool.query(
            `SELECT * FROM properties WHERE user_id = $1`,
            [session.user.id]
        );
        
        return NextResponse.json(result.rows, { status: 200 });
        
    } catch (error) {
        return NextResponse.json({ message: "Error fetching properties" }, { status: 500 });
    }
}