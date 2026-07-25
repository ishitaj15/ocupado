// Central API base URL — reads from env in production, localhost for local dev
export const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'