import React, { useState, FormEvent } from "react";
import { useOrders } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { OrderStatus, ORDER_STATUS_LABELS } from "../types";
import { format } from "date-fns";
import { Filter, Search, RefreshCw } from "lucide-react";

export const OrderDashboard: React.FC = () => {
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
	} = useOrders();

	const [showNewOrderForm, setShowNewOrderForm] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");

	// Form state for new order
	const [newOrder, setNewOrder] = useState({
		sdyNumber: "",
		date: format(new Date(), "yyyy-MM-dd"),
		partyName: "",
		deliveryParty: "",
		denier: "",
		slNumber: "",
	});

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setNewOrder((prev) => ({ ...prev, [name]: value }));
	};

	const handleSearch = (e: FormEvent) => {
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

	const handleNewOrderSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!currentUser) return;

		try {
			await createOrder({
				...newOrder,
				salespersonId: currentUser.id,
				salesperson: {
					id: currentUser.id,
					username: currentUser.username,
				},
			});

			setShowNewOrderForm(false);
			setNewOrder({
				sdyNumber: "",
				date: format(new Date(), "yyyy-MM-dd"),
				partyName: "",
				deliveryParty: "",
				denier: "",
				slNumber: "",
			});

			refreshOrders(); // Refresh orders after creating a new one
		} catch (error) {
			console.error("Failed to create order:", error);
		}
	};

	const handleStatusUpdate = async (
		orderId: string,
		newStatus: OrderStatus
	) => {
		try {
			await updateOrderStatus(orderId, newStatus);
		} catch (error) {
			console.error("Failed to update order status:", error);
		}
	};

	if (loading) {
		return <div className="p-4">Loading orders...</div>;
	}

	if (error) {
		return <div className="p-4 text-red-500">Error: {error}</div>;
	}

	return (
		<div>
			{currentUser &&
				["admin", "operator"].includes(currentUser.role) && (
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
									Salesperson
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									Actions
								</th>
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
									<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
										{currentUser &&
											[
												"admin",
												"factory",
												"operator",
											].includes(currentUser.role) && (
												<Select
													value={order.currentStatus}
													onChange={(e) =>
														handleStatusUpdate(
															order.id,
															e.target
																.value as OrderStatus
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
											)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>

			{/* New Order Form Modal */}
			{showNewOrderForm && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
					<div className="bg-white p-6 rounded-lg w-full max-w-md">
						<h3 className="text-xl font-bold mb-4">
							Add New Order
						</h3>
						<form
							onSubmit={handleNewOrderSubmit}
							className="space-y-4"
						>
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
									htmlFor="denier"
									className="block text-sm font-medium text-gray-700"
								>
									Denier
								</label>
								<Input
									id="denier"
									name="denier"
									value={newOrder.denier}
									onChange={handleInputChange}
									placeholder="Denier"
									required
								/>
							</div>

							<div>
								<label
									htmlFor="slNumber"
									className="block text-sm font-medium text-gray-700"
								>
									SL Number
								</label>
								<Input
									id="slNumber"
									name="slNumber"
									value={newOrder.slNumber}
									onChange={handleInputChange}
									placeholder="SL Number"
									required
								/>
							</div>

							<div className="flex justify-end gap-2">
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
