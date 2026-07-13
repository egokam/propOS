import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json();
  const { property_type, address, latitude, longitude } = body;

  try {
    // استخدم pool.query بدلاً من pool.connect للحماية من تسريب الاتصالات
    const result = await pool.query(
      `INSERT INTO properties (id, user_id, property_type, address, latitude, longitude, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [session.user.id, property_type, address, latitude, longitude]
    );

    return new Response(JSON.stringify(result.rows[0]), { status: 201 });
  } catch (error) {
    console.error("Database Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}