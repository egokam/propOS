import { betterAuth } from "better-auth";
import nodemailer from "nodemailer";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { pool } from "./db"; 
import bcrypt from "bcryptjs"; // <-- استيراد مكتبة التشفير

// إعداد خادم Brevo SMTP
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false, 
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

export const auth = betterAuth({
  database: pool, 
  emailAndPassword: {
    enabled: true,
    // <-- توحيد التشفير بين التطبيق وإعداداتك المخصصة
    password: {
      hash: async (password) => {
        return await bcrypt.hash(password, 10);
      },
      verify: async ({ hash, password }) => {
        return await bcrypt.compare(password, hash);
      },
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          await transporter.sendMail({
            from: `"PropOS" <${process.env.BREVO_SENDER_EMAIL}>`,
            to: email,
            subject: "PropOS - Verification Code",
            html: `
              <div style="font-family: sans-serif; color: #333; padding: 20px;">
                <h2>Welcome to PropOS!</h2>
                <p>Your verification code is: <strong style="font-size: 24px; color: #000;">${otp}</strong></p>
                <p>Please enter this code to complete your verification.</p>
              </div>
            `,
          });
          console.log("OTP successfully sent to:", email);
        } catch (error) {
          console.error("Failed to send OTP via Brevo:", error);
        }
      }
    }),
    twoFactor({
      issuer: "PropOS", 
    })
  ]
});