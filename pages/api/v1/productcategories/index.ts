import verifyToken from "@/components/lib/auth/verifyToken";
import execute from "@/components/lib/database/db";
import { NextApiRequest, NextApiResponse } from "next";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const token = req.headers?.authorization?.substring(7) as string;

  //get Malfunction

  if (req.method === "GET") {
    try {
      const query = `SELECT * FROM categories;`;
      const values: any[] = [];

      const result: any = await execute({ query, values });
      return res.status(201).json({
        message: "success",
        data: result,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (!verifyToken(token)) {
    return res.status(401).json({ message: "Not Authorized" });
  }
  // const malfunction
  if (req.method === "POST") {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({ message: "provide details" });
    }

    try {
      const query = `INSERT INTO categories (name, description)
      VALUES ( ?, ?);`;
      const values: any[] = [name, description];

      const result: any = await execute({ query, values });
      return res.status(201).json({
        message: "Category successfully",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "DELETE") {
    const id = req.body;

    if (!id) {
      res.status(400).json({ message: "Category id not provided" });
    }
    try {
      const query = "DELETE FROM categories WHERE id = ?;";
      const values = [id];
      const result = await execute({ query, values });
      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(400).json({ message: "Invalid request" });
};
