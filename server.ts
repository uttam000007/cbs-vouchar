import express from "express";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { createServer as createViteServer } from "vite";
import { sendOtpEmailViaSmtp } from "./src/lib/email";
import { DEFAULT_BRANDING, MOCK_VOUCHERS } from "./src/lib/initialData";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Parse env defaults from .env or .env.example
function loadEnvDefaults() {
  const envFiles = [".env", ".env.example"];
  for (const file of envFiles) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          
          const matchUser = trimmed.match(/^SMTP_USER=["']?([^"'\r\n]+)["']?/);
          if (matchUser && matchUser[1]) {
            process.env.SMTP_USER = matchUser[1];
          }
          const matchPass = trimmed.match(/^SMTP_PASS=["']?([^"'\r\n]+)["']?/);
          if (matchPass && matchPass[1]) {
            process.env.SMTP_PASS = matchPass[1];
          }
          const matchUrl = trimmed.match(/^VITE_SUPABASE_URL=["']?([^"'\r\n]+)["']?/);
          if (matchUrl && matchUrl[1]) {
            process.env.VITE_SUPABASE_URL = matchUrl[1];
          }
          const matchKey = trimmed.match(/^VITE_SUPABASE_ANON_KEY=["']?([^"'\r\n]+)["']?/);
          if (matchKey && matchKey[1]) {
            process.env.VITE_SUPABASE_ANON_KEY = matchKey[1];
          }
        }
      } catch (e) {
        // ignore
      }
    }
  }
}
loadEnvDefaults();

// SERVER-SIDE PERSISTENT JSON DATABASE FILE MANAGEMENT
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "database.json");

const DEFAULT_SYSTEM_USERS = [
  {
    id: "u-admin-1",
    user_id: "ADMIN-01",
    email: "admin@charbhairabi.edu.bd",
    full_name: "শংকর চন্দ্র (সুপার অ্যাডমিন)",
    role: "ADMIN",
    password: "123456",
    signature_url: "",
  },
  {
    id: "u-acc-2",
    user_id: "ACC-02",
    email: "uttamkumarb247@gmail.com",
    full_name: "দীলিপ স্যার (হিসাবরক্ষক)",
    role: "ACCOUNTANT",
    password: "123456",
    signature_url: "",
  },
  {
    id: "u-hm-3",
    user_id: "HM-03",
    email: "headmaster@charbhairabi.edu.bd",
    full_name: "মোঃ মজিবুর রহমান (প্রধান শিক্ষক)",
    role: "HEADMASTER",
    password: "123456",
    signature_url: "",
  },
];

function ensureDbFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      vouchers: MOCK_VOUCHERS,
      users: DEFAULT_SYSTEM_USERS,
      branding: DEFAULT_BRANDING,
      smtp: {
        smtpUser: process.env.SMTP_USER || "uttamkumarb247@gmail.com",
        smtpPass: process.env.SMTP_PASS || "",
      },
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
  }
}

function readDb() {
  ensureDbFile();
  try {
    const content = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(content);
    // Ensure SMTP defaults if missing
    if (!db.smtp || !db.smtp.smtpPass) {
      db.smtp = {
        smtpUser: db.smtp?.smtpUser || process.env.SMTP_USER || "uttamkumarb247@gmail.com",
        smtpPass: db.smtp?.smtpPass || process.env.SMTP_PASS || "iluelciwxelafevw",
      };
    }
    return db;
  } catch (err) {
    console.error("Error reading db file:", err);
    return {
      vouchers: MOCK_VOUCHERS,
      users: DEFAULT_SYSTEM_USERS,
      branding: DEFAULT_BRANDING,
      smtp: { smtpUser: process.env.SMTP_USER || "uttamkumarb247@gmail.com", smtpPass: process.env.SMTP_PASS || "" },
    };
  }
}

function writeDb(data: any) {
  ensureDbFile();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing db file:", err);
  }
}

// ------------------- VOUCHERS API -------------------
app.get("/api/db/vouchers", (req, res) => {
  const db = readDb();
  res.json(db.vouchers || []);
});

app.post("/api/db/vouchers", (req, res) => {
  const db = readDb();
  const voucher = req.body;
  if (!voucher || !voucher.id) {
    return res.status(400).json({ error: "Voucher payload invalid" });
  }

  if (!db.vouchers) db.vouchers = [];

  const existingIndex = db.vouchers.findIndex((v: any) => v.id === voucher.id);
  if (existingIndex >= 0) {
    db.vouchers[existingIndex] = {
      ...db.vouchers[existingIndex],
      ...voucher,
      updated_at: new Date().toISOString(),
    };
  } else {
    db.vouchers.unshift({
      ...voucher,
      created_at: voucher.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  writeDb(db);
  res.json({ success: true, vouchers: db.vouchers });
});

app.delete("/api/db/vouchers/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  if (db.vouchers) {
    db.vouchers = db.vouchers.filter((v: any) => v.id !== id);
  } else {
    db.vouchers = [];
  }
  writeDb(db);
  res.json({ success: true, vouchers: db.vouchers });
});

// ------------------- USERS API -------------------
app.get("/api/db/users", (req, res) => {
  const db = readDb();
  res.json(db.users || []);
});

app.post("/api/db/users", (req, res) => {
  const db = readDb();
  const userToSave = req.body;
  if (!userToSave || !userToSave.id) {
    return res.status(400).json({ error: "User payload invalid" });
  }

  if (!db.users) db.users = [];

  const existingIndex = db.users.findIndex((u: any) => u.id === userToSave.id);
  if (existingIndex >= 0) {
    db.users[existingIndex] = { ...db.users[existingIndex], ...userToSave };
  } else {
    db.users.push(userToSave);
  }

  writeDb(db);
  res.json({ success: true, users: db.users });
});

app.delete("/api/db/users/:id", (req, res) => {
  const db = readDb();
  const { id } = req.params;
  if (db.users) {
    db.users = db.users.filter((u: any) => u.id !== id);
  } else {
    db.users = [];
  }
  writeDb(db);
  res.json({ success: true, users: db.users });
});

// ------------------- BRANDING API -------------------
app.get("/api/db/branding", (req, res) => {
  const db = readDb();
  res.json(db.branding || DEFAULT_BRANDING);
});

app.post("/api/db/branding", (req, res) => {
  const db = readDb();
  db.branding = { ...db.branding, ...req.body };
  writeDb(db);
  res.json({ success: true, branding: db.branding });
});

// ------------------- SMTP API -------------------
app.get("/api/db/smtp", (req, res) => {
  const db = readDb();
  const user = db.smtp?.smtpUser || process.env.SMTP_USER || "uttamkumarb247@gmail.com";
  const pass = db.smtp?.smtpPass || process.env.SMTP_PASS || "iluelciwxelafevw";
  res.json({ smtpUser: user, smtpPass: pass });
});

app.post("/api/db/smtp", (req, res) => {
  const db = readDb();
  const { smtpUser, smtpPass } = req.body;
  const cleanUser = (smtpUser || "").trim();
  const cleanPass = (smtpPass || "").trim();

  db.smtp = {
    smtpUser: cleanUser,
    smtpPass: cleanPass,
  };
  process.env.SMTP_USER = cleanUser;
  process.env.SMTP_PASS = cleanPass;
  writeDb(db);

  try {
    const envPath = path.join(process.cwd(), ".env");
    let envContent = "";
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, "utf-8");
    }
    if (/^SMTP_USER=/m.test(envContent)) {
      envContent = envContent.replace(/^SMTP_USER=.*$/m, `SMTP_USER="${cleanUser}"`);
    } else {
      envContent += `\nSMTP_USER="${cleanUser}"`;
    }
    if (/^SMTP_PASS=/m.test(envContent)) {
      envContent = envContent.replace(/^SMTP_PASS=.*$/m, `SMTP_PASS="${cleanPass}"`);
    } else {
      envContent += `\nSMTP_PASS="${cleanPass}"`;
    }
    fs.writeFileSync(envPath, envContent, "utf-8");
  } catch (e) {
    console.warn("Error updating .env file:", e);
  }

  res.json({ success: true, smtp: db.smtp });
});

// API route to send OTP email via Gmail SMTP
app.post("/api/send-otp", async (req, res) => {
  try {
    const { email, otp, userName, customSmtpUser, customSmtpPass } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "ইমেইল এবং ওটিপি (OTP) প্রদান করা আবশ্যক।",
      });
    }

    const db = readDb();
    const effectiveSmtpUser = customSmtpUser || db.smtp?.smtpUser || process.env.SMTP_USER;
    const effectiveSmtpPass = customSmtpPass || db.smtp?.smtpPass || process.env.SMTP_PASS;

    const result = await sendOtpEmailViaSmtp({
      email,
      otp,
      userName,
      customSmtpUser: effectiveSmtpUser,
      customSmtpPass: effectiveSmtpPass,
    });

    return res.json(result);
  } catch (error: any) {
    console.error("Error sending email via SMTP:", error);
    return res.status(500).json({
      success: false,
      delivered: false,
      error: error.message || "ইমেইল প্রেরণে ব্যর্থ হয়েছে।",
    });
  }
});

// API route to test SMTP setup
app.post("/api/test-smtp", async (req, res) => {
  try {
    const { smtpUser, smtpPass } = req.body;
    if (!smtpUser || !smtpPass) {
      return res.status(400).json({ success: false, message: "জিমেইল ইমেইল ও অ্যাপ পাসওয়ার্ড প্রয়োজন।" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser.trim(),
        pass: smtpPass.trim().replace(/\s+/g, ""),
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    await transporter.verify();
    return res.json({ success: true, message: "Gmail SMTP কানেকশন সফলভাবে যাচাই করা হয়েছে!" });
  } catch (error: any) {
    let msg = error.message || "ভুল তথ্য";
    if (msg.includes("535") || msg.includes("Username and Password not accepted")) {
      msg = "লগইন ব্যর্থ (Error 535): গুগল ইমেইল বা অ্যাপ পাসওয়ার্ড সঠিক নয়। আপনার গুগল অ্যাকাউন্টে 2-Step Verification চালু করে ১৬ ডিজিটের App Password তৈরি করে সেটি প্রদান করুন (সাধারণ পাসওয়ার্ড কাজ করবে না)।";
    }
    return res.status(400).json({ success: false, message: "SMTP কানেকশন ব্যর্থ: " + msg });
  }
});

async function startServer() {
  // Vite middleware for development mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
