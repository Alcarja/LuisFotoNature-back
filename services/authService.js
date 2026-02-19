import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";

const JWT_SECRET = process.env.JWT_SECRET;
const hasSSL = false; // 👈 Set to TRUE only once you have https://domain.com

export async function registerUser({ name, lastName, email, password }) {
  const existing = await db.select().from(users).where(eq(users.email, email));

  if (existing.length > 0) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 12);

  const [user] = await db
    .insert(users)
    .values({
      name,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token };
}

export async function loginUser({ email, password }, res) {
  const [user] = await db.select().from(users).where(eq(users.email, email));

  if (!user) throw new Error("User not found");

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) throw new Error("Invalid credentials");

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: "5d",
  });

  res.cookie("token", token, {
    path: "/",
    httpOnly: true,
    secure: true, // HTTPS is now active
    sameSite: "strict", // same domain now, strict is fine
    maxAge: 5 * 24 * 60 * 60 * 1000,
    domain: ".luisfotonature.com", // covers both www and non-www
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
