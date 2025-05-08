import React, { createContext, useContext, useState, useEffect } from "react";
import { Order, OrderStatus } from "../types";
import { useAuth } from "./AuthContext";

interface OrderContextType {
	orders: Order[];
	loading: boolean;
	error: string | null;
	filters: OrderFilters;
	setFilters: (filters: OrderFilters) => void;
	createOrder: (orderData: OrderCreateData) => Promise<Order | null>;
	updateOrderStatus: (
		orderId: string,
		status: OrderStatus
	) => Promise<Order | null>;
	refreshOrders: () => Promise<void>;
}

interface OrderFilters {
	status: string;
	searchTerm: string;
	salespersonId: string;
	startDate: string;
	endDate: string;
}

interface OrderCreateData {
	sdyNumber: string;
	date: string;
	partyName: string;
	deliveryParty: string;
	salespersonId: string | number;
	denier: string;
	slNumber: string;
	salesperson: {
		id: string | number;
		username: string;
	};
}

const API_URL = "http://localhost:5000/api";

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [filters, setFilters] = useState<OrderFilters>({
		status: "all",
		searchTerm: "",
		salespersonId: "all",
		startDate: "",
		endDate: "",
	});

	const { currentUser } = useAuth();

	const constructQueryParams = () => {
		const params = new URLSearchParams();
		if (filters.status !== "all") params.append("status", filters.status);
		if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
		if (filters.salespersonId !== "all")
			params.append("salespersonId", filters.salespersonId);
		if (filters.startDate) params.append("startDate", filters.startDate);
		if (filters.endDate) params.append("endDate", filters.endDate);
		return params.toString();
	};

	const fetchOrders = async () => {
		setLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			const queryParams = constructQueryParams();
			const url = `${API_URL}/orders${
				queryParams ? `?${queryParams}` : ""
			}`;

			const response = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch orders: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			setOrders(data);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to fetch orders"
			);
			console.error("Error fetching orders:", err);
		} finally {
			setLoading(false);
		}
	};

	// Fetch orders when currentUser changes or filters change
	useEffect(() => {
		if (currentUser) {
			fetchOrders();
		}
	}, [currentUser, filters]);

	const createOrder = async (orderData: OrderCreateData) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				return null;
			}

			const response = await fetch(`${API_URL}/orders`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify(orderData),
			});

			if (!response.ok) {
				throw new Error(
					`Failed to create order: ${response.status} ${response.statusText}`
				);
			}

			const newOrder = await response.json();
			setOrders((prev) => [...prev, newOrder]);
			return newOrder;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create order"
			);
			console.error("Error creating order:", err);
			return null;
		}
	};

	const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Not authenticated");
				return null;
			}

			const response = await fetch(
				`${API_URL}/orders/${orderId}/status`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({ status }),
				}
			);

			if (!response.ok) {
				throw new Error(
					`Failed to update order status: ${response.status} ${response.statusText}`
				);
			}

			const updatedOrder = await response.json();
			setOrders((prev) =>
				prev.map((order) =>
					order.id === orderId ? updatedOrder : order
				)
			);
			return updatedOrder;
		} catch (err) {
			setError(
				err instanceof Error
					? err.message
					: "Failed to update order status"
			);
			console.error("Error updating order status:", err);
			return null;
		}
	};

	return (
		<OrderContext.Provider
			value={{
				orders,
				loading,
				error,
				filters,
				setFilters,
				createOrder,
				updateOrderStatus,
				refreshOrders: fetchOrders,
			}}
		>
			{children}
		</OrderContext.Provider>
	);
};

export const useOrders = () => {
	const context = useContext(OrderContext);
	if (context === undefined) {
		throw new Error("useOrders must be used within an OrderProvider");
	}
	return context;
};
