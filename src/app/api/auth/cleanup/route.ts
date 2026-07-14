import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    // هذا الكود يحذف الجلسات المنتهية الصلاحية فقط
    await pool.query(`DELETE FROM "session" WHERE "expiresAt" < NOW()`);
    return NextResponse.json({ message: "Sessions cleaned" });
}