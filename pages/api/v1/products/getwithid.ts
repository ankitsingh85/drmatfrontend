import verifyToken from "@/components/lib/auth/verifyToken";
import execute from "@/components/lib/database/db";
import { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  //   const token = req.headers?.authorization?.substring(7) as string;

  //   if (!verifyToken(token)) {
  //     return res.status(401).json({ message: "Not Authorized" });
  //   }

  if (req.method == "GET") {
    const { id } = req.query;

    if (!id) {
      return res.status(500).json({ message: "provide details" });
    }

    try {
      const query = "SELECT * FROM products WHERE id = ? ;";
      const values = [id];
      const result = await execute({ query, values });

      return res.status(200).json({ message: "Success", result });
    } catch (error) {
      console.error(error);

      return res.status(500).json({ message: "provide details" });
    }
  }

  // const malfunction
  return res.status(400).json({ message: "Invalid request" });
};
