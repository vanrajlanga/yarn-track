import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Package, User, Lock } from "lucide-react";

export const LoginPage = () => {
	const { login, isLoading, currentUser } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");

	useEffect(() => {
		// Only redirect if we're on the login page and user is logged in
		if (currentUser && location.pathname === "/login") {
			// Redirect admin to dashboard, others to orders
			const redirectPath =
				currentUser.role === "admin" ? "/dashboard" : "/orders";
			navigate(redirectPath, { replace: true });
		}
	}, [currentUser, navigate, location.pathname]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		if (!username || !password) {
			setError("Please enter both username and password");
			return;
		}

		const success = await login(username, password);

		if (success) {
			// Get user from local storage since currentUser might not be updated yet
			const userData = JSON.parse(localStorage.getItem("user"));
			// Redirect admin to dashboard, others to orders
			const redirectPath =
				userData?.role === "admin" ? "/dashboard" : "/orders";
			navigate(redirectPath, { replace: true });
		} else {
			setError("Invalid username or password");
		}
	};

	return (
		<div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
			<div className="sm:mx-auto sm:w-full sm:max-w-md">
				<div className="flex justify-center">
					<div className="bg-indigo-600 p-3 rounded-full">
						<Package className="h-12 w-12 text-white" />
					</div>
				</div>
				<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
					Salasar Track System
				</h2>
				<p className="mt-2 text-center text-sm text-gray-600">
					Internal Order Tracking System
				</p>
			</div>

			<div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
				<div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
					<form className="space-y-6" onSubmit={handleSubmit}>
						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
								{error}
							</div>
						)}

						<div>
							<label
								htmlFor="username"
								className="block text-sm font-medium text-gray-700"
							>
								Username
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<User className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="username"
									name="username"
									type="text"
									autoComplete="username"
									required
									value={username}
									onChange={(e) =>
										setUsername(e.target.value)
									}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="johndoe"
								/>
							</div>
						</div>

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium text-gray-700"
							>
								Password
							</label>
							<div className="mt-1 relative rounded-md shadow-sm">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<Lock className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
									value={password}
									onChange={(e) =>
										setPassword(e.target.value)
									}
									className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="••••••••"
								/>
							</div>
						</div>

						<div>
							<Button
								type="submit"
								className="w-full flex justify-center"
								disabled={isLoading}
							>
								{isLoading ? "Signing in..." : "Sign in"}
							</Button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
};
