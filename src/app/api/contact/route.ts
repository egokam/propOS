export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import nodemailer from "nodemailer";

// إعداد مرسل الإيميلات باستخدام حساب Brevo الخاص بك
const transporter = nodemailer.createTransport({
    host: "smtp-relay.brevo.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.BREVO_SMTP_USER,
        pass: process.env.BREVO_SMTP_PASS,
    },
});

export async function POST(request: Request) {
    try {
        // التحقق من أن المستخدم مسجل الدخول
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

        // استلام البيانات من النموذج
        const { subject, message } = await request.json();
        
        const senderName = session.user.name || "User";
        const senderEmail = session.user.email || "No Email";
        
        // 👈 إيميلك الجديد الذي قمت بإنشائه لاستقبال الرسائل
        const YOUR_RECEIVING_EMAIL = "contact@egokam.site";

        // إرسال الإيميل فعلياً
        await transporter.sendMail({
            from: `"PropOS Contact" <${process.env.BREVO_SENDER_EMAIL}>`, // يجب أن يكون الإيميل الموثق في Brevo
            replyTo: `"${senderName}" <${senderEmail}>`, // السحر هنا: عند الضغط على "رد" في إيميلك، سيرد مباشرة على المستخدم!
            to: YOUR_RECEIVING_EMAIL,
            subject: `[PropOS Support] ${subject}`,
            html: `
                <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #02AFA9; margin-top: 0;">New Message from PropOS</h2>
                    <p><strong>From:</strong> ${senderName} (<a href="mailto:${senderEmail}">${senderEmail}</a>)</p>
                    <p><strong>Subject:</strong> ${subject}</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                    <p style="white-space: pre-wrap; color: #333; line-height: 1.6; font-size: 15px;">${message}</p>
                </div>
            `
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Contact Form Error:", error);
        return NextResponse.json({ message: "Failed to send message" }, { status: 500 });
    }
}