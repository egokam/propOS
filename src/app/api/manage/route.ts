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

        // تحديد الشهر الحالي لجلبه من قاعدة البيانات (يتطابق مع ما تراه في الواجهة)
        const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        // جلب قائمة الملاك الذين دفعوا في هذا المجمع السكني خلال هذا الشهر
        const paymentsResult = await pool.query(
            `SELECT owner_name FROM payments WHERE property_id = $1 AND month = $2`, 
            [id, currentMonthLabel]
        );
        
        // تحويل أسماء الدافعين إلى Set للبحث السريع
        const paidOwners = new Set(paymentsResult.rows.map(r => r.owner_name));

        // حقن حالة الدفع is_paid مباشرة في بيانات الشقق لكي تفهمها الواجهة الأمامية بسلاسة
        const apartmentsWithPaymentStatus = aptsResult.rows.map(apt => ({
            ...apt,
            is_paid: paidOwners.has(apt.owner_name)
        }));

        return NextResponse.json({
            property: propertyResult.rows[0],
            apartments: apartmentsWithPaymentStatus
        }, { status: 200 });

    } catch (error) {
        console.error(error);
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
            
        } else if (data.action === "toggle_owner_payment") {
            // السحر يحدث هنا! الإضافة والحذف من جدول الـ payments بناءً على الضغطة
            if (data.is_paid) {
                await pool.query(
                    `INSERT INTO payments (property_id, owner_name, month, amount) 
                     VALUES ($1, $2, $3, $4) 
                     ON CONFLICT (property_id, owner_name, month) DO NOTHING`,
                    [data.property_id, data.owner_name, data.month, data.total_amount]
                );
            } else {
                await pool.query(
                    `DELETE FROM payments WHERE property_id = $1 AND owner_name = $2 AND month = $3`,
                    [data.property_id, data.owner_name, data.month]
                );
            }
            
        } else if (data.action === "update_fee") {
            await pool.query(
                `UPDATE properties SET monthly_fee = $1 WHERE id = $2 AND user_id = $3`,
                [data.monthly_fee, data.id, session.user.id]
            );
        }
        
        return NextResponse.json({ message: "Success" }, { status: 200 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error" }, { status: 500 });
    }
}