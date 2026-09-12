import apiClient from "./api.service";

export const ApplicationService = {
  // Contacts
  getContacts: async () => {
    const res = await apiClient.get("/application/contacts");
    return res.data;
  },
  createContact: async (payload: any) => {
    const res = await apiClient.post("/application/contacts", payload);
    return res.data;
  },
  updateContact: async (id: string, payload: any) => {
    const res = await apiClient.put(`/application/contacts/${id}`, payload);
    return res.data;
  },
  deleteContact: async (id: string) => {
    const res = await apiClient.delete(`/application/contacts/${id}`);
    return res.data;
  },

  // Call History
  getCallHistory: async () => {
    const res = await apiClient.get("/application/calls");
    return res.data;
  },

  // Calendar Events
  getCalendarEvents: async () => {
    const res = await apiClient.get("/application/events");
    return res.data;
  },
  createEvent: async (payload: any) => {
    const res = await apiClient.post("/application/events", payload);
    return res.data;
  },
  updateEvent: async (id: string, payload: any) => {
    const res = await apiClient.put(`/application/events/${id}`, payload);
    return res.data;
  },
  deleteEvent: async (id: string) => {
    const res = await apiClient.delete(`/application/events/${id}`);
    return res.data;
  },

  // Todo
  getTodos: async () => {
    const res = await apiClient.get("/application/todos");
    return res.data;
  },
  createTodo: async (payload: any) => {
    const res = await apiClient.post("/application/todos", payload);
    return res.data;
  },
  updateTodo: async (id: string, payload: any) => {
    const res = await apiClient.put(`/application/todos/${id}`, payload);
    return res.data;
  },
  deleteTodo: async (id: string) => {
    const res = await apiClient.delete(`/application/todos/${id}`);
    return res.data;
  },

  // Notes
  getNotes: async () => {
    const res = await apiClient.get("/application/notes");
    return res.data;
  },
  createNote: async (payload: any) => {
    const res = await apiClient.post("/application/notes", payload);
    return res.data;
  },
  updateNote: async (id: string, payload: any) => {
    const res = await apiClient.put(`/application/notes/${id}`, payload);
    return res.data;
  },
  deleteNote: async (id: string) => {
    const res = await apiClient.delete(`/application/notes/${id}`);
    return res.data;
  },

  // Projects
  getProjects: async () => {
    const res = await apiClient.get("/application/projects");
    return res.data;
  },
  createProject: async (payload: any) => {
    const res = await apiClient.post("/application/projects", payload);
    return res.data;
  },
  updateProject: async (id: string, payload: any) => {
    const res = await apiClient.put(`/application/projects/${id}`, payload);
    return res.data;
  },
  deleteProject: async (id: string) => {
    const res = await apiClient.delete(`/application/projects/${id}`);
    return res.data;
  },

  // Chat Messages
  getChats: async () => {
    const res = await apiClient.get("/application/chats");
    return res.data;
  },
  sendMessage: async (payload: any) => {
    const res = await apiClient.post("/application/chats/message", payload);
    return res.data;
  },

  // Social Feed
  getSocialFeed: async () => {
    const res = await apiClient.get("/application/social-feed");
    return res.data;
  },
  createPost: async (payload: any) => {
    const res = await apiClient.post("/application/social-feed", payload);
    return res.data;
  },
  likePost: async (id: string) => {
    const res = await apiClient.post(`/application/social-feed/${id}/like`);
    return res.data;
  },
};
