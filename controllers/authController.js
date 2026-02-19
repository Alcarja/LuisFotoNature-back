import {
  registerUser,
  loginUser,
  logoutUser,
} from "../services/authService.js";
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
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ error: "No token provided" });
    }

    await logoutUser(token);

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
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
