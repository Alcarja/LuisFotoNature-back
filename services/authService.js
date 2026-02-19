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

    // CURRENT (IP/HTTP): Must be false
    // PRODUCTION (HTTPS): Must be true
    secure: hasSSL,

    // CURRENT (IP/HTTP): "lax" allows the cookie to work across ports (3000/4000)
    // PRODUCTION (HTTPS): "strict" is best, or "lax" if you have separate subdomains
    sameSite: "lax",

    // Match this to your JWT duration (5 days = 432,000,000 ms)
    maxAge: 5 * 24 * 60 * 60 * 1000,

    // DO NOT add a 'domain' property for IP addresses.
    // For production domains, use: domain: ".yourdomain.com"
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
  };
}

export async function logoutUser(req, res) {
  try {
    // Sobreescribimos la cookie 'token' con un valor vacío y que expire YA
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0), // Fecha en el pasado (1970)
      path: "/", // Asegúrate de que el path sea el mismo que al crearla
      sameSite: "lax",
      secure: false, // Ponlo en 'true' si usas HTTPS (producción)
    });

    return res.status(200).json({
      success: true,
      message: "Sesión cerrada correctamente",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Error al cerrar sesión" });
  }
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
