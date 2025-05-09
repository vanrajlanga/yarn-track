import React, { useState } from "react";
import { useOrders } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { ORDER_STATUS_LABELS } from "../types";
import { format } from "date-fns";
import { Filter, Search, RefreshCw, Plus, Trash2 } from "lucide-react";

export const OrderDashboard = () => {
	const { currentUser } = useAuth();
	const {
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
		salesUsers,
	} = useOrders();

	const [showNewOrderForm, setShowNewOrderForm] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");

	// Form state for new order with separate deniers and slNumbersWithQuantities
	const [newOrder, setNewOrder] = useState({
		sdyNumber: "",
		date: format(new Date(), "yyyy-MM-dd"),
		partyName: "",
		deliveryParty: "",
		salespersonId: "", // Add this to the initial state
		deniers: [""], // Array of denier values
		slNumbersWithQuantities: [{ slNumber: "", quantity: 1 }], // Array of SL number and quantity pairs
	});

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setNewOrder((prev) => ({ ...prev, [name]: value }));
	};

	const handleDenierChange = (index, value) => {
		setNewOrder((prev) => {
			const newDeniers = [...prev.deniers];
			newDeniers[index] = value;
			return { ...prev, deniers: newDeniers };
		});
	};

	const addDenier = () => {
		setNewOrder((prev) => ({
			...prev,
			deniers: [...prev.deniers, ""],
		}));
	};

	const removeDenier = (index) => {
		if (newOrder.deniers.length <= 1) return; // Keep at least one denier field
		setNewOrder((prev) => {
			const newDeniers = prev.deniers.filter((_, i) => i !== index);
			return { ...prev, deniers: newDeniers };
		});
	};

	const handleSlNumberWithQuantityChange = (index, field, value) => {
		setNewOrder((prev) => {
			const newItems = [...prev.slNumbersWithQuantities];
			newItems[index] = { ...newItems[index], [field]: value };
			return { ...prev, slNumbersWithQuantities: newItems };
		});
	};

	const addSlNumberWithQuantity = () => {
		setNewOrder((prev) => ({
			...prev,
			slNumbersWithQuantities: [
				...prev.slNumbersWithQuantities,
				{ slNumber: "", quantity: 1 },
			],
		}));
	};

	const removeSlNumberWithQuantity = (index) => {
		if (newOrder.slNumbersWithQuantities.length <= 1) return; // Keep at least one SL Number with Qty
		setNewOrder((prev) => {
			const newItems = prev.slNumbersWithQuantities.filter(
				(_, i) => i !== index
			);
			return { ...prev, slNumbersWithQuantities: newItems };
		});
	};

	const handleSearch = (e) => {
		e.preventDefault();
		setFilters({ ...filters, searchTerm: searchInput });
	};

	const clearFilters = () => {
		setFilters({
			status: "all",
			searchTerm: "",
			salespersonId: "all",
			startDate: "",
			endDate: "",
		});
		setSearchInput("");
	};

	const handleNewOrderSubmit = async (e) => {
		e.preventDefault();
		if (!currentUser || !canAddOrders) return;

		// Validate inputs
		const hasEmptyDeniers = newOrder.deniers.some((d) => !d.trim());
		const hasEmptySlNumbersWithQuantities =
			newOrder.slNumbersWithQuantities.some(
				(item) => !item.slNumber.trim() || !item.quantity
			);

		// At least one of deniers or slNumbersWithQuantities must have valid entries
		if (
			hasEmptyDeniers &&
			newOrder.deniers.length === 1 &&
			hasEmptySlNumbersWithQuantities &&
			newOrder.slNumbersWithQuantities.length === 1
		) {
			alert(
				"You must enter at least one Denier or one SL Number with Quantity."
			);
			return;
		}

		// Validate salesperson is selected (only required for admin/operator)
		if (
			["admin", "operator"].includes(currentUser.role) &&
			!newOrder.salespersonId
		) {
			alert("Please select a salesperson for this order.");
			return;
		}

		// Filter out empty entries
		const deniers = newOrder.deniers.filter((d) => d.trim());
		const slNumbersWithQuantities = newOrder.slNumbersWithQuantities.filter(
			(item) => item.slNumber.trim() && item.quantity
		);

		// Determine which salesperson ID to use
		const salespersonId = ["admin", "operator"].includes(currentUser.role)
			? newOrder.salespersonId // Use the selected salesperson for admin/operator
			: currentUser.id; // Use current user for sales role

		// Find the selected salesperson's details if needed
		const selectedSalesperson = ["admin", "operator"].includes(
			currentUser.role
		)
			? salesUsers.find(
					(u) => u.id.toString() === newOrder.salespersonId.toString()
			  ) || { id: newOrder.salespersonId, username: "Unknown" }
			: { id: currentUser.id, username: currentUser.username };

		try {
			await createOrder({
				...newOrder,
				deniers,
				slNumbersWithQuantities,
				salespersonId,
				salesperson: selectedSalesperson,
			});

			setShowNewOrderForm(false);
			// Reset form
			setNewOrder({
				sdyNumber: "",
				date: format(new Date(), "yyyy-MM-dd"),
				partyName: "",
				deliveryParty: "",
				salespersonId: "",
				deniers: [""],
				slNumbersWithQuantities: [{ slNumber: "", quantity: 1 }],
			});

			refreshOrders(); // Refresh orders after creating a new one
		} catch (error) {
			console.error("Failed to create order:", error);
		}
	};

	const handleStatusUpdate = async (orderId, newStatus) => {
		if (!canEditOrders) return;

		try {
			await updateOrderStatus(orderId, newStatus);
		} catch (error) {
			console.error("Failed to update order status:", error);
		}
	};

	// Helper function to render items for display in the table
	const renderOrderItems = (order) => {
		if (!order.items || order.items.length === 0) {
			return <div className="text-sm text-gray-500">No items</div>;
		}

		const deniers = order.items
			.filter((item) => item.itemType === "denier")
			.map((item) => item.denier);

		const slWithQty = order.items
			.filter((item) => item.itemType === "sl_quantity")
			.map((item) => ({
				slNumber: item.slNumber,
				quantity: item.quantity,
			}));

		return (
			<div className="space-y-2">
				{deniers.length > 0 && (
					<div className="text-sm">
						<span className="font-semibold">Deniers:</span>{" "}
						{deniers.join(", ")}
					</div>
				)}
				{slWithQty.length > 0 && (
					<div className="text-sm space-y-1">
						<span className="font-semibold">SL Numbers:</span>
						{slWithQty.map((item, idx) => (
							<div key={idx} className="ml-2">
								{item.slNumber}{" "}
								<span className="font-semibold">
									(Qty: {item.quantity})
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		);
	};

	if (loading) {
		return <div className="p-4">Loading orders...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">Error: {error}</div>;
	}

	return (
		<div>
			{canAddOrders && (
				<div className="mb-6">
					<Button onClick={() => setShowNewOrderForm(true)}>
						Add New Order
					</Button>
				</div>
			)}
			<div className="bg-white rounded-lg shadow mb-6">
				<div className="px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center">
					<h3 className="text-lg font-medium text-gray-900">
						Orders
					</h3>

					<div className="flex items-center space-x-2">
						<form onSubmit={handleSearch} className="relative">
							<input
								type="text"
								placeholder="Search orders..."
								value={searchInput}
								onChange={(e) => setSearchInput(e.target.value)}
								className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
							/>
							<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
						</form>

						<Button
							variant="outline"
							size="sm"
							icon={<Filter className="h-4 w-4" />}
							onClick={() => setIsFilterOpen(!isFilterOpen)}
						>
							Filters
						</Button>

						<Button
							variant="outline"
							size="sm"
							icon={<RefreshCw className="h-4 w-4" />}
							onClick={() => {
								clearFilters();
								refreshOrders();
							}}
						>
							Reset
						</Button>
					</div>
				</div>

				{isFilterOpen && (
					<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div>
								<label
									htmlFor="statusFilter"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Status
								</label>
								<Select
									id="statusFilter"
									value={filters.status}
									onChange={(e) =>
										setFilters({
											...filters,
											status: e.target.value,
										})
									}
								>
									<option value="all">All Statuses</option>
									<option value="received">Received</option>
									<option value="dyeing">Dyeing</option>
									<option value="dyeing_complete">
										Dyeing Complete
									</option>
									<option value="conning">Conning</option>
									<option value="conning_complete">
										Conning Complete
									</option>
									<option value="packing">Packing</option>
									<option value="packed">Packed</option>
								</Select>
							</div>

							<div>
								<label
									htmlFor="dateFilter"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Order Date
								</label>
								<div className="flex items-center space-x-2">
									<Input
										type="date"
										value={filters.startDate}
										onChange={(e) =>
											setFilters({
												...filters,
												startDate: e.target.value,
											})
										}
									/>
									<span className="text-gray-500">to</span>
									<Input
										type="date"
										value={filters.endDate}
										onChange={(e) =>
											setFilters({
												...filters,
												endDate: e.target.value,
											})
										}
									/>
								</div>
							</div>
						</div>
					</div>
				)}

				<div className="px-6 py-2 border-b border-gray-200 bg-gray-50 text-sm text-gray-500">
					Showing {orders.length} order
					{orders.length !== 1 ? "s" : ""}
				</div>

				{/* Orders Table */}
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200">
						<thead className="bg-gray-50">
							<tr>
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
								{canEditOrders && (
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Actions
									</th>
								)}
							</tr>
						</thead>
						<tbody className="bg-white divide-y divide-gray-200">
							{orders.map((order) => (
								<tr key={order.id}>
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
										{renderOrderItems(order)}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										{order.salesperson?.username}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												order.currentStatus === "packed"
													? "bg-green-100 text-green-800"
													: order.currentStatus ===
													  "received"
													? "bg-blue-100 text-blue-800"
													: "bg-yellow-100 text-yellow-800"
											}`}
										>
											{
												ORDER_STATUS_LABELS[
													order.currentStatus
												]
											}
										</span>
									</td>
									{canEditOrders && (
										<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
											<Select
												value={order.currentStatus}
												onChange={(e) =>
													handleStatusUpdate(
														order.id,
														e.target.value
													)
												}
												className="w-40"
											>
												<option value="received">
													Received
												</option>
												<option value="dyeing">
													Dyeing
												</option>
												<option value="dyeing_complete">
													Dyeing Complete
												</option>
												<option value="conning">
													Conning
												</option>
												<option value="conning_complete">
													Conning Complete
												</option>
												<option value="packing">
													Packing
												</option>
												<option value="packed">
													Packed
												</option>
											</Select>
										</td>
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* New Order Form Modal */}
			{showNewOrderForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-screen overflow-y-auto">
						<h3 className="text-xl font-bold mb-4">
							Add New Order
						</h3>
						<form
							onSubmit={handleNewOrderSubmit}
							className="space-y-4"
						>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="sdyNumber"
										className="block text-sm font-medium text-gray-700"
									>
										SDY Number
									</label>
									<Input
										id="sdyNumber"
										name="sdyNumber"
										value={newOrder.sdyNumber}
										onChange={handleInputChange}
										placeholder="SDY Number"
										required
									/>
								</div>

								<div>
									<label
										htmlFor="date"
										className="block text-sm font-medium text-gray-700"
									>
										Date
									</label>
									<Input
										id="date"
										name="date"
										type="date"
										value={newOrder.date}
										onChange={handleInputChange}
										required
									/>
								</div>

								<div>
									<label
										htmlFor="partyName"
										className="block text-sm font-medium text-gray-700"
									>
										Party Name
									</label>
									<Input
										id="partyName"
										name="partyName"
										value={newOrder.partyName}
										onChange={handleInputChange}
										placeholder="Party Name"
										required
									/>
								</div>

								<div>
									<label
										htmlFor="deliveryParty"
										className="block text-sm font-medium text-gray-700"
									>
										Delivery Party
									</label>
									<Input
										id="deliveryParty"
										name="deliveryParty"
										value={newOrder.deliveryParty}
										onChange={handleInputChange}
										placeholder="Delivery Party"
										required
									/>
								</div>

								<div>
									<label
										htmlFor="salespersonId"
										className="block text-sm font-medium text-gray-700"
									>
										Salesperson
									</label>
									<Select
										id="salespersonId"
										name="salespersonId"
										value={newOrder.salespersonId}
										onChange={handleInputChange}
										required
									>
										<option value="">
											Select Salesperson
										</option>
										{salesUsers.map((user) => (
											<option
												key={user.id}
												value={user.id}
											>
												{user.username}
											</option>
										))}
									</Select>
								</div>
							</div>

							{/* Separate sections for Deniers and SL Numbers with Quantities */}
							<div className="space-y-4">
								{/* Deniers Section */}
								<div>
									<div className="flex items-center justify-between mb-2">
										<label className="block text-sm font-medium text-gray-700">
											Deniers
										</label>
										<Button
											type="button"
											size="sm"
											onClick={addDenier}
											className="flex items-center"
										>
											<Plus className="h-4 w-4 mr-1" />{" "}
											Add Denier
										</Button>
									</div>

									<div className="space-y-3">
										{newOrder.deniers.map(
											(denier, index) => (
												<div
													key={index}
													className="flex items-center space-x-2 bg-gray-50 p-2 rounded"
												>
													<div className="flex-1">
														<Input
															value={denier}
															onChange={(e) =>
																handleDenierChange(
																	index,
																	e.target
																		.value
																)
															}
															placeholder="Denier"
														/>
													</div>
													{newOrder.deniers.length >
														1 && (
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																removeDenier(
																	index
																)
															}
															title="Remove denier"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											)
										)}
									</div>
								</div>

								{/* SL Numbers with Quantities Section */}
								<div>
									<div className="flex items-center justify-between mb-2">
										<label className="block text-sm font-medium text-gray-700">
											SL Numbers with Quantities
										</label>
										<Button
											type="button"
											size="sm"
											onClick={addSlNumberWithQuantity}
											className="flex items-center"
										>
											<Plus className="h-4 w-4 mr-1" />{" "}
											Add SL Number
										</Button>
									</div>

									<div className="space-y-3">
										{newOrder.slNumbersWithQuantities.map(
											(item, index) => (
												<div
													key={index}
													className="flex items-center space-x-2 bg-gray-50 p-2 rounded"
												>
													<div className="flex-1">
														<label className="block text-xs font-medium text-gray-700">
															SL Number
														</label>
														<Input
															value={
																item.slNumber
															}
															onChange={(e) =>
																handleSlNumberWithQuantityChange(
																	index,
																	"slNumber",
																	e.target
																		.value
																)
															}
															placeholder="SL Number"
														/>
													</div>
													<div className="w-32">
														<label className="block text-xs font-medium text-gray-700">
															Quantity
														</label>
														<Input
															type="number"
															value={
																item.quantity
															}
															min="1"
															onChange={(e) =>
																handleSlNumberWithQuantityChange(
																	index,
																	"quantity",
																	parseInt(
																		e.target
																			.value
																	) || 1
																)
															}
														/>
													</div>
													{newOrder
														.slNumbersWithQuantities
														.length > 1 && (
														<Button
															type="button"
															variant="outline"
															size="sm"
															onClick={() =>
																removeSlNumberWithQuantity(
																	index
																)
															}
															className="mt-5"
															title="Remove item"
														>
															<Trash2 className="h-4 w-4 text-red-500" />
														</Button>
													)}
												</div>
											)
										)}
									</div>
								</div>
							</div>

							<div className="flex justify-end gap-2 pt-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => setShowNewOrderForm(false)}
								>
									Cancel
								</Button>
								<Button type="submit">Create Order</Button>
							</div>
						</form>
					</div>
				</div>
			)}
		</div>
	);
};
