import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import execute from "@/components/lib/database/db";

const SECRET_KEY: string = process.env.JWT_SECRET as string;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { email, password } = req.body;
  console.log(email, "email", password, "password");

  const query = `SELECT * FROM users WHERE email = ?;`;
  const values: string[] = [email];

  const users = await execute({ query, values });

  console.log(users);

  if (users.length < 1) {
    return res.status(401).json({ message: "Invalid email or password" });
  }
  const user = users[0];

  console.log(user);

  const isPasswordValid = bcrypt.compareSync(password, user.password);

  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const token = jwt.sign({ email: user.email }, SECRET_KEY, {
    expiresIn: "365d",
  });

  res.status(200).json({
    token,
    user: { userId: user.id, name: user.name, email: user.email },
  });
}
