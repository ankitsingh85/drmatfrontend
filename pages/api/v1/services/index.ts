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
    const { name, price, description } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ message: "provide details" });
    }

    try {
      const query = `INSERT INTO services (name, price, description)
      VALUES ( ?, ?, ?);`;
      const values: any[] = [name, price, description];

      const result: any = await execute({ query, values });
      return res.status(201).json({
        message: "Service successfully",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.body;

    if (!id) {
      res.status(400).json({ message: "Services id not provided" });
    }
    try {
      const query = "DELETE FROM services WHERE id = ?;";
      const values = [id];
      const result = await execute({ query, values });
      return res.status(200).json({ message: "Service deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(400).json({ message: "Invalid request" });
};
