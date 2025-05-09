// In Vite, environment variables are prefixed with VITE_
// and are accessed via import.meta.env

/**
 * Gets the API URL from environment variables
 * @returns {string} The API URL
 */
const getApiUrl = () => {
	// For Vite, we use import.meta.env for environment variables
	if (import.meta.env.VITE_API_URL) {
		return import.meta.env.VITE_API_URL;
	}

	// For runtime configuration via window._env_
	if (typeof window !== "undefined" && window._env_?.REACT_APP_API_URL) {
		return window._env_.REACT_APP_API_URL;
	}

	// Fallback
	return "http://localhost:5000/api";
};

export const API_URL = getApiUrl();
