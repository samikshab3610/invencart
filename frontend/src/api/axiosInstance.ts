import axios from 'axios';

// Create a single Axios instance used across the entire app.
// This means the base URL and credentials are configured once,
// not repeated in every single API call.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // reads from .env file
  withCredentials: true, // CRITICAL: sends httpOnly cookies with every request
                         // without this, your JWT tokens never get sent
                         // and every protected route returns 401
});

export default api;