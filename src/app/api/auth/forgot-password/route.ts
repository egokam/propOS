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
        const { action, email, otp, newPassword } = await request.json();

        // Step 1: Request OTP
        if (action === "send_otp") {
            // Check if user exists
            const userRes = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [email]);
            if (userRes.rows.length === 0) {
                // Return success even if email doesn't exist to prevent email enumeration attacks
                return NextResponse.json({ message: "If the email exists, an OTP was sent." });
            }

            const code = generateOTP();
            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, 'password_reset', NOW() + INTERVAL '15 minutes')`, 
                [email, code]
            );
            
            await transporter.sendMail({
                from: `"PropOS" <${process.env.BREVO_SENDER_EMAIL}>`,
                to: email,
                subject: "PropOS - Password Reset Code",
                html: `<div style="font-family: sans-serif; padding: 20px;">
                        <h2>Password Reset Request</h2>
                        <p>Your password reset code is: <strong style="font-size: 24px; color: #02AFA9;">${code}</strong></p>
                        <p>If you didn't request this, you can safely ignore this email.</p>
                      </div>`
            });
            return NextResponse.json({ message: "OTP sent" });
        }

        // Step 2: Verify OTP
        if (action === "verify_otp") {
            const res = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'password_reset' AND expires_at > NOW()`, 
                [email, otp]
            );
            
            if (res.rows.length === 0) return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            return NextResponse.json({ success: true });
        }

        // Step 3: Reset Password
        if (action === "reset_password") {
            // Verify OTP again just to be safe before changing the password
            const res = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'password_reset' AND expires_at > NOW()`, 
                [email, otp]
            );
            
            if (res.rows.length === 0) return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });

            const userRes = await pool.query(`SELECT id FROM "user" WHERE email = $1`, [email]);
            if (userRes.rows.length === 0) return NextResponse.json({ message: "User not found" }, { status: 404 });

            const userId = userRes.rows[0].id;
            const hashedPassword = await bcrypt.hash(newPassword, 10); // Hash the new password

            // Update password in the account table
            await pool.query(
                `UPDATE account SET password = $1 WHERE "userId" = $2 AND "providerId" = 'credential'`,
                [hashedPassword, userId]
            );

            // Delete the used OTP
            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [res.rows[0].id]);

            return NextResponse.json({ message: "Password updated successfully" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}