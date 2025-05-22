import React, { useState } from "react";
import PropTypes from "prop-types";
import { API_URL } from "../config";
import { toast } from "react-toastify";
import { StatusDropdown } from "./StatusDropdown";
import { getStatusColor } from "../utils/statusUtils";
import { ORDER_STATUS_LABELS } from "../types";
import { StatusHistory } from "./StatusHistory";

export const OrderItemsDetailView = ({
	items,
	canEdit = false,
	onItemUpdate,
}) => {
	const handleStatusChange = async (itemId, newStatus) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("Authentication required");
				return;
			}

			const response = await fetch(
				`${API_URL}/order-items/${itemId}/status`,
				{
					method: "PUT",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ status: newStatus }),
				}
			);

			if (!response.ok) {
				throw new Error("Failed to update item status");
			}

			const updatedItem = await response.json();
			if (onItemUpdate) {
				onItemUpdate(updatedItem);
			}

			toast.success("Item status updated successfully");
		} catch (error) {
			console.error("Error updating item status:", error);
			toast.error("Error updating item status");
		}
	};

	// State to manage expanded history for each item
	const [expandedHistoryItemId, setExpandedHistoryItemId] = useState(null);
	const [itemHistory, setItemHistory] = useState({});
	const [loadingHistory, setLoadingHistory] = useState({});

	const fetchItemHistory = async (itemId) => {
		if (itemHistory[itemId]) return; // Don't refetch if already have it

		setLoadingHistory((prev) => ({ ...prev, [itemId]: true }));
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("Authentication required");
				setLoadingHistory((prev) => ({ ...prev, [itemId]: false }));
				return;
			}

			const response = await fetch(`${API_URL}/order-items/${itemId}/history`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to fetch item history");
			}

			const historyData = await response.json();
			setItemHistory((prev) => ({ ...prev, [itemId]: historyData }));
		} catch (error) {
			console.error("Error fetching item history:", error);
			toast.error("Error fetching item history");
		} finally {
			setLoadingHistory((prev) => ({ ...prev, [itemId]: false }));
		}
	};

	const toggleHistory = (itemId) => {
		if (expandedHistoryItemId === itemId) {
			setExpandedHistoryItemId(null);
		} else {
			setExpandedHistoryItemId(itemId);
			fetchItemHistory(itemId);
		}
	};

	return (
		<div className="space-y-4">
			<h4 className="text-sm font-medium text-gray-900 mb-2">
				Items & Quantities
			</h4>
			<div className="bg-white shadow rounded-lg">
				<div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-600 items-center">
					<div className="col-span-3">Denier</div>
					<div className="col-span-3">SL Number</div>
					<div className="col-span-3">Quantity (KG)</div>
					<div className="col-span-3">Status</div>
				</div>
				<div className="divide-y divide-gray-200">
					{items.map((item) => (
						<div
							key={item.id}
							className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50"
						>
							<div className="col-span-3">{item.denier || "-"}</div>
							<div className="col-span-3">{item.slNumber || "-"}</div>
							<div className="col-span-3">{item.quantity}</div>
							<div className="col-span-3 flex items-center">
								{canEdit ? (
									<StatusDropdown
										value={item.status}
										onChange={(e) =>
											handleStatusChange(
												item.id,
												e.target.value
											)
										}
										className="w-full"
									/>
								) : (
									<span
										className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
											item.status
										)}`}
									>
										{ORDER_STATUS_LABELS[item.status]}
									</span>
								)}
								{/* History button */}
								<button
									onClick={() => toggleHistory(item.id)}
									className="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
									title="View status history"
								>
									<svg
										className={`w-4 h-4 transform transition-transform duration-200 ${
											expandedHistoryItemId === item.id ? "rotate-180" : ""
										}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M19 9l-7 7-7-7"
										/>
									</svg>
								</button>
							</div>
							{/* Expanded history row */}
							{expandedHistoryItemId === item.id && (
								<div className="col-span-12 pl-12 pr-4 py-2 bg-gray-100">
									{loadingHistory[item.id] ? (
										<div className="text-sm text-gray-600">Loading history...</div>
									) : itemHistory[item.id] && itemHistory[item.id].length > 0 ? (
										<StatusHistory history={itemHistory[item.id]} />
									) : (
										<div className="text-sm text-gray-600">No history available.</div>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

OrderItemsDetailView.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			denier: PropTypes.string,
			slNumber: PropTypes.string,
			quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
			status: PropTypes.string.isRequired,
		})
	).isRequired,
	canEdit: PropTypes.bool,
	onItemUpdate: PropTypes.func,
};
