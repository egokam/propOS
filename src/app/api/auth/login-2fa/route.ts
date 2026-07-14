export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

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

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, email, password, otp } = body;

        // 📌 إعادة تفعيل الحماية فوراً بعد تجاوز الدخول بنجاح
        if (action === "restore_2fa") {
            await pool.query(
                `UPDATE "user" SET "twoFactorEnabled" = true 
                 WHERE email = $1 AND ("two_factor_type" = 'email' OR EXISTS (SELECT 1 FROM "twoFactor" WHERE "userId" = "user".id))`, 
                [email]
            );
            return NextResponse.json({ success: true });
        }

        const userRes = await pool.query(
            `SELECT u.id, u.name, u."twoFactorEnabled", u."two_factor_type", a.password 
             FROM "user" u 
             JOIN account a ON u.id = a."userId" 
             WHERE u.email = $1 AND a."providerId" = 'credential'`, 
            [email]
        );

        const user = userRes.rows[0];
        if (!user) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return NextResponse.json({ message: "Invalid credentials" }, { status: 400 });

        const isEmailEnabled = user.two_factor_type === 'email';
        const appRes = await pool.query(`SELECT id FROM "twoFactor" WHERE "userId" = $1`, [user.id]);
        const isAppEnabled = appRes.rows.length > 0;

        // نظام المعالجة الذاتية (لإصلاح قاعدة البيانات إن اختلت)
        if (action === "check") {
            if ((isEmailEnabled || isAppEnabled) && user.twoFactorEnabled !== true) {
                await pool.query(`UPDATE "user" SET "twoFactorEnabled" = true WHERE id = $1`, [user.id]);
            } else if (!isEmailEnabled && !isAppEnabled && user.twoFactorEnabled === true) {
                await pool.query(`UPDATE "user" SET "twoFactorEnabled" = false WHERE id = $1`, [user.id]);
            }
            return NextResponse.json({ appEnabled: isAppEnabled, emailEnabled: isEmailEnabled });
        }

        if (action === "send_email") {
            if (!isEmailEnabled) return NextResponse.json({ message: "Email 2FA not enabled" }, { status: 400 });
            
            const code = generateOTP();
            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, 'login_2fa', NOW() + INTERVAL '15 minutes')`, 
                [email, code]
            );
            
            await transporter.sendMail({
                from: `"PropOS" <${process.env.BREVO_SENDER_EMAIL}>`,
                to: email,
                subject: "PropOS - Login Verification Code",
                html: `<div style="font-family: sans-serif; padding: 20px;"><h2>Secure Login</h2><p>Your login verification code is: <strong style="font-size: 24px; color: #02AFA9;">${code}</strong></p></div>`
            });
            return NextResponse.json({ message: "OTP sent" });
        }

        if (action === "verify_email") {
            const otpRes = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'login_2fa' AND expires_at > NOW()`, 
                [email, otp]
            );
            
            if (otpRes.rows.length === 0) return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });

            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [otpRes.rows[0].id]);

            // 🚀 السحر يبدأ هنا: نعطل الـ 2FA لجزء من الثانية للسماح للفرونت إند بإنشاء الجلسة الأصلية!
            await pool.query(`UPDATE "user" SET "twoFactorEnabled" = false WHERE id = $1`, [user.id]);

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}