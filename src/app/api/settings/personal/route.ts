import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { pool } from "@/lib/db";
import nodemailer from "nodemailer";
import { createClient } from "@supabase/supabase-js";

// 📡 تهيئة عميل سوبابيز داخل السيرفر بصلاحيات السيرفر الكاملة
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

        // 🌟 التحديث الكلي والمعزول لقسم رفع الصورة الشخصية للـ Bucket 🌟
        // 🌟 التحديث الكلي والمعزول لقسم رفع الصورة الشخصية للـ Bucket 🌟
        if (action === "update_profile") {
            const { fullName, phoneNumber, image } = body;
            let finalImageUrl = image; // الاحتفاظ بالقيمة الافتراضية

            // الفحص الذكي: إذا كانت الصورة قادمة كـ Base64 نقوم بمعالجتها ورفعها للـ Bucket
            if (image && image.startsWith("data:image")) {
                try {
                    const mimeType = image.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
                    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
                    const buffer = Buffer.from(base64Data, "base64");
                    
                    const fileExt = mimeType.split("/")[1] || "jpg";
                    const fileName = `${userId}-${Date.now()}.${fileExt}`;
                    const filePath = `avatars/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from("avatars") 
                        .upload(filePath, buffer, {
                            contentType: mimeType,
                            upsert: true,
                        });

                    if (uploadError) {
                        console.error("Supabase Bucket Upload Error:", uploadError);
                        return NextResponse.json({ message: "Failed to upload image to storage" }, { status: 500 });
                    }

                    const { data: publicUrlData } = supabase.storage
                        .from("avatars")
                        .getPublicUrl(filePath);

                    finalImageUrl = publicUrlData.publicUrl;
                } catch (imgError) {
                    console.error("Image processing error:", imgError);
                    return NextResponse.json({ message: "Error processing profile image" }, { status: 500 });
                }
            }

            // تحديث الجدول الصافي برابط الـ Public URL
            await pool.query(
                `UPDATE "user" SET name = $1, phone_number = $2, image = $3 WHERE id = $4`,
                [fullName, phoneNumber, finalImageUrl, userId]
            );
            
            // 👈 التعديل هنا: نرسل الرابط النهائي للواجهة
            return NextResponse.json({ message: "Profile updated successfully", imageUrl: finalImageUrl });
        }

        // --- جميع الميزات السابقة والمسارات تعمل كما هي 100% دون أي تعديل أو خسارة كود ---
        if (action === "request_email_change") {
            const { newEmail } = body;
            if (!newEmail || newEmail === currentEmail) {
                return NextResponse.json({ message: "Invalid email" }, { status: 400 });
            }

            const otp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, $3, $4)`,
                [currentEmail, otp, 'old_email_verification', expiresAt]
            );

            await sendEmail(currentEmail, "Verify your email change", `Your OTP is: ${otp}`);
            return NextResponse.json({ message: "OTP sent to old email" });
        }

        if (action === "verify_old_email") {
            const { otp, newEmail } = body;

            const result = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'old_email_verification' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
                [currentEmail, otp]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            }

            await pool.query(`UPDATE "user" SET pending_email = $1 WHERE id = $2`, [newEmail, userId]);
            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [result.rows[0].id]);

            const newOtp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, $3, $4)`,
                [newEmail, newOtp, 'new_email_verification', expiresAt]
            );

            await sendEmail(newEmail, "Verify your new email", `Your OTP is: ${newOtp}`);
            return NextResponse.json({ message: "OTP verified. New OTP sent to new email" });
        }

        if (action === "resend_new_email_otp") {
            const userResult = await pool.query(`SELECT pending_email FROM "user" WHERE id = $1`, [userId]);
            const pending = userResult.rows[0]?.pending_email;
            if (!pending) return NextResponse.json({ message: "No pending email" }, { status: 400 });

            const newOtp = generateOTP();
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

            await pool.query(
                `INSERT INTO verification_codes (email, code, operation_type, expires_at) VALUES ($1, $2, $3, $4)`,
                [pending, newOtp, 'new_email_verification', expiresAt]
            );
            await sendEmail(pending, "Verify your new email", `Your OTP is: ${newOtp}`);
            return NextResponse.json({ message: "New OTP sent" });
        }

        if (action === "verify_new_email") {
            const { otp } = body;

            const userResult = await pool.query(`SELECT pending_email FROM "user" WHERE id = $1`, [userId]);
            const pending = userResult.rows[0]?.pending_email;

            if (!pending) return NextResponse.json({ message: "No pending email found" }, { status: 400 });

            const result = await pool.query(
                `SELECT * FROM verification_codes WHERE email = $1 AND code = $2 AND operation_type = 'new_email_verification' AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1`,
                [pending, otp]
            );

            if (result.rows.length === 0) {
                return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
            }

            await pool.query(`UPDATE "user" SET email = $1, pending_email = NULL WHERE id = $2`, [pending, userId]);
            await pool.query(`DELETE FROM verification_codes WHERE id = $1`, [result.rows[0].id]);

            return NextResponse.json({ message: "Email changed successfully" });
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });

    } catch (error) {
        console.error("Personal Route Error:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}