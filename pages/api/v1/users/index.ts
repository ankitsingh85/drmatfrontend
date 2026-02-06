import verifyToken from "@/components/lib/auth/verifyToken";
import execute from "@/components/lib/database/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.headers?.authorization?.substring(7) as string;

  if (!verifyToken(token)) {
    return res.status(401).json({ message: "Not Authorized" });
  }

  //get Malfunction

  if (req.method === "GET") {
    return res.status(500).json({ message: "Method not allowed" });
  }

  // const malfunction
  if (req.method === "POST") {
    const user = req.body;

    if (!user) {
      return res.status(400).json({ message: "User not provided" });
    }

    try {
      const query = `UPDATE users
      SET
      username = "${user.email}",
      admin = ${user.admin}
      WHERE id = ${user.id};`;
      const values: string[] = [];

      const result: any = await execute({ query, values });
      return res.status(201).json({
        message: "User Updated successfully",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.body;

    if (!id) {
      res.status(400).json({ message: "User id not provided" });
    }
    try {
      const query = "DELETE FROM users WHERE id = ?;";
      const values = [id];
      const result = await execute({ query, values });
      return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(400).json({ message: "Invalid request" });
};
