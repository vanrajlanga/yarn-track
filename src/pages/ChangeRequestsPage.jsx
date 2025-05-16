import React from "react";
import { Layout } from "../components/Layout";
import { ChangeRequestsTable } from "../components/ChangeRequestsTable";
import { useAuth } from "../context/AuthContext";

export const ChangeRequestsPage = () => {
	const { currentUser } = useAuth();

	// Only allow admins, factory users, and operators to access this page
	const allowedRoles = ["admin", "factory", "operator"];
	const hasAccess = currentUser && allowedRoles.includes(currentUser.role);

	if (!hasAccess) {
		return (
			<Layout>
				<div className="container mx-auto px-4 py-8">
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						You do not have permission to access this page.
					</div>
				</div>
			</Layout>
		);
	}

	return (
		<Layout>
			<div className="container mx-auto px-4 py-8">
				<div className="mb-8">
					<h1 className="text-2xl font-bold mb-2">Change Requests</h1>
					<p className="text-gray-600">
						{currentUser.role === "admin"
							? "Review and process change requests from factory and operator users."
							: "View your submitted change requests and their status."}
					</p>
				</div>

				<ChangeRequestsTable />
			</div>
		</Layout>
	);
};

export default ChangeRequestsPage;
