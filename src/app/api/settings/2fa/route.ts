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

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const currentEmail = session.user.email;
        const body = await request.json();
        const { action, password, otp } = body;

        // 1. التحقق من كلمة المرور للحماية
        if (action === "request_email_2fa_setup" || action === "disable_email_2fa") {
            const userRes = await pool.query(`SELECT password FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`, [userId]);
            const hashedPassword = userRes.rows[0]?.password;
            
            if (!hashedPassword) return NextResponse.json({ message: "No password found" }, { status: 400 });
            
            const isMatch = await bcrypt.compare(password, hashedPassword);
            if (!isMatch) return NextResponse.json({ message: "Incorrect password" }, { status: 400 });
        }

        // 2. إرسال كود التفعيل للإيميل
        if (action === "request_email_2fa_setup") {
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
                        <h2>Two-Factor Authentication Setup</h2>
                        <p>Your verification code is: <strong style="font-size: 24px; color: #02AFA9;">${code}</strong></p>
                      </div>`
            });
            return NextResponse.json({ message: "OTP sent" });
        }

        // 3. التحقق من الكود المُدخل وتفعيل الخاصية
        if (action === "verify_email_2fa_setup") {
            const res = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'email_2fa_setup' AND expires_at > NOW()`, 
                [currentEmail, otp]
            );
            if (res.rows.length === 0) return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });

            await pool.query(`UPDATE "user" SET "twoFactorEnabled" = true, "two_factor_type" = 'email' WHERE id = $1`, [userId]);
            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [res.rows[0].id]);
            return NextResponse.json({ message: "Email 2FA enabled" });
        }

        // 4. تعطيل الخاصية
        if (action === "disable_email_2fa") {
            await pool.query(`UPDATE "user" SET "twoFactorEnabled" = false, "two_factor_type" = NULL WHERE id = $1`, [userId]);
            return NextResponse.json({ message: "Email 2FA disabled" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}