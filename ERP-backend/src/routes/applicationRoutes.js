import express from "express";
import {
  getContacts,
  getCalls,
  getEvents,
  getProjects,
  getChats,
  getSocialFeed,
  getTodos,
  getNotes,
  createContact,
  createPost,
  createEvent,
  createProject,
  sendMessage,
  createTodo,
  createNote
} from "../controllers/applicationController.js";

const router = express.Router();

router.get("/contacts", getContacts);
router.get("/calls", getCalls);
router.get("/events", getEvents);
router.get("/projects", getProjects);
router.get("/chats", getChats);
router.get("/social-feed", getSocialFeed);
router.get("/todos", getTodos);
router.get("/notes", getNotes);

// POST routes
router.post("/contacts", createContact);
router.post("/social-feed", createPost);
router.post("/events", createEvent);
router.post("/projects", createProject);
router.post("/chats/message", sendMessage);
router.post("/todos", createTodo);
router.post("/notes", createNote);

export default router;
