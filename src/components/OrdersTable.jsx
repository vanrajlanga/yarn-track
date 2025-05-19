import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "../types";
import { getStatusColor } from "../utils/statusUtils";
import { useAuth } from "../context/AuthContext";
import { StatusDropdown } from "./StatusDropdown";
import { OrderItemsView } from "./OrderItemsView";
import { OrderItemsDetailView } from "./OrderItemsDetailView";
import { StatusHistory } from "./StatusHistory";
import { Button } from "./ui/Button";
import { ChangeRequestModal } from "./ChangeRequestModal";
import { OrderModal } from "./OrderModal";
import { API_URL } from "../config";
import { toast } from "react-toastify";

/**
 * A component for displaying orders in a table format
 */
export const OrdersTable = ({
	orders,
	canEditOrders,
	canRequestChanges = false,
	onStatusUpdate,
	refreshOrders,
	isFactoryUser = false,
	activeStatusFilter = null,
}) => {
	const [changeRequestOrder, setChangeRequestOrder] = useState(null);
	const [pendingRequests, setPendingRequests] = useState({});
	const [approvedRequests, setApprovedRequests] = useState({});
	const [loadingRequests, setLoadingRequests] = useState(false);
	const [editingRequestId, setEditingRequestId] = useState(null);
	const [editOrder, setEditOrder] = useState(null);
	const [expandedOrder, setExpandedOrder] = useState(null);
	const [itemsView, setItemsView] = useState(null);
	const [orderFormData, setOrderFormData] = useState({
		sdyNumber: "",
		date: "",
		partyName: "",
		deliveryParty: "",
		salespersonId: "",
		orderItems: [{ denier: "", slNumber: "", quantity: "" }],
	});
	const { currentUser } = useAuth();

	// Memoize orders.length to prevent unnecessary re-renders
	const ordersCount = useMemo(() => orders.length, [orders]);

	// Memoize fetch function to prevent recreation on every render
	const fetchChangeRequests = useCallback(async () => {
		const abortController = new AbortController();

		if (!canRequestChanges || ordersCount === 0) return;

		setLoadingRequests(true);
		try {
			const token = localStorage.getItem("token");
			if (!token) return;

			// Use Promise.all to fetch both requests simultaneously
			const [pendingResponse, approvedResponse] = await Promise.all([
				fetch(`${API_URL}/change-requests?status=pending`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: abortController.signal,
				}),
				fetch(`${API_URL}/change-requests?status=approved`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: abortController.signal,
				}),
			]);

			if (pendingResponse.ok) {
				const pendingData = await pendingResponse.json();
				// Create a map of orderId -> pending requests
				const pendingMap = {};
				pendingData.forEach((request) => {
					if (!pendingMap[request.orderId]) {
						pendingMap[request.orderId] = [];
					}
					pendingMap[request.orderId].push(request);
				});
				setPendingRequests(pendingMap);
			}

			if (approvedResponse.ok) {
				const approvedData = await approvedResponse.json();
				// Create a map of orderId -> approved requests
				const approvedMap = {};
				approvedData.forEach((request) => {
					if (!approvedMap[request.orderId]) {
						approvedMap[request.orderId] = [];
					}
					approvedMap[request.orderId].push(request);
				});
				setApprovedRequests(approvedMap);
			}
		} catch (err) {
			console.error("Error fetching change requests:", err);
		} finally {
			setLoadingRequests(false);
		}

		return () => {
			abortController.abort();
		};
	}, [canRequestChanges, ordersCount]);

	// Fetch change requests when required
	useEffect(() => {
		fetchChangeRequests();
	}, [fetchChangeRequests]);

	const handleRequestChange = (order) => {
		setChangeRequestOrder(order);
	};

	const handleCloseModal = () => {
		setChangeRequestOrder(null);
		setEditOrder(null);
		setEditingRequestId(null);
	};

	const handleSuccessfulRequest = (data) => {
		// Update pending requests map
		setPendingRequests((prev) => {
			const orderId = data.changeRequest.orderId;
			const newRequests = { ...prev };

			if (!newRequests[orderId]) {
				newRequests[orderId] = [];
			}
			newRequests[orderId].push(data.changeRequest);

			return newRequests;
		});
		handleCloseModal();
	};

	// Check if an order has a pending change request
	const hasPendingRequest = (orderId) => {
		return pendingRequests[orderId] && pendingRequests[orderId].length > 0;
	};

	// Check if an order has an approved change request that hasn't been used yet
	const hasUnusedApprovedRequest = (orderId) => {
		// Check if there are any approved requests for this order that haven't been used
		if (!approvedRequests[orderId] || !approvedRequests[orderId].length) {
			return false;
		}

		// Check if there's at least one approved request that hasn't been used yet
		return approvedRequests[orderId].some((request) => !request.isEditUsed);
	};

	// Get the first unused approved request for an order
	const getFirstUnusedApprovedRequest = (orderId) => {
		if (!approvedRequests[orderId] || !approvedRequests[orderId].length) {
			return null;
		}

		return (
			approvedRequests[orderId].find((request) => !request.isEditUsed) ||
			null
		);
	};

	// Handle edit button click
	const handleEdit = (order) => {
		// Get the first unused approved request
		const unusedRequest = getFirstUnusedApprovedRequest(order.id);

		if (!unusedRequest) {
			console.error(
				"No unused approved change requests found for this order"
			);
			toast.error(
				"No unused approved change requests found for this order"
			);
			return;
		}

		// Store the request ID we're editing
		setEditingRequestId(unusedRequest.id);

		// Prepare order data for editing
		const formattedOrder = {
			...order,
			orderItems: order.items.map((item) => ({
				denier: item.denier || "",
				slNumber: item.slNumber || "",
				quantity: item.quantity || "",
			})),
		};

		setEditingRequestId(unusedRequest.id);
		setOrderFormData(formattedOrder);
		setEditOrder(order);
	};

	// Handle form changes in edit mode
	const handleChange = (e) => {
		const { name, value } = e.target;
		setOrderFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Handle order item changes
	const handleOrderItemChange = (index, field, value) => {
		setOrderFormData((prev) => {
			const newOrderItems = [...prev.orderItems];
			newOrderItems[index] = {
				...newOrderItems[index],
				[field]:
					field === "quantity" && value ? parseInt(value, 10) : value,
			};
			return {
				...prev,
				orderItems: newOrderItems,
			};
		});
	};

	// Handle adding new order item
	const handleAddOrderItem = () => {
		setOrderFormData((prev) => ({
			...prev,
			orderItems: [
				...prev.orderItems,
				{ denier: "", slNumber: "", quantity: "" },
			],
		}));
	};

	// Handle removing order item
	const handleRemoveOrderItem = (index) => {
		setOrderFormData((prev) => {
			if (prev.orderItems.length <= 1) {
				return prev; // Keep at least one item
			}
			return {
				...prev,
				orderItems: prev.orderItems.filter((_, i) => i !== index),
			};
		});
	};

	// Handle form submission for editing
	const handleEditSubmit = async (e) => {
		e.preventDefault();

		try {
			const token = localStorage.getItem("token");
			if (!token || !editingRequestId) {
				toast.error("Authentication required");
				return;
			}

			// First, mark the change request as used
			const markUsedResponse = await fetch(
				`${API_URL}/change-requests/${editingRequestId}/mark-used`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
				}
			);

			if (!markUsedResponse.ok) {
				console.error(
					"Failed to mark change request as used:",
					markUsedResponse.status
				);
				toast.error(
					"Failed to mark change request as used. Please try again."
				);
				return;
			}

			// Create submitted data based on user role
			let submittedData;
			if (currentUser.role === "factory") {
				// For factory users, only send deliveryParty field
				submittedData = {
					deliveryParty: orderFormData.deliveryParty,
				};
			} else {
				// For other users, send all fields except date
				const { date, ...otherData } = orderFormData;
				submittedData = otherData;
			}

			// Send the update to the server
			const updateResponse = await fetch(
				`${API_URL}/orders/${editOrder.id}`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify(submittedData),
				}
			);

			if (!updateResponse.ok) {
				const errorData = await updateResponse.json();
				toast.error(
					errorData.error ||
						"Failed to update order. Please try again."
				);
				return;
			}

			const updatedOrder = await updateResponse.json();
			console.log("Order updated successfully:", updatedOrder);

			try {
				// Update local state to mark the request as used
				setApprovedRequests((prev) => {
					const orderId = editOrder.id;
					const newRequests = { ...prev };

					if (newRequests[orderId]) {
						newRequests[orderId] = newRequests[orderId].map(
							(request) =>
								request.id === editingRequestId
									? { ...request, isEditUsed: true }
									: request
						);
					}

					return newRequests;
				});

				// Refresh the orders list
				await refreshOrders();

				// Close the modal and show success message after everything is successful
				handleCloseModal();
				toast.success("Order updated successfully");
			} catch (err) {
				console.error("Error during update:", err);
				toast.error("Error updating order list. Please try again.");
			}
		} catch (error) {
			console.error("Error submitting order edit:", error);
			toast.error("Error submitting order edit. Please try again.");
		}
	};

	// Handler for order item updates
	const handleOrderItemUpdate = (orderId, updatedItem) => {
		setOrderFormData((prev) => {
			const updatedOrders = orders.map((order) => {
				if (order.id === orderId) {
					return {
						...order,
						items: order.items.map((item) =>
							item.id === updatedItem.id
								? { ...item, ...updatedItem }
								: item
						),
					};
				}
				return order;
			});
			return updatedOrders;
		});

		// Trigger a refresh to update the UI
		refreshOrders();
	};

	return (
		<>
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
								<span className="sr-only">Expand</span>
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								SDY Number
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Date
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Party Name
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Delivery Party
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Deniers & SLs
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Salesperson
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							{(canEditOrders || canRequestChanges) && (
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{orders.map((order) => (
							<React.Fragment key={order.id}>
								<tr
									className={
										expandedOrder === order.id
											? "bg-gray-50"
											: ""
									}
								>
									<td className="px-6 py-4 w-10">
										<div className="flex space-x-2">
											<button
												onClick={() =>
													setExpandedOrder(
														expandedOrder ===
															order.id
															? null
															: order.id
													)
												}
												className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
											>
												<svg
													className={`w-5 h-5 transform transition-transform duration-200 ${
														expandedOrder ===
														order.id
															? "rotate-90"
															: ""
													}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M9 5l7 7-7 7"
													/>
												</svg>
											</button>
											<button
												onClick={() =>
													setItemsView(
														itemsView === order.id
															? null
															: order.id
													)
												}
												className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
												title="Toggle items view"
											>
												<svg
													className={`w-5 h-5 transform transition-transform duration-200 ${
														itemsView === order.id
															? "rotate-90"
															: ""
													}`}
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M4 6h16M4 12h16m-7 6h7"
													/>
												</svg>
											</button>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.sdyNumber}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{format(
											new Date(order.date),
											"dd/MM/yyyy"
										)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.partyName}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.deliveryParty}
									</td>
									<td className="px-6 py-4">
										<OrderItemsView items={order.items} />
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.salesperson?.username}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
												order.currentStatus
											)}`}
										>
											{
												ORDER_STATUS_LABELS[
													order.currentStatus
												]
											}
										</span>
									</td>
									{(canEditOrders || canRequestChanges) && (
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											{canEditOrders && (
												<StatusDropdown
													value={order.currentStatus}
													onChange={(e) =>
														onStatusUpdate(
															order.id,
															e.target.value
														)
													}
													className="w-40"
												/>
											)}

											{/* Show Edit button when there's an unused approved change request */}
											{canRequestChanges &&
												hasUnusedApprovedRequest(
													order.id
												) && (
													<Button
														size="sm"
														variant="primary"
														className="ml-2"
														onClick={() =>
															handleEdit(order)
														}
														title="Edit order (one-time use after approval)"
													>
														Edit Order
													</Button>
												)}

											{/* Show Request Change button when no pending request and no unused approved requests */}
											{canRequestChanges &&
												!hasUnusedApprovedRequest(
													order.id
												) &&
												!hasPendingRequest(
													order.id
												) && (
													<Button
														size="sm"
														variant="outline"
														className="ml-2"
														onClick={() =>
															handleRequestChange(
																order
															)
														}
														disabled={hasPendingRequest(
															order.id
														)}
														title={
															hasPendingRequest(
																order.id
															)
																? "Change request already pending"
																: "Request change"
														}
													>
														{hasPendingRequest(
															order.id
														)
															? "Request Pending"
															: "Request Change"}
													</Button>
												)}
										</td>
									)}
								</tr>
								{itemsView === order.id && (
									<tr>
										<td
											colSpan={9}
											className="px-6 py-4 bg-gray-50"
										>
											<div className="border-t border-b border-gray-200 py-4">
												<OrderItemsDetailView
													items={order.items}
													canEdit={
														currentUser.role ===
														"factory"
													}
													onItemUpdate={(
														updatedItem
													) =>
														handleOrderItemUpdate(
															order.id,
															updatedItem
														)
													}
												/>
											</div>
										</td>
									</tr>
								)}
								{expandedOrder === order.id && (
									<tr>
										<td
											colSpan={9}
											className="px-6 py-4 bg-gray-50"
										>
											<div className="border-t border-b border-gray-200 py-4">
												<h4 className="text-sm font-medium text-gray-900 mb-2">
													Status History
												</h4>
												<StatusHistory
													history={
														order.OrderStatusHistories ||
														[]
													}
													currentStatus={
														order.currentStatus
													}
												/>
											</div>
										</td>
									</tr>
								)}
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>

			{/* Change Request Modal */}
			{changeRequestOrder && (
				<ChangeRequestModal
					order={changeRequestOrder}
					onClose={handleCloseModal}
					onSuccess={handleSuccessfulRequest}
				/>
			)}

			{/* Edit Order Modal */}
			{editOrder && (
				<OrderModal
					title="Edit Order"
					formData={orderFormData}
					errors={{}}
					onClose={handleCloseModal}
					onSubmit={handleEditSubmit}
					handleChange={handleChange}
					handleOrderItemChange={handleOrderItemChange}
					handleAddOrderItem={handleAddOrderItem}
					handleRemoveOrderItem={handleRemoveOrderItem}
					submitButtonText="Save Changes"
					isOneTimeEdit={true}
				/>
			)}
		</>
	);
};

OrdersTable.propTypes = {
	orders: PropTypes.array.isRequired,
	canEditOrders: PropTypes.bool.isRequired,
	canRequestChanges: PropTypes.bool,
	onStatusUpdate: PropTypes.func.isRequired,
	isFactoryUser: PropTypes.bool,
	activeStatusFilter: PropTypes.string,
	refreshOrders: PropTypes.func.isRequired,
};
