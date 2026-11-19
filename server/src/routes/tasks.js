import { Router } from "express";
import mongoose from "mongoose";
import { Task } from "../models/Task.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (request, response, next) => {
  try {
    const tasks = await Task.find({ user: request.userId }).sort({ createdAt: -1 });
    return response.json({ tasks });
  } catch (error) {
    return next(error);
  }
});

router.post("/", async (request, response, next) => {
  const title = typeof request.body.title === "string" ? request.body.title.trim() : "";
  if (!title || title.length > 160) {
    return response.status(400).json({ message: "Task title must be 1 to 160 characters." });
  }

  try {
    const task = await Task.create({ user: request.userId, title });
    return response.status(201).json({ task });
  } catch (error) {
    return next(error);
  }
});

router.patch("/:id", async (request, response, next) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid task ID." });
  }
  if (typeof request.body.completed !== "boolean") {
    return response.status(400).json({ message: "Completed must be true or false." });
  }

  try {
    const task = await Task.findOneAndUpdate(
      { _id: request.params.id, user: request.userId },
      { completed: request.body.completed },
      { new: true, runValidators: true },
    );
    if (!task) return response.status(404).json({ message: "Task not found." });
    return response.json({ task });
  } catch (error) {
    return next(error);
  }
});

router.delete("/:id", async (request, response, next) => {
  if (!mongoose.isValidObjectId(request.params.id)) {
    return response.status(400).json({ message: "Invalid task ID." });
  }

  try {
    const task = await Task.findOneAndDelete({
      _id: request.params.id,
      user: request.userId,
    });
    if (!task) return response.status(404).json({ message: "Task not found." });
    return response.status(204).end();
  } catch (error) {
    return next(error);
  }
});

export default router;
