const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

// Create a task with owner
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(400).send(err)
  }
});

// Read all tasks created by owner
// GET /tasks?completed=true
// GET /tasks?limit=10&skip=20
// GET /tasks?sortBy=createdAt:desc
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  const { completed, sortBy, limit, skip } = req.query;

  if (completed) {
    match.completed = completed === "true"
  }

  if (sortBy) {
    const parts = sortBy.split("_")
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1
  }

  try {
    // const tasks = await Task.find({ owner: req.user._id });
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(limit),
        skip: parseInt(skip),
        sort
      }
    });
    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send(err.message)
  }
});

// Read a task by id
router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });

    if (!task) return res.status(404).send();

    res.send(task);
  } catch (err) {
    res.status(500).send(err)
  }
});

// Update a task by id
router.patch("/tasks/:id", auth, async (req, res) => {
  const updateFields = Object.keys(req.body);
  const allowedFields = ["description", "completed"];
  const isValid = updateFields.every(field => allowedFields.includes(field));

  if (!isValid) return res.status(400).send({ err: "Invalid field update!" });

  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    
    if (!task) return res.status(404).send();
    
    updateFields.forEach(field => {
      task[field] = req.body[field];
    });

    await task.save();
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Delete a task by id
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndRemove({ _id: req.params.id, owner: req.user._id });

    if (!task) return res.status(404).send();

    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;