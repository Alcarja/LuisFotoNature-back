import { registerUser, loginUser } from "../services/authService.js";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const register = async (req, res) => {
  try {
    const { name, lastName, email, password } = req.body;

    const { user, token } = await registerUser({
      name,
      lastName,
      email,
      password,
    });

    res.status(201).json({ user, token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const { user, token } = await loginUser({ email, password }, res);

    res.status(200).json({ user, token });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    // 1. Borramos la cookie directamente usando el objeto 'res' que ya tenemos aquí
    res.cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
      sameSite: "lax",
      secure: false, // Cámbialo a true si estás en producción con HTTPS
    });

    // 2. Opcional: Si quieres borrar el header de Authorization en el cliente,
    // eso se hace en el frontend, pero aquí confirmamos el éxito.
    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Error al cerrar sesión",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authMiddleware from the JWT token
    const { userId } = req.user;

    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        lastName: users.lastName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};
