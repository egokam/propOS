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

async function sendEmail(to: string, subject: string, text: string) {
    await transporter.sendMail({
        from: `"PropOS" <${process.env.BREVO_SENDER_EMAIL}>`,
        to,
        subject,
        text,
    });
}

export async function POST(request: Request) {
    try {
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        const userId = session.user.id;
        const currentEmail = session.user.email;
        const body = await request.json();
        const { action } = body;

        if (action === "request_forgot_password") {
            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, $3, $4)`,
                [currentEmail, otp, 'password_reset', expiresAt]
            );

            await sendEmail(currentEmail, "Password Reset Request", `Your verification code is: ${otp}`);
            return NextResponse.json({ message: "OTP sent" });
        }

        if (action === "verify_forgot_password") {
            const { otp } = body;
            const result = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
                [currentEmail, otp]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            }
            return NextResponse.json({ message: "OTP verified" });
        }

        if (action === "reset_password") {
            const { otp, newPassword } = body;
            
            const result = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'password_reset' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
                [currentEmail, otp]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            await pool.query(
                `UPDATE account SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [hashedPassword, userId]
            );

            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [result.rows[0].id]);

            return NextResponse.json({ message: "Password updated successfully" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}