// Centralized API Configuration.
// Local dev uses localhost unless NEXT_PUBLIC_API_URL is set.
// Production must never fall back to localhost in the browser.

const LOCAL_API_URL = 'http://localhost:5000';
const PRODUCTION_API_URL = 'https://civic-issue-reporting-system-ofz9.onrender.com';

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL)
).replace(/\/$/, '');

export default API_URL;
