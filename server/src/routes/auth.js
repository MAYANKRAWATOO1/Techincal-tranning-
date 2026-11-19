import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const router = Router();
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createSession(user) {
  const token = jwt.sign(
    { sub: user.id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email },
  };
}

router.post("/register", async (request, response, next) => {
  const name = typeof request.body.name === "string" ? request.body.name.trim() : "";
  const email =
    typeof request.body.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof request.body.password === "string" ? request.body.password : "";

  if (name.length < 2 || name.length > 60) {
    return response.status(400).json({ message: "Name must be 2 to 60 characters." });
  }
  if (email.length > 254 || !emailPattern.test(email)) {
    return response.status(400).json({ message: "Enter a valid email address." });
  }
  if (password.length < 8 || password.length > 72) {
    return response.status(400).json({ message: "Password must be 8 to 72 characters." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    return response.status(201).json(createSession(user));
  } catch (error) {
    if (error.code === 11000) {
      return response.status(409).json({ message: "An account with that email already exists." });
    }
    return next(error);
  }
});

router.post("/login", async (request, response, next) => {
  const email =
    typeof request.body.email === "string"
      ? request.body.email.trim().toLowerCase()
      : "";
  const password =
    typeof request.body.password === "string" ? request.body.password : "";

  try {
    const user = await User.findOne({ email }).select("+passwordHash");
    const passwordMatches =
      user && password && (await bcrypt.compare(password, user.passwordHash));

    if (!passwordMatches) {
      return response.status(401).json({ message: "Email or password is incorrect." });
    }

    return response.json(createSession(user));
  } catch (error) {
    return next(error);
  }
});

export default router;
