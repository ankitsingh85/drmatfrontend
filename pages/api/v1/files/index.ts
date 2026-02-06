import { NextApiRequest, NextApiResponse } from "next";

import AWS from "aws-sdk";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method != "POST") {
    return res.status(500).json({ message: "method not allowed" });
  }
  const request: any = req;
  const file = request.file?.file;
  console.log(file);

  try {
    const date = new Date().toISOString().replace(/[:.]/g, "-");
    const objectKey = `${
      path.parse(file.originalname).name
    }-${date}${path.extname(file.originalname)}`;

    const filePath = file.filepath;

    AWS.config.update({ region: "ap-south-1" });

    const s3 = new AWS.S3();

    const fileContent = fs.readFileSync(filePath);

    const params = {
      Bucket: "drdermat",
      Key: objectKey,
      Body: fileContent,
    };

    await s3.upload(params).promise();
  } catch (e) {}

  res.status(200).json({ name: "John Doe" });
}
