import React, { useState, useEffect, useMemo } from "react";
import { useOrders } from "../context/OrderContext";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
} from "recharts";

const COLORS = [
	"#0088FE",
	"#00C49F",
	"#FFBB28",
	"#FF8042",
	"#8884D8",
	"#82CA9D",
];

export const AnalyticsDashboard = () => {
	const { orders } = useOrders();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// If we have orders, we don't need to wait
		if (orders.length > 0) {
			setIsLoading(false);
		}
	}, [orders]);

	// Memoize computed analytics data
	const analyticsData = useMemo(() => {
		if (!orders.length) return null;

		// Calculate orders by status
		const ordersByStatus = orders.reduce((acc, order) => {
			acc[order.currentStatus] = (acc[order.currentStatus] || 0) + 1;
			return acc;
		}, {});

		const statusData = Object.entries(ordersByStatus).map(
			([status, count]) => ({
				name: status,
				value: count,
			})
		);

		// Calculate orders by date (last 7 days)
		const last7Days = Array.from({ length: 7 }, (_, i) => {
			const date = subDays(new Date(), i);
			return {
				date: format(date, "MMM dd"),
				count: orders.filter((order) => {
					const orderDate = new Date(order.date);
					return (
						orderDate >= startOfDay(date) &&
						orderDate <= endOfDay(date)
					);
				}).length,
			};
		}).reverse();

		return {
			statusData,
			last7Days,
			totalActive: orders.filter((o) => o.currentStatus !== "packed")
				.length,
			totalCompleted: orders.filter((o) => o.currentStatus === "packed")
				.length,
		};
	}, [orders]);

	if (isLoading || !analyticsData) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="text-gray-500">Loading analytics data...</div>
			</div>
		);
	}

	const { statusData, last7Days, totalActive, totalCompleted } =
		analyticsData;

	// Calculate total orders and average orders per day
	const totalOrders = orders.length;
	const avgOrdersPerDay = totalOrders / 7;

	const renderCustomLabel = ({ name, percent }) => {
		return `${name} (${(percent * 100).toFixed(0)}%)`;
	};

	return (
		<div className="space-y-6">
			{/* Summary cards */}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<svg
									className="h-6 w-6 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
									/>
								</svg>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Total Orders
									</dt>
									<dd className="text-lg font-medium text-gray-900">
										{totalOrders}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<svg
									className="h-6 w-6 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Average Orders per Day
									</dt>
									<dd className="text-lg font-medium text-gray-900">
										{avgOrdersPerDay.toFixed(1)}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>

				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<div className="flex items-center">
							<div className="flex-shrink-0">
								<svg
									className="h-6 w-6 text-gray-400"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
							</div>
							<div className="ml-5 w-0 flex-1">
								<dl>
									<dt className="text-sm font-medium text-gray-500 truncate">
										Completed Orders
									</dt>
									<dd className="text-lg font-medium text-gray-900">
										{totalCompleted}
									</dd>
								</dl>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Charts */}
			<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
				{/* Orders by Status */}
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Orders by Status
						</h3>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<PieChart>
									<Pie
										data={statusData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={renderCustomLabel}
										outerRadius={80}
										fill="#8884d8"
										dataKey="value"
									>
										{statusData.map((entry, index) => (
											<Cell
												key={`cell-${index}`}
												fill={
													COLORS[
														index % COLORS.length
													]
												}
											/>
										))}
									</Pie>
									<Tooltip />
									<Legend />
								</PieChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>

				{/* Orders by Date */}
				<div className="bg-white overflow-hidden shadow rounded-lg">
					<div className="p-5">
						<h3 className="text-lg font-medium text-gray-900 mb-4">
							Orders by Date (Last 7 Days)
						</h3>
						<div className="h-80">
							<ResponsiveContainer width="100%" height="100%">
								<BarChart data={last7Days}>
									<CartesianGrid strokeDasharray="3 3" />
									<XAxis dataKey="date" />
									<YAxis />
									<Tooltip />
									<Legend />
									<Bar
										dataKey="count"
										fill="#8884d8"
										name="Orders"
									/>
								</BarChart>
							</ResponsiveContainer>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
