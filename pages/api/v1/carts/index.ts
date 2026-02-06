import verifyToken, { decodeToken } from "@/components/lib/auth/verifyToken";
import execute from "@/components/lib/database/db";
import { log } from "console";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const token = req.headers?.authorization?.substring(7) as string;

  if (!verifyToken(token)) {
    return res.status(401).json({ message: "Not Authorized" });
  }

  const decoded = decodeToken(token);

  console.log(decoded.responce);

  const userQuery = `SELECT id FROM users WHERE email = ?;`;
  const userValues: any[] = [decoded.responce];

  const user: any = await execute({ query: userQuery, values: userValues });

  if (user.length < 1) {
    return res.status(401).json({ message: "No Such User" });
  }

  console.log(user[0].id);

  const idUser = user[0].id;

  // find the user cart

  const cartQuery = `SELECT id FROM cart WHERE userid = ?;`;
  const cartValues: any[] = [idUser];

  const carts: any = await execute({ query: cartQuery, values: cartValues });

  console.log(carts);

  let cartId: number;
  // if the cart doen't exist make one
  if (carts.length < 1) {
    const createCartQuery = `INSERT INTO \`cart\` (\`userid\`) VALUES (?) ; `;
    const createCartValues = [idUser];
    const newCart: any = await execute({
      query: createCartQuery,
      values: createCartValues,
    });

    return res.status(200).json({ item: [] });
  }

  cartId = carts[0].id;

  if (req.method === "GET") {
    // get the user by decoding th e token

    // get all the things

    const productsQuery = `SELECT * FROM \`cartitemproduct\` WHERE cartid = ? ; `;
    const productsValues = [cartId];
    const products: any = await execute({
      query: productsQuery,
      values: productsValues,
    });

    const servicesQuery = `SELECT * FROM \`cartitemservice\` WHERE cartid = ? ; `;
    const servicesValues = [cartId];
    const services: any = await execute({
      query: servicesQuery,
      values: servicesValues,
    });

    const clinicsQuery = `SELECT * FROM \`cartitemclinic\` WHERE cartid = ? ; `;
    const clinicsValues = [cartId];
    const clinics: any = await execute({
      query: clinicsQuery,
      values: clinicsValues,
    });

    return res
      .status(200)
      .json({ products: products, clinics: clinics, services: services });
  }
  // adding items to cart
  else if (req.method === "POST") {
    const { type, id, quantity } = req.body;

    const types = ["clinic", "product", "service"];

    const tableMap: {
      clinic: { table: string; column: string };
      product: { table: string; column: string };
      service: { table: string; column: string };
    } = {
      clinic: { table: "cartitemclinic", column: "clinicid" },
      product: { table: "cartitemproduct", column: "productid" },
      service: { table: "cartitemservice", column: "serviceid" },
    };
    if (types.includes(type)) {
      const checkQuery = `SELECT * FROM ${
        tableMap[type as keyof typeof tableMap].table
      } WHERE ${
        tableMap[type as keyof typeof tableMap].column
      } = ? AND cartid = ? ;`;

      const checkValues: any[] = [id, cartId];

      const prevItem: any = await execute({
        query: checkQuery,
        values: checkValues,
      });

      console.log(prevItem, "b");

      if (prevItem.length > 0) {
        console.log(prevItem, "a");
        const query = `UPDATE \`${
          tableMap[type as keyof typeof tableMap].table
        }\`
           SET \`quantity\` = ?
            WHERE \`id\` = ?; `;
        const values = [prevItem[0].quantity + quantity, prevItem[0].id];
        const result: any = await execute({
          query,
          values,
        });
        return res
          .status(200)
          .json({ message: `${type} with ${id} quantity reduced` });
      }

      console.log(tableMap[type as keyof typeof tableMap], "hello");

      const query = `INSERT INTO \`${
        tableMap[type as keyof typeof tableMap].table
      }\`
    (cartid, ${tableMap[type as keyof typeof tableMap].column}, quantity )
      VALUES (?, ?, ? ) ; `;
      const values = [cartId, id, quantity];
      const result: any = await execute({
        query,
        values,
      });
      return res
        .status(200)
        .json({ message: `${type} with ${id} added to the cart` });
    }
    return res.status(400).json({ message: "type not compatable" });
  }
  // delete for removing items or decreasing quantity
  else if (req.method === "DELETE") {
    const { type, id, quantity } = req.body;

    const types = ["clinic", "product", "service"];

    const tableMap: {
      clinic: { table: string; column: string };
      product: { table: string; column: string };
      service: { table: string; column: string };
    } = {
      clinic: { table: "cartitemclinic", column: "clinicid" },
      product: { table: "cartitemproduct", column: "productid" },
      service: { table: "cartitemservice", column: "serviceid" },
    };
    if (types.includes(type)) {
      // getting the item
      const checkQuery = `SELECT * FROM ${
        tableMap[type as keyof typeof tableMap].table
      } WHERE ${
        tableMap[type as keyof typeof tableMap].column
      } = ? AND cartid = ? ;`;

      const checkValues: any[] = [id, cartId];

      const prevItem: any = await execute({
        query: checkQuery,
        values: checkValues,
      });

      if (prevItem.length < 1) {
        return res.status(400).json({ message: "Item doesn't exist." });
      }

      if (prevItem[0].quantity > quantity) {
        const query = `UPDATE \`${
          tableMap[type as keyof typeof tableMap].table
        }\`
           SET \`quantity\` = ?
            WHERE \`id\` = ?; `;
        const values = [prevItem[0].quantity - quantity, prevItem[0].id];
        const result: any = await execute({
          query,
          values,
        });
        return res
          .status(200)
          .json({ message: `${type} with ${id} quantity reduced` });
      }

      const query = `DELETE FROM \`${
        tableMap[type as keyof typeof tableMap].table
      }\` WHERE \`id\` = ? ; `;
      const values = [prevItem[0].id];
      const result: any = await execute({
        query,
        values,
      });
      return res
        .status(200)
        .json({ message: `${type} with ${id} removed from the cart` });
    }
    return res.status(400).json({ message: "type not compatable" });
  }
  res.status(200).json({ name: "John Doe" });
}
