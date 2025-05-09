import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { API_URL } from "../config";

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
	const [currentUser, setCurrentUser] = useState(null);
	const [isLoading, setIsLoading] = useState(true);

	// Function to verify token and get user data
	const verifyToken = async (token) => {
		try {
			const response = await fetch(`${API_URL}/auth/me`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Invalid token");
			}

			const userData = await response.json();
			setCurrentUser(userData);
			return true;
		} catch (error) {
			console.error("Token verification failed:", error);
			localStorage.removeItem("token");
			setCurrentUser(null);
			return false;
		}
	};

	// Initial token verification
	useEffect(() => {
		const token = localStorage.getItem("token");
		if (token) {
			verifyToken(token).finally(() => {
				setIsLoading(false);
			});
		} else {
			setIsLoading(false);
		}
	}, []); // Empty dependency array since this should only run once on mount

	const login = async (username, password) => {
		setIsLoading(true);
		try {
			const response = await fetch(`${API_URL}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ username, password }),
			});

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem("token", data.token);
				setCurrentUser(data.user);
				setIsLoading(false);
				return true;
			} else {
				setIsLoading(false);
				return false;
			}
		} catch (error) {
			console.error("Login error:", error);
			setIsLoading(false);
			return false;
		}
	};

	const logout = () => {
		localStorage.removeItem("token");
		setCurrentUser(null);
	};

	return (
		<AuthContext.Provider value={{ currentUser, login, logout, isLoading }}>
			{children}
		</AuthContext.Provider>
	);
};

AuthProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
};
