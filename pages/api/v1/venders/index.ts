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
    const { name, address, head } = req.body;

    if (!name || !address || !head) {
      return res.status(400).json({ message: "provide details" });
    }

    try {
      const query = `INSERT INTO vendors (name, address, head)
      VALUES ( ?, ?, ?);`;
      const values: any[] = [name, address, head];

      const result: any = await execute({ query, values });
      return res.status(201).json({
        message: "Vendor successfully",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.body;

    if (!id) {
      res.status(400).json({ message: "Vendor id not provided" });
    }
    try {
      const query = "DELETE FROM vendors WHERE id = ?;";
      const values = [id];
      const result = await execute({ query, values });
      return res.status(200).json({ message: "Vendor deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(400).json({ message: "Invalid request" });
};
