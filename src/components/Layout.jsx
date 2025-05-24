import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, Package, User, Home, Users, Menu, PanelLeftClose } from "lucide-react";
import { Button } from "./ui/Button";

export const Layout = ({ children }) => {
	const { currentUser, logout } = useAuth();
	const location = useLocation();

	const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(
		localStorage.getItem("isSidebarCollapsed") === "true"
	);

	useEffect(() => {
		localStorage.setItem("isSidebarCollapsed", isSidebarCollapsed);
	}, [isSidebarCollapsed]);

	if (!currentUser) {
		return <>{children}</>;
	}

	const isActive = (path) => location.pathname.startsWith(path);

	const toggleSidebar = () => {
		setIsSidebarCollapsed(!isSidebarCollapsed);
	};

	return (
		<div className="min-h-screen bg-gray-50 flex">
			{/* Sidebar */}
			<div
				className={`bg-indigo-800 text-white transition-all duration-300 flex flex-col ${
					isSidebarCollapsed ? "w-20" : "w-64"
				}`}
			>
				<div className="flex-1">
					<div className="flex items-center h-16 px-4">
						<Package className="h-8 w-8 flex-shrink-0" />
						{!isSidebarCollapsed && (
							<h1 className="text-xl font-bold ml-3">Yarn Track</h1>
						)}
					</div>

					<div className="px-4 mb-6">
						<div className={`flex items-center bg-indigo-900/50 rounded-lg p-3 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
							<div className="bg-indigo-600 p-2 rounded-full flex-shrink-0">
								<User className="h-5 w-5" />
							</div>
							{!isSidebarCollapsed && (
								<div className="ml-3">
									<div className="font-medium">
										{currentUser.username}
									</div>
									<div className="text-xs text-indigo-300 capitalize">
										{currentUser.role}
									</div>
								</div>
							)}
						</div>
					</div>

					<nav className="space-y-1 px-4">
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
								{!isSidebarCollapsed && (
									<span>Dashboard</span>
								)}
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
								{!isSidebarCollapsed && (
									<span>User Management</span>
								)}
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
							{!isSidebarCollapsed && <span>Orders</span>}
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
								{!isSidebarCollapsed && (
									<span>Change Requests</span>
								)}
							</Link>
						)}
					</nav>
				</div>

				<div className="p-4 border-t border-indigo-700">
					<Button
						variant="outline"
						className={`${
							isSidebarCollapsed 
								? "w-12 h-12 justify-center" 
								: ""
						} border-indigo-600 text-white hover:bg-indigo-700`}
						onClick={logout}
						icon={<LogOut className="h-4 w-4" />}
						size={isSidebarCollapsed ? "icon" : "md"}
					>
						{!isSidebarCollapsed && "Sign Out"}
					</Button>
				</div>
			</div>

			{/* Main content area */}
			<div className="flex-1 overflow-auto">
				<header className="bg-white shadow-sm">
					<div className="px-6 py-4 flex items-center space-x-4">
						<Button
							variant="ghost"
							size="icon"
							onClick={toggleSidebar}
							className="text-gray-600"
							icon={isSidebarCollapsed ? <Menu className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
						/>
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
