import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useMemo,
	useCallback,
} from "react";
import PropTypes from "prop-types";
import { useAuth } from "./AuthContext";
import { API_URL } from "../config";

/**
 * @typedef {import('../types').Order} Order
 * @typedef {import('../types').OrderStatus} OrderStatus
 */

/**
 * @typedef {Object} OrderFilters
 * @property {string} status
 * @property {string} searchTerm
 * @property {string} salespersonId
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @typedef {Object} OrderCreateData
 * @property {string} sdyNumber
 * @property {string} date
 * @property {string} partyName
 * @property {string} deliveryParty
 * @property {string|number} salespersonId
 * @property {string} denier
 * @property {string} slNumber
 * @property {Object} salesperson
 * @property {string|number} salesperson.id
 * @property {string} salesperson.username
 */

const OrderContext = createContext(undefined);

export const OrderProvider = ({ children }) => {
	const { currentUser } = useAuth();
	const [orders, setOrders] = useState([]);
	const [salesUsers, setSalesUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [filters, setFilters] = useState({
		status: "all",
		searchTerm: "",
		salespersonId: "all",
		startDate: "",
		endDate: "",
	});

	// Memoize permission checks
	const canEditOrders = useMemo(
		() => ["factory", "operator"].includes(currentUser?.role),
		[currentUser]
	);

	const canAddOrders = useMemo(
		() => ["sales"].includes(currentUser?.role),
		[currentUser]
	);

	const canRequestChanges = useMemo(
		() => ["factory", "operator"].includes(currentUser?.role),
		[currentUser]
	);

	// Memoize query params construction
	const constructQueryParams = useCallback(() => {
		const params = new URLSearchParams();
		if (filters.status !== "all") params.append("status", filters.status);
		if (filters.searchTerm) params.append("searchTerm", filters.searchTerm);
		if (filters.salespersonId !== "all")
			params.append("salespersonId", filters.salespersonId);
		if (filters.startDate) params.append("startDate", filters.startDate);
		if (filters.endDate) params.append("endDate", filters.endDate);
		return params.toString();
	}, [filters]);

	// Memoize fetch function
	const fetchOrders = useCallback(async () => {
		if (!currentUser) return;

		setLoading(true);
		setError(null);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				throw new Error("Not authenticated");
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
	}, [currentUser, constructQueryParams]);

	// Expose fetchOrders as refreshOrders for components
	const refreshOrders = useCallback(fetchOrders, [fetchOrders]);

	// Fetch orders when filters or current user changes
	useEffect(() => {
		if (currentUser) {
			fetchOrders();
		}
	}, [currentUser, fetchOrders]);

	const fetchSalesUsers = useCallback(async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				return;
			}

			const response = await fetch(`${API_URL}/auth/sales-users`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(
					`Failed to fetch sales users: ${response.status} ${response.statusText}`
				);
			}

			const data = await response.json();
			console.log("Sales users fetched:", data); // Debug log
			setSalesUsers(data);
		} catch (err) {
			console.error("Error fetching sales users:", err);
		}
	}, [currentUser]);

	/**
	 * @param {OrderCreateData} orderData
	 * @returns {Promise<Order|null>}
	 */
	const createOrder = async (orderData) => {
		// Add permission check
		if (!canAddOrders) {
			setError("Not authorized to add orders");
			return null;
		}

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

	/**
	 * @param {string} orderId
	 * @param {OrderStatus} status
	 * @returns {Promise<Order|null>}
	 */
	const updateOrderStatus = async (orderId, status) => {
		// Add permission check
		if (!canEditOrders) {
			setError("Not authorized to update order status");
			return null;
		}

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
				refreshOrders,
				canEditOrders,
				canAddOrders,
				canRequestChanges,
				salesUsers,
				fetchSalesUsers,
			}}
		>
			{children}
		</OrderContext.Provider>
	);
};

OrderProvider.propTypes = {
	children: PropTypes.node.isRequired,
};

export const useOrders = () => {
	const context = useContext(OrderContext);
	if (context === undefined) {
		throw new Error("useOrders must be used within an OrderProvider");
	}
	return context;
};
