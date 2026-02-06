import verifyToken from "@/components/lib/auth/verifyToken";
import execute from "@/components/lib/database/db";
import { NextApiRequest, NextApiResponse } from "next";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

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
    const {
      name,
      price,
      description,
      longdescription,
      image1,
      image2,
      image3,
      saleprice,
      categories,
    } = req.body;

    if (
      !name ||
      !description ||
      !price ||
      !longdescription ||
      !image1 ||
      !image2 ||
      !image3 ||
      !saleprice ||
      !categories
    ) {
      return res.status(400).json({ message: "provide details" });
    }

    console.log(image1, categories);

    try {
      const query = `INSERT INTO products (name, price, description, long_description,  saleprice)
      VALUES ( ?, ?, ?, ?, ?);`;
      const values: any[] = [
        name,
        price,
        description,
        longdescription,
        saleprice,
      ];

      const result: any = await execute({ query, values });

      const insertCategoriesQuery = `
        INSERT INTO categorytoproduct (productid, categoryid) VALUES (?, ?);
      `;
      const categoryValues = categories.map((categoryId: number) => [
        result.insertId,
        categoryId,
      ]);

      categoryValues.map(async (item: number[]) => {
        console.log(item);

        await execute({
          query: insertCategoriesQuery,
          values: item,
        });
      });

      return res.status(201).json({
        message: "Product successfully",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  if (req.method === "PUT") {
    const {
      id,
      name,
      price,
      description,
      longdescription,
      saleprice,
      categories,
    } = req.body;

    if (
      typeof id !== "number" ||
      (name && typeof name !== "string") ||
      (price && typeof price !== "number") ||
      (description && typeof description !== "string") ||
      (longdescription && typeof longdescription !== "string") ||
      (saleprice && typeof saleprice !== "number") ||
      (categories && !Array.isArray(categories))
    ) {
      return res.status(400).json({ message: "Invalid input", data: null });
    }

    try {
      // Update product fields
      const updateFields: string[] = [];
      const values: (number | string | null)[] = [];

      if (name) {
        updateFields.push("name = ?");
        values.push(name);
      }
      if (price) {
        updateFields.push("price = ?");
        values.push(price);
      }
      if (description) {
        updateFields.push("description = ?");
        values.push(description);
      }
      if (longdescription) {
        updateFields.push("long_description = ?");
        values.push(longdescription);
      }
      if (saleprice) {
        updateFields.push("saleprice = ?");
        values.push(saleprice);
      }

      values.push(id);

      if (updateFields.length > 0) {
        const updateQuery = `
        UPDATE products 
        SET ${updateFields.join(", ")}
        WHERE id = ?;
      `;
        await execute({ query: updateQuery, values });
      }

      // Update categories
      if (categories && categories.length > 0) {
        const deleteCategoriesQuery = `
        DELETE FROM categorytoproduct WHERE productid = ?;
      `;
        await execute({ query: deleteCategoriesQuery, values: [id] });

        const insertCategoriesQuery = `
        INSERT INTO categorytoproduct (productid, categoryid) VALUES (?, ?);
      `;
        const categoryValues = categories.map((categoryId: number) => [
          id,
          categoryId,
        ]);

        categoryValues.map(async (item: number[]) => {
          await execute({
            query: insertCategoriesQuery,
            values: item,
          });
        });
      }

      return res
        .status(200)
        .json({ message: "Product updated successfully", data: null });
    } catch (e: any) {
      console.error(e);
    }
  }

  if (req.method === "DELETE") {
    const id = req.body;

    if (!id) {
      res.status(400).json({ message: "Product id not provided" });
    }
    try {
      const query = "DELETE FROM products WHERE id = ?;";
      const values = [id];
      const result = await execute({ query, values });
      return res.status(200).json({ message: "Products deleted successfully" });
    } catch (error) {
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(400).json({ message: "Invalid request" });
};
