import Contact from "../models/Contact.js";
import CallLog from "../models/CallLog.js";
import CalendarEvent from "../models/CalendarEvent.js";
import Project from "../models/Project.js";
import Chat from "../models/Chat.js";
import SocialPost from "../models/SocialPost.js";
import Todo from "../models/Todo.js";
import Note from "../models/Note.js";

// Helper for consistent response format
const successRes = (res, data) => res.json({ status: true, dataFound: true, data });
const errorRes = (res, error) => res.status(500).json({ status: false, dataFound: false, message: error.message });

export const getContacts = async (req, res) => {
  try {
    const data = await Contact.find().sort({ createdAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createContact = async (req, res) => {
  try {
    const contact = new Contact(req.body);
    const data = await contact.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getCalls = async (req, res) => {
  try {
    const data = await CallLog.find().sort({ createdAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getEvents = async (req, res) => {
  try {
    const data = await CalendarEvent.find().sort({ date: 1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createEvent = async (req, res) => {
  try {
    const event = new CalendarEvent(req.body);
    const data = await event.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getProjects = async (req, res) => {
  try {
    const data = await Project.find().sort({ createdAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    const data = await project.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getChats = async (req, res) => {
  try {
    const data = await Chat.find().sort({ updatedAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const sendMessage = async (req, res) => {
  try {
    const { chatId, sender, text, time, name, avatar } = req.body;
    let chat;
    if (chatId) {
      chat = await Chat.findById(chatId);
      if (!chat) throw new Error("Chat not found");
      chat.messages.push({ sender, text, time });
      chat.lastMessage = text;
      chat.time = time;
      await chat.save();
    } else {
      chat = new Chat({
        name: name || "Unknown",
        avatar: avatar || "",
        lastMessage: text,
        time: time,
        messages: [{ sender, text, time }]
      });
      await chat.save();
    }
    successRes(res, chat);
  } catch (error) { errorRes(res, error); }
};

export const getSocialFeed = async (req, res) => {
  try {
    const data = await SocialPost.find().sort({ createdAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createPost = async (req, res) => {
  try {
    const post = new SocialPost(req.body);
    const data = await post.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getTodos = async (req, res) => {
  try {
    const data = await Todo.find().sort({ dueDate: 1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createTodo = async (req, res) => {
  try {
    const todo = new Todo(req.body);
    const data = await todo.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const getNotes = async (req, res) => {
  try {
    const data = await Note.find().sort({ isPinned: -1, createdAt: -1 });
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};

export const createNote = async (req, res) => {
  try {
    const note = new Note(req.body);
    const data = await note.save();
    successRes(res, data);
  } catch (error) { errorRes(res, error); }
};
