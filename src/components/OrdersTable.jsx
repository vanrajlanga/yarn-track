import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { toast } from "react-toastify";
import { useOrders } from "../context/OrderContext";

/**
 * A component for displaying orders in a table format
 */
export const OrdersTable = ({
	orders,
	canEditOrders,
	canRequestChanges = false,
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

	// Get canChangeStatus, currentPage, setCurrentPage, itemsPerPage, totalOrders from context
	const { canChangeStatus, currentPage, setCurrentPage, itemsPerPage, totalOrders } = useOrders();

	// State to manage the visibility and position of the tooltip
	const [activeTooltip, setActiveTooltip] = useState(null);

	const tooltipHideTimeout = useRef(null);

	const showTooltip = (order, event) => {
		const iconRect = event.currentTarget.getBoundingClientRect();
		const spaceAbove = iconRect.top;
		const spaceBelow = window.innerHeight - iconRect.bottom;
		const direction = spaceBelow > spaceAbove ? 'bottom' : 'top';

		// Calculate tooltip position
		const tooltipWidth = 400; // Approximate tooltip width (from w-[400px])

		let top = 0;
		let left = iconRect.left + iconRect.width / 2 - tooltipWidth / 2;

		// Adjust top based on direction
		if (direction === 'top') {
			// Position above the icon. Need actual tooltip height for accurate positioning.
			// For now, using a placeholder height (approx 150px based on content).
			top = iconRect.top - 150 - 5; // 150 is a placeholder, 5 for gap
		} else {
			// Position below the icon
			top = iconRect.bottom + 5; // 5 for gap
		}

		// Ensure tooltip is not off-screen horizontally
		if (left < 0) {
			left = 0;
		} else if (left + tooltipWidth > window.innerWidth) {
			left = window.innerWidth - tooltipWidth;
		}

		setActiveTooltip({
			order,
			top,
			left,
			direction,
		});
	};

	const hideTooltip = () => {
		// Set a timeout to hide the tooltip
		tooltipHideTimeout.current = setTimeout(() => {
			setActiveTooltip(null);
		}, 100);
	};

	const cancelHideTooltip = () => {
		// Clear the timeout if the cursor enters the tooltip
		if (tooltipHideTimeout.current) {
			clearTimeout(tooltipHideTimeout.current);
			tooltipHideTimeout.current = null;
		}
	};

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
				fetch(`${import.meta.env.VITE_API_URL}/change-requests?status=pending`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: abortController.signal,
				}),
				fetch(`${import.meta.env.VITE_API_URL}/change-requests?status=approved`, {
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
				`${import.meta.env.VITE_API_URL}/change-requests/${editingRequestId}/mark-used`,
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
				`${import.meta.env.VITE_API_URL}/orders/${editOrder.id}`,
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

	const totalPages = Math.ceil(totalOrders / itemsPerPage);

	const handlePreviousPage = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
		}
	};

	const handleNextPage = () => {
		if (currentPage < totalPages) {
			setCurrentPage(currentPage + 1);
		}
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
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative z-10">
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
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative z-10">
								Deniers & SLs
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Salesperson
							</th>
							{/* Actions column remains if either edit or change request is allowed */}
							{(canEditOrders || canRequestChanges) && (
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
							)}
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{orders.map((order, index) => (
							<React.Fragment key={order.id}>
								<tr>
									<td className="px-6 py-4 w-10">
										<div className="flex space-x-2">
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
										{/* Original OrderItemsView with dynamic tooltip - icon and basic view */}
										<div
											className="relative inline-block group"
											onMouseEnter={(event) => showTooltip(order, event)}
											onMouseLeave={hideTooltip}
										>
											<OrderItemsView items={order.items} />

											{/* Info icon */}
											<svg
												xmlns="http://www.w3.org/2000/svg"
												className="h-4 w-4 text-gray-400 cursor-help inline-block ml-1 align-middle"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
												/>
											</svg>
										</div>
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.salesperson?.username}
									</td>
									{/* Actions column remains if either edit or change request is allowed */}
									{(canEditOrders || canRequestChanges) && (
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
													// Only allow factory users to edit order items detail view
													canEdit={currentUser?.role === "factory"}
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
							</React.Fragment>
						))}
					</tbody>
				</table>
			</div>

			{/* Pagination Controls */}
			<div className="flex justify-between items-center mt-4 px-6 py-3">
				<span>
					Showing {orders.length} of {totalOrders} orders
				</span>
				<div className="flex space-x-4 items-center">
					<Button onClick={handlePreviousPage} disabled={currentPage === 1}>
						Previous
					</Button>
					<span>
						Page {currentPage} of {totalPages}
					</span>
					<Button onClick={handleNextPage} disabled={currentPage === totalPages}>
						Next
					</Button>
				</div>
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

			{/* Global Tooltip positioned relative to the viewport */}
			{activeTooltip && (
				<span
					className={`fixed w-[400px] p-2 bg-white border border-gray-300 text-xs rounded-md transition-opacity duration-200 z-[10000] shadow-lg ${activeTooltip.direction === 'top' ? '' : ''}`}
					style={{
						top: activeTooltip.top,
						left: activeTooltip.left,
					}}
					onMouseEnter={cancelHideTooltip}
					onMouseLeave={hideTooltip}
				>
					<OrderItemsDetailView items={activeTooltip.order.items} canEdit={false} onItemUpdate={() => {}} />
				</span>
			)}
		</>
	);
};

OrdersTable.propTypes = {
	orders: PropTypes.array.isRequired,
	canEditOrders: PropTypes.bool.isRequired,
	canRequestChanges: PropTypes.bool,
	refreshOrders: PropTypes.func.isRequired,
	isFactoryUser: PropTypes.bool,
	activeStatusFilter: PropTypes.string,
};
