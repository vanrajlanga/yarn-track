// In Create React App, environment variables are injected at build time
// and are available through window._env_ or process.env
declare global {
  interface Window {
    _env_: {
      REACT_APP_API_URL?: string;
    };
  }
}

// Get the API URL from either window._env_ (for runtime) or process.env (for build time)
const getApiUrl = () => {
  if (typeof window !== 'undefined' && window._env_?.REACT_APP_API_URL) {
    return window._env_.REACT_APP_API_URL;
  }
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl(); 