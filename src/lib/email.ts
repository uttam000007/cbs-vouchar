import nodemailer from 'nodemailer';

export interface SendOtpEmailParams {
  email: string;
  otp: string;
  userName?: string;
  customSmtpUser?: string;
  customSmtpPass?: string;
}

export interface SendEmailResult {
  success: boolean;
  delivered: boolean;
  simulated?: boolean;
  recipient: string;
  otpCode?: string;
  message: string;
  error?: string;
}

/**
 * Backend service function that utilizes environment variables SMTP_USER and SMTP_PASS
 * to send transactional OTP emails for account verification and password reset.
 */
export async function sendOtpEmailViaSmtp(params: SendOtpEmailParams): Promise<SendEmailResult> {
  const { email, otp, userName, customSmtpUser, customSmtpPass } = params;

  if (!email || !otp) {
    throw new Error("ইমেইল এবং ওটিপি (OTP) প্রদান করা আবশ্যক।");
  }

  // Utilize environment variables SMTP_USER and SMTP_PASS (with fallback to optional custom user override)
  const smtpUser = customSmtpUser || process.env.SMTP_USER;
  const smtpPass = customSmtpPass || process.env.SMTP_PASS;

  // Check if Gmail SMTP credentials exist
  if (smtpUser && smtpPass && smtpUser.trim() !== "" && smtpPass.trim() !== "") {
    const cleanPass = smtpPass.trim().replace(/\s+/g, "");
    const cleanUser = smtpUser.trim();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: cleanUser,
        pass: cleanPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"চরভৈরবী উচ্চ বিদ্যালয়" <${cleanUser}>`,
      to: email.trim(),
      subject: "পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড (OTP) - চরভৈরবী উচ্চ বিদ্যালয়",
      html: `
        <div style="font-family: 'SolaimanLipi', Arial, sans-serif; max-width: 560px; margin: 0 auto; background-color: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 24px; color: #f8fafc;">
          <div style="text-align: center; border-bottom: 1px solid #1e293b; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="color: #10b981; margin: 0 0 6px 0; font-size: 20px;">চরভৈরবী উচ্চ বিদ্যালয়</h2>
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">হাইমচর, চাঁদপুর - একাউন্ট নিরাপত্তা পরিষেবা</p>
          </div>
          
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            প্রিয় <strong>${userName || "ব্যবহারকারী"}</strong>,
          </p>
          <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
            আপনার অ্যাকাউন্ট (<strong>${email}</strong>)-এর পাসওয়ার্ড রিসেট করার জন্য অনুরোধ গ্রহণ করা হয়েছে। আপনার সিকিউরিটি ভেরিফিকেশন কোডটি নিচে প্রদান করা হলো:
          </p>

          <div style="background-color: #020617; border: 2px dashed #059669; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0;">
            <span style="font-size: 12px; color: #f59e0b; display: block; margin-bottom: 6px; font-weight: bold;">আপনার ৬ ডিজিটের ওটিপি কোড (OTP):</span>
            <span style="font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #34d399;">${otp}</span>
          </div>

          <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
            ⚠️ নিরাপত্তা সতর্কতা: এই কোডটি কারো সাথে শেয়ার করবেন না। আপনি যদি এই অনুরোধটি না করে থাকেন, তবে বার্তাটি উপেক্ষা করুন।
          </p>

          <div style="border-t: 1px solid #1e293b; margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
            © ২০২৬ চরভৈরবী উচ্চ বিদ্যালয় সফটওয়্যার সিস্টেম।
          </div>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);

      return {
        success: true,
        delivered: true,
        recipient: email,
        message: `জি-মেইল (Gmail SMTP) এর মাধ্যমে ${email} ঠিকানায় আসল ইমেইল সফলভাবে পাঠানো হয়েছে!`,
      };
    } catch (err: any) {
      if (err?.message?.includes('535') || err?.message?.includes('Username and Password not accepted')) {
        throw new Error("গুগল জিমেইল লগইন ব্যর্থ হয়েছে (Error 535)। সাধারণ জিমেইল পাসওয়ার্ড কাজ করে না; আপনার গুগল অ্যাকাউন্টে 2-Step Verification চালু করে একটি ১৬ ডিজিটের App Password তৈরি করে প্রবেশ করান।");
      }
      throw err;
    }
  } else {
    // If SMTP credentials are missing, return fallback response
    return {
      success: true,
      delivered: false,
      simulated: true,
      recipient: email,
      message: "Gmail App Password কনফিগার করা না থাকায় ইমেইল পাঠানো যায়নি। অ্যাডমিন প্যানেল থেকে SMTP কনফিগার করুন।",
    };
  }
}
