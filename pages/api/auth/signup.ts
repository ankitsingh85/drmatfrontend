// pages/api/signup.ts

import bcrypt from "bcryptjs";
import execute from "@/components/lib/database/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { name, email, password, admin } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const query =
    "INSERT INTO users (name, email, password, admin) VALUES (?, ?, ?, ?);";
  const values = [name, email.toLowerCase(), hashedPassword, admin];

  const result = await execute({ query, values });

  if ((result[0] = "Error Occured")) {
    console.error("Error registering user:");
    return res.status(500).json({ message: "Internal server error" });
  }
  return res.status(201).json({
    message: "User registered successfully",
    user: { email },
  });
}
