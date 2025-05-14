import React, { useState, useEffect } from "react";
import { OrdersTable } from "../components/OrdersTable";
import { StatusFilter } from "../components/StatusFilter";
import { useAuth } from "../contexts/AuthContext"; // Assuming you have an auth context

const OrdersPage = () => {
	const [orders, setOrders] = useState([]);
	const [statusFilter, setStatusFilter] = useState(null);
	const { user } = useAuth();

	const isFactoryUser = user?.role === "factory";

	// If user is factory role and no filter is selected, don't show any orders
	const filteredOrders = orders.filter((order) => {
		if (isFactoryUser && !statusFilter) {
			return false;
		}
		return statusFilter ? order.currentStatus === statusFilter : true;
	});

	// Fetch orders and other logic...

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-2xl font-bold mb-6">Orders</h1>

			<StatusFilter
				selectedStatus={statusFilter}
				onStatusChange={setStatusFilter}
				isFactoryUser={isFactoryUser}
			/>

			<OrdersTable
				orders={filteredOrders}
				canEditOrders={
					user?.role === "admin" || user?.role === "manager"
				}
				onStatusUpdate={handleStatusUpdate}
				isFactoryUser={isFactoryUser}
				activeStatusFilter={statusFilter}
			/>
		</div>
	);
};

export default OrdersPage;
