import React from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Package, User, Home, Users } from "lucide-react";
import { Button } from "./ui/Button";

export const Layout = ({ children }) => {
	const { currentUser, logout } = useAuth();
	const location = useLocation();

	if (!currentUser) {
		return <>{children}</>;
	}

	const isActive = (path) => location.pathname.startsWith(path);

	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Sidebar */}
			<div className="w-64 bg-indigo-800 text-white">
				<div className="p-4">
					<div className="flex items-center space-x-2 mb-6">
						<Package className="h-8 w-8" />
						<h1 className="text-xl font-bold">Yarn Track</h1>
					</div>

					<div className="mb-6">
						<div className="px-4 py-3 rounded-lg bg-indigo-900/50">
							<div className="flex items-center space-x-3">
								<div className="bg-indigo-600 p-2 rounded-full">
									<User className="h-5 w-5" />
								</div>
								<div>
									<div className="font-medium">
										{currentUser.username}
									</div>
									<div className="text-xs text-indigo-300 capitalize">
										{currentUser.role}
									</div>
								</div>
							</div>
						</div>
					</div>

					<nav className="space-y-1">
						{/* Only show Dashboard for admin users */}
						{currentUser.role === "admin" && (
							<Link
								to="/dashboard"
								className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
									isActive("/dashboard")
										? "bg-indigo-700"
										: "hover:bg-indigo-700/50 transition-colors"
								}`}
							>
								<Home className="h-5 w-5" />
								<span>Dashboard</span>
							</Link>
						)}

						{/* Only show User Management for admin users */}
						{currentUser.role === "admin" && (
							<Link
								to="/users"
								className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
									isActive("/users")
										? "bg-indigo-700"
										: "hover:bg-indigo-700/50 transition-colors"
								}`}
							>
								<Users className="h-5 w-5" />
								<span>User Management</span>
							</Link>
						)}

						<Link
							to="/orders"
							className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
								isActive("/orders")
									? "bg-indigo-700"
									: "hover:bg-indigo-700/50 transition-colors"
							}`}
						>
							<Package className="h-5 w-5" />
							<span>Orders</span>
						</Link>

						{/* Show Change Requests for admin, factory and operator roles */}
						{["admin", "factory", "operator"].includes(
							currentUser.role
						) && (
							<Link
								to="/change-requests"
								className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${
									isActive("/change-requests")
										? "bg-indigo-700"
										: "hover:bg-indigo-700/50 transition-colors"
								}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									className="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
									/>
								</svg>
								<span>Change Requests</span>
							</Link>
						)}
					</nav>
				</div>

				<div className="absolute bottom-0 w-64 p-4">
					<Button
						variant="outline"
						className="w-full bg-transparent border-indigo-600 text-indigo-100 hover:bg-indigo-700 hover:text-white"
						onClick={logout}
						icon={<LogOut className="h-4 w-4" />}
					>
						Sign Out
					</Button>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex-1 overflow-auto">
				<header className="bg-white shadow-sm">
					<div className="px-6 py-4">
						<h2 className="text-xl font-semibold text-gray-800">
							Internal Order Tracking System
						</h2>
					</div>
				</header>

				<main className="p-6">{children}</main>
			</div>
		</div>
	);
};

Layout.propTypes = {
	children: PropTypes.node.isRequired,
};
