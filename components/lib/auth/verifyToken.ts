import jwt from "jsonwebtoken";

export default function verifyToken(token: string) {
  const secret: string = process.env.JWT_SECRET as string;
  try {
    const decode = jwt.verify(token, secret);
    return true;
  } catch (e) {
    console.log("error ", e);
    return false;
  }
}

export function decodeToken(token: string) {
  const decoded = jwt.decode(token) as unknown as {
    email: string;
    iat: number;
    exp: number;
  };

  console.log(decoded);

  if (decoded) {
    return { status: true, responce: decoded?.email };
  }
  return { status: false, responce: null };
}
