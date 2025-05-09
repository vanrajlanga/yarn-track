import React from "react";
import { Layout } from "../components/Layout";
import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { useAuth } from "../context/AuthContext";

export const Dashboard = () => {
	const { currentUser } = useAuth();

	return (
		<Layout>
			<div className="space-y-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-6">
					Analytics Overview
				</h2>

				{currentUser?.role === "admin" ? (
					<AnalyticsDashboard />
				) : (
					<div className="bg-white rounded-lg shadow p-6">
						<p className="text-gray-500">
							Analytics data is only available to admin users.
						</p>
					</div>
				)}
			</div>
		</Layout>
	);
};
