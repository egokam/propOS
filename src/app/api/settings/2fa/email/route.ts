export const dynamic = "force-dynamic"; // 💣 يمنع التخزين المؤقت (Cache)

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";

const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 🛡️ دالة GET معزولة للإيميل فقط
export async function GET(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ isEnabled: false }, { status: 401 });

        const res = await pool.query(
            `SELECT "two_factor_type" FROM "user" WHERE id = $1`, 
            [session.user.id]
        );
        
        // إذا كان نوع الـ 2FA هو إيميل، فهو مفعل
        const isEnabled = res.rows[0]?.two_factor_type === 'email';
        
        return NextResponse.json({ isEnabled });
    } catch (error) {
        console.error("Email 2FA Check Error:", error);
        return NextResponse.json({ isEnabled: false }, { status: 500 });
    }
}

// 🛡️ دالة POST لعمليات الإيميل فقط
export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const currentEmail = session.user.email;
        const { action, password, otp } = await request.json();

        // 1. التحقق من كلمة المرور (للحماية)
        if (action === "request_setup" || action === "disable") {
            const userRes = await pool.query(`SELECT password FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`, [userId]);
            const hashedPassword = userRes.rows[0]?.password;
            if (!hashedPassword) return NextResponse.json({ message: "No password found" }, { status: 400 });
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (!isMatch) return NextResponse.json({ message: "Incorrect password" }, { status: 400 });
        }

        // 2. طلب التفعيل (إرسال OTP للإيميل)
        if (action === "request_setup") {
            const code = generateOTP();
            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, 'email_2fa_setup', NOW() + INTERVAL '15 minutes')`, 
                [currentEmail, code]
            );
            await transporter.sendMail({
                from: `"PropOS" <${process.env.BREVO_SENDER_EMAIL}>`,
                to: currentEmail,
                subject: "PropOS - 2FA Setup Code",
                html: `<div style="font-family: sans-serif; padding: 20px;">
                        <h2>Email 2FA Setup</h2>
                        <p>Your verification code is: <strong style="font-size: 24px; color: #02AFA9;">${code}</strong></p>
                      </div>`
            });
            return NextResponse.json({ message: "OTP sent" });
        }

        // 3. تأكيد التفعيل
        if (action === "verify_setup") {
            const res = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'email_2fa_setup' AND expires_at > NOW()`, 
                [currentEmail, otp]
            );
            if (res.rows.length === 0) return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });

            // نفعل الـ 2FA ونحدد النوع كـ email
            await pool.query(`UPDATE "user" SET "twoFactorEnabled" = true, "two_factor_type" = 'email' WHERE id = $1`, [userId]);
            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [res.rows[0].id]);
            return NextResponse.json({ message: "Email 2FA enabled" });
        }

        // 4. تعطيل الإيميل (مع حماية التطبيق إذا كان مفعلاً)
        if (action === "disable") {
            const appRes = await pool.query(`SELECT "twoFactorSecret", "two_factor_secret" FROM "user" WHERE id = $1`, [userId]);
            const hasAppAuth = !!appRes.rows[0]?.twoFactorSecret || !!appRes.rows[0]?.two_factor_secret;
            
            if (hasAppAuth) {
                // إذا كان التطبيق مفعلاً، نحذف علامة الإيميل فقط
                await pool.query(`UPDATE "user" SET "two_factor_type" = NULL WHERE id = $1`, [userId]);
            } else {
                // إذا لم يكن هناك تطبيق مفعل، نلغي الـ 2FA بالكامل
                await pool.query(`UPDATE "user" SET "twoFactorEnabled" = false, "two_factor_type" = NULL WHERE id = $1`, [userId]);
            }
            return NextResponse.json({ message: "Email 2FA disabled" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Email 2FA POST Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}