// import type { NextApiRequest, NextApiResponse } from "next";

// import execute from "@/components/lib/database/db";
// import verifyToken from "@/components/lib/auth/verifyToken";

// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   if (req.method !== "POST") {
//     return res.status(405).json({ message: "Method Not Allowed", data: null });
//   }

//   // const token = req.headers?.authorization?.substring(7) as string;

//   // if (!verifyToken(token)) {
//   //   return res.status(401).json({ message: "Not Authorized", data: null });
//   // }

//   const page = parseInt(req.body.page as string, 10) || 1;
//   const { minPrice = 0, maxPrice = Infinity, searchText = "" } = req.body;

//   if (
//     typeof page !== "number" ||
//     typeof minPrice !== "number" ||
//     typeof maxPrice !== "number" ||
//     typeof searchText !== "string"
//   ) {
//     return res.status(400).json({ message: "Invalid input", data: null });
//   }

//   const priceCondition = `price BETWEEN ? AND ?`;
//   const nameCondition = searchText ? `AND name LIKE ?` : "";

//   const query = `
//     SELECT *
//     FROM products
//     WHERE ${priceCondition} ${nameCondition}
//     ORDER BY id DESC
//     LIMIT 20 OFFSET ${20 * (page - 1)};
//   `;

//   const values: (number | string)[] = [minPrice, maxPrice];
//   if (searchText) {
//     values.push(`%${searchText}%`);
//   }

//   const result = await execute({ query, values });

//   const countQuery = `
//     SELECT COUNT(*) AS results
//     FROM \`products\`
//     WHERE ${priceCondition} ${nameCondition};
//   `;
//   const countValues: (number | string)[] = [minPrice, maxPrice];
//   if (searchText) {
//     countValues.push(`%${searchText}%`);
//   }

//   const count = await execute({ query: countQuery, values: countValues });

//   const pages = Math.ceil(count[0].results / 20);

//   res.status(200).json({ message: "Success", data: { list: result, pages } });
// }
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
  const {
    minPrice = 0,
    maxPrice = Infinity,
    searchText = "",
    categoryValue = "",
  } = req.body;

  if (
    typeof page !== "number" ||
    typeof minPrice !== "number" ||
    typeof maxPrice !== "number" ||
    typeof searchText !== "string" ||
    typeof categoryValue !== "string"
  ) {
    return res.status(400).json({ message: "Invalid input", data: null });
  }

  const priceCondition = `p.price BETWEEN ? AND ?`;
  const nameCondition = searchText ? `AND p.name LIKE ?` : "";
  const categoryCondition = categoryValue
    ? `AND (cat.name LIKE ? OR cat.description LIKE ?)`
    : "";

  const query = `
    SELECT 
      p.*, 
      GROUP_CONCAT(cat.name) AS categories,
      GROUP_CONCAT(cat.id) AS categoriesid
    FROM products p
    LEFT JOIN categorytoproduct ctp ON p.id = ctp.productid
    LEFT JOIN categories cat ON ctp.categoryid = cat.id
    WHERE ${priceCondition} ${nameCondition} ${categoryCondition}
    GROUP BY p.id
    ORDER BY p.id DESC  
    LIMIT 20 OFFSET ${20 * (page - 1)};
  `;

  const values: (number | string)[] = [minPrice, maxPrice];
  if (searchText) {
    values.push(`%${searchText}%`);
  }
  if (categoryValue) {
    values.push(`%${categoryValue}%`, `%${categoryValue}%`);
  }

  const result = await execute({ query, values });

  const countQuery = `
    SELECT COUNT(DISTINCT p.id) AS results 
    FROM products p
    LEFT JOIN categorytoproduct ctp ON p.id = ctp.productid
    LEFT JOIN categories cat ON ctp.categoryid = cat.id
    WHERE ${priceCondition} ${nameCondition} ${categoryCondition};
  `;
  const countValues: (number | string)[] = [minPrice, maxPrice];
  if (searchText) {
    countValues.push(`%${searchText}%`);
  }
  if (categoryValue) {
    countValues.push(`%${categoryValue}%`, `%${categoryValue}%`);
  }

  const count = await execute({ query: countQuery, values: countValues });

  const pages = Math.ceil(count[0].results / 20);

  res.status(200).json({
    message: "Success",
    data: {
      list: result.map((product: any) => ({
        ...product,
        categories: product.categories ? product.categories.split(",") : [],
        categoriesid: product.categoriesid
          ? product.categoriesid.split(",")
          : [],
      })),
      pages,
    },
  });
}
