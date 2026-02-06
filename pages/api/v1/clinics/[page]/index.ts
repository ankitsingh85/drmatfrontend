import type { NextApiRequest, NextApiResponse } from "next";

import execute from "@/components/lib/database/db";
import verifyToken from "@/components/lib/auth/verifyToken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", data: null });
  }

  // const token = req.headers?.authorization?.substring(7) as string;

  // if (!verifyToken(token)) {
  //   return res.status(401).json({ message: "Not Authorized", data: null });
  // }

  const page = parseInt(req.query.page as string);

  const { latitude, longitude } = req.query;

  if (!latitude || !longitude) {
    const query = `SELECT id, name, description, address, latitude, longitude, rating FROM clinics ORDER BY id DESC LIMIT 20 OFFSET ${
      20 * (page - 1)
    } ;`;

    const values: string[] = [];
    const result = await execute({ query, values });

    const countQuery = `SELECT COUNT(*) AS results FROM \`clinics\` ;`;
    const countValues: string[] = [];
    const count = await execute({ query: countQuery, values: countValues });

    const pages = Math.ceil(count[0].results / 20);

    return res
      .status(200)
      .json({ message: "Success", data: { list: result, pages } });
  }

  const query = `
      SELECT 
        id, 
        name, 
        description, 
        address, 
        latitude, 
        longitude, 
        rating, 
        (
          6371 * acos(
            cos(radians(?)) * cos(radians(latitude)) * 
            cos(radians(longitude) - radians(?)) + 
            sin(radians(?)) * sin(radians(latitude))
          )
        ) AS distance
      FROM clinics
      ORDER BY distance LIMIT 20 OFFSET ${20 * (page - 1)} ;
    `;

  const values: any[] = [latitude, longitude, latitude];
  const result = await execute({ query, values });

  const countQuery = `SELECT COUNT(*) AS results FROM clinics;`;
  const countValues: any[] = [];
  const count = await execute({ query: countQuery, values: countValues });

  const pages = Math.ceil(count[0].results / 20);

  res.status(200).json({ data: { list: result, pages } });
}
