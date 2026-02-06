import type { NextApiRequest, NextApiResponse } from "next";

import execute from "@/components/lib/database/db";
import verifyToken from "@/components/lib/auth/verifyToken";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed", data: null });
  }

  // const token = req.headers?.authorization?.substring(7) as string;

  // if (!verifyToken(token)) {
  //   return res.status(401).json({ message: "Not Authorized", data: null });
  // }

  const page = parseInt(req.body.page as string, 10) || 1;
  const { minPrice = 0, maxPrice = Infinity, searchText = "" } = req.body;

  if (
    typeof page !== "number" ||
    typeof minPrice !== "number" ||
    typeof maxPrice !== "number" ||
    typeof searchText !== "string"
  ) {
    return res.status(400).json({ message: "Invalid input", data: null });
  }

  const priceCondition = `price BETWEEN ? AND ?`;
  const nameCondition = searchText ? `AND name LIKE ?` : "";

  const query = `
    SELECT id, name, price, description 
    FROM services 
    WHERE ${priceCondition} ${nameCondition}
    ORDER BY id DESC 
    LIMIT 20 OFFSET ${20 * (page - 1)};
  `;

  const values: (number | string)[] = [minPrice, maxPrice];
  if (searchText) {
    values.push(`%${searchText}%`);
  }

  const result = await execute({ query, values });

  const countQuery = `
    SELECT COUNT(*) AS results 
    FROM \`services\` 
    WHERE ${priceCondition} ${nameCondition};
  `;
  const countValues: (number | string)[] = [minPrice, maxPrice];
  if (searchText) {
    countValues.push(`%${searchText}%`);
  }

  const count = await execute({ query: countQuery, values: countValues });

  const pages = Math.ceil(count[0].results / 20);

  res.status(200).json({ message: "Success", data: { list: result, pages } });
}
