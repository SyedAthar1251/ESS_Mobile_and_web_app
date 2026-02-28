import axios from "axios";

// Create axios instance
const api = axios.create({
  timeout: 30000,
});

export default api;
