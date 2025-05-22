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
	const [allOrders, setAllOrders] = useState([]);
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
		// Operator can edit all, Factory can edit only Party Name. Sales and Admin cannot edit.
		() => ["factory", "operator"].includes(currentUser?.role),
		[currentUser]
	);

	const canAddOrders = useMemo(
		// Only operator role can add orders
		() => ["operator"].includes(currentUser?.role),
		[currentUser]
	);

	const canRequestChanges = useMemo(
		() => ["factory", "operator"].includes(currentUser?.role),
		[currentUser]
	);

	const canChangeStatus = useMemo(
		// Only operator role can change status
		() => ["operator"].includes(currentUser?.role),
		[currentUser]
	);

	// Memoize query params construction
	const constructQueryParams = useCallback(() => {
		const params = new URLSearchParams();
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
			const url = `${import.meta.env.VITE_API_URL}/orders${
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
			setAllOrders(data);
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

	// Memoize filtered orders based on status
	const filteredOrders = useMemo(() => {
		if (filters.status === "all") {
			return allOrders;
		}

		return allOrders.filter(order =>
			order.items && order.items.some(item => item.status === filters.status)
		);
	}, [allOrders, filters.status]);

	const fetchSalesUsers = useCallback(async () => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				return;
			}

			const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/sales-users`, {
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

			const response = await fetch(`${import.meta.env.VITE_API_URL}/orders`, {
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
			setAllOrders((prev) => [...prev, newOrder]);
			return newOrder;
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to create order"
			);
			console.error("Error creating order:", err);
			return null;
		}
	};

	const value = useMemo(
		() => ({
			orders: filteredOrders,
			allOrders: allOrders,
			salesUsers,
			loading,
			error,
			filters,
			setFilters,
			createOrder,
			refreshOrders,
			canEditOrders,
			canAddOrders,
			canRequestChanges,
			fetchSalesUsers,
		}),
		[allOrders, filteredOrders, salesUsers, loading, error, filters, setFilters, createOrder, refreshOrders, canEditOrders, canAddOrders, canRequestChanges, fetchSalesUsers]
	);

	return (
		<OrderContext.Provider value={value}>
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
