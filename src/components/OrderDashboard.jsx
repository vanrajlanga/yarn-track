import React, { useState, useEffect } from "react";
import { useOrders } from "../context/OrderContext";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/Button";
import { format } from "date-fns";
import { Filter, RefreshCw } from "lucide-react";
import {
	validateOrderItems,
	validateOrderForm,
} from "../utils/validationUtils";
import { useFormWithValidation } from "../hooks/useFormWithValidation";
import { OrderFilters } from "./OrderFilters";
import { OrdersTable } from "./OrdersTable";
import { SearchBar } from "./ui/SearchBar";
import { OrderModal } from "./OrderModal";

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
		canRequestChanges,
		salesUsers,
		fetchSalesUsers,
	} = useOrders();

	const [showNewOrderForm, setShowNewOrderForm] = useState(false);

	// Fetch data when component mounts or filters change
	useEffect(() => {
		refreshOrders();
	}, [filters, refreshOrders]);

	// Fetch sales users only once when component mounts
	useEffect(() => {
		if (["admin", "operator", "sales"].includes(currentUser?.role)) {
			fetchSalesUsers();
		}
	}, [currentUser, fetchSalesUsers]);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [searchInput, setSearchInput] = useState("");

	// Check if current user has factory role
	const isFactoryUser = currentUser?.role === "factory";

	// Initial filter state based on user role
	useEffect(() => {
		if (isFactoryUser) {
			// For factory users, start with an empty status filter
			setFilters((prevFilters) => ({
				...prevFilters,
				status: "",
			}));
		}
	}, [isFactoryUser]);

	// Initial form state for new order
	const initialFormState = {
		sdyNumber: "",
		date: format(new Date(), "yyyy-MM-dd"),
		partyName: "",
		deliveryParty: "",
		salespersonId: "",
		deniers: [""], // Array of denier values
		slNumbersWithQuantities: [{ slNumber: "", quantity: "" }], // Array of SL number and quantity pairs
		orderItems: [{ denier: "", slNumber: "", quantity: "" }], // Initialize orderItems array with empty quantity
	};

	// Custom form validation function
	const validateForm = (data) => {
		const errors = validateOrderForm(data);

		// Additional validation for salesperson selection
		if (
			["admin", "operator"].includes(currentUser?.role) &&
			!data.salespersonId
		) {
			errors.salespersonId = "Please select a salesperson";
		}

		return errors;
	};

	// Form submission handler
	const [formError, setFormError] = useState(null);

	const handleFormSubmit = async (formData) => {
		console.log("Form submission started with data:", formData);
		setFormError(null); // Clear any previous errors

		if (!currentUser || !canAddOrders) {
			console.log("Submission blocked - no user or no permission");
			return;
		}

		// Validate that at least one item exists (deniers or SL numbers)
		if (!validateOrderItems(formData)) {
			console.log("Validation failed - no valid items");
			alert(
				"You must enter at least one Denier or one SL Number with Quantity."
			);
			return;
		}

		// Filter out empty entries
		const deniers = formData.deniers.filter((d) => d.trim());
		const slNumbersWithQuantities = formData.slNumbersWithQuantities.filter(
			(item) =>
				item.slNumber.trim() &&
				item.quantity !== undefined &&
				item.quantity !== ""
		);

		console.log("Processing order items...");
		// Process orderItems for submission
		const processedOrderItems = formData.orderItems
			.filter(
				(item) =>
					(item.denier && item.denier.trim()) ||
					(item.slNumber && item.slNumber.trim())
			)
			.map((item) => ({
				...item,
				quantity: item.quantity ? Number(item.quantity) : 1,
			}));

		// Determine which salesperson ID to use
		const salespersonId = ["admin", "operator"].includes(currentUser.role)
			? formData.salespersonId // Use the selected salesperson for admin/operator
			: currentUser.id; // Use current user for sales role

		// Find the selected salesperson's details if needed
		const selectedSalesperson = ["admin", "operator"].includes(
			currentUser.role
		)
			? salesUsers.find(
					(u) => u.id.toString() === formData.salespersonId.toString()
			  ) || { id: formData.salespersonId, username: "Unknown" }
			: { id: currentUser.id, username: currentUser.username };

		try {
			await createOrder({
				...formData,
				deniers,
				slNumbersWithQuantities,
				orderItems: processedOrderItems,
				salespersonId,
				salesperson: selectedSalesperson,
			});

			setShowNewOrderForm(false);
			resetForm();
			refreshOrders(); // Refresh orders after creating a new one
		} catch (error) {
			console.error("Failed to create order:", error);
			const errorMessage =
				error.response?.data?.error || "Failed to create order";

			if (error.response?.data?.field === "sdyNumber") {
				setFormError({
					field: "sdyNumber",
					message: errorMessage,
				});
			} else {
				setFormError({
					field: "general",
					message: errorMessage,
				});
			}

			// Don't close the form so user can correct the error
			return;
		}
	};

	// Use our custom form hook for better form management
	const {
		formData: newOrder,
		errors,
		handleChange: handleInputChange,
		handleSubmit: handleNewOrderSubmit,
		resetForm,
		setFormData: setNewOrder,
	} = useFormWithValidation(initialFormState, validateForm, handleFormSubmit);

	// Custom handlers for the complex form fields (arrays)
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
				{ slNumber: "", quantity: "" },
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

	const handleOrderItemChange = (index, field, value) => {
		setNewOrder((prev) => {
			const newItems = [...prev.orderItems];
			newItems[index] = {
				...newItems[index],
				[field]: value,
			};
			return { ...prev, orderItems: newItems };
		});
	};

	const handleAddOrderItem = () => {
		setNewOrder((prev) => ({
			...prev,
			orderItems: [
				...prev.orderItems,
				{ denier: "", slNumber: "", quantity: "" },
			],
		}));
	};

	const handleRemoveOrderItem = (index) => {
		if (newOrder.orderItems.length <= 1) return; // Keep at least one item
		setNewOrder((prev) => ({
			...prev,
			orderItems: prev.orderItems.filter((_, i) => i !== index),
		}));
	};

	const handleSearch = () => {
		setFilters({ ...filters, searchTerm: searchInput });
	};

	// Function to handle order status updates
	const handleStatusUpdate = (orderId, newStatus) => {
		updateOrderStatus(orderId, newStatus);
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

	// Create a handler specifically for the status filter change
	const handleStatusFilterChange = (updatedFilters) => {
		setFilters(updatedFilters);
	};

	// Display all orders regardless of user role
	const displayOrders = orders;

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
						<SearchBar
							value={searchInput}
							onChange={setSearchInput}
							onSearch={handleSearch}
							placeholder="Search orders..."
						/>

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
					<OrderFilters
						filters={filters}
						onFilterChange={handleStatusFilterChange}
						showSalespersonFilter={["admin", "operator"].includes(
							currentUser?.role
						)}
						salesUsers={salesUsers}
						isFactoryUser={isFactoryUser}
					/>
				)}

				<div className="px-6 py-2 border-b border-gray-200 bg-gray-50 text-sm text-gray-500">
					Showing {displayOrders.length} order
					{displayOrders.length !== 1 ? "s" : ""}
				</div>

				{/* Orders Table */}
				<OrdersTable
					orders={displayOrders}
					canEditOrders={canEditOrders}
					canRequestChanges={canRequestChanges}
					onStatusUpdate={handleStatusUpdate}
					refreshOrders={refreshOrders}
					isFactoryUser={isFactoryUser}
					activeStatusFilter={
						filters.status !== "all" ? filters.status : null
					}
				/>
			</div>

			{/* New Order Form Modal */}
			{showNewOrderForm && (
				<OrderModal
					title="Add New Order"
					formData={newOrder}
					errors={errors}
					formError={formError}
					salesUsers={salesUsers}
					showSalespersonField={["admin", "operator"].includes(
						currentUser?.role
					)}
					onClose={() => setShowNewOrderForm(false)}
					onSubmit={handleNewOrderSubmit}
					handleChange={handleInputChange}
					deniers={newOrder.deniers}
					slNumbersWithQuantities={newOrder.slNumbersWithQuantities}
					onDenierChange={handleDenierChange}
					onAddDenier={addDenier}
					onRemoveDenier={removeDenier}
					onSlNumberWithQuantityChange={
						handleSlNumberWithQuantityChange
					}
					onAddSlNumberWithQuantity={addSlNumberWithQuantity}
					onRemoveSlNumberWithQuantity={removeSlNumberWithQuantity}
					orderItems={newOrder.orderItems}
					handleOrderItemChange={handleOrderItemChange}
					handleAddOrderItem={handleAddOrderItem}
					handleRemoveOrderItem={handleRemoveOrderItem}
					submitButtonText="Create Order"
				/>
			)}
		</div>
	);
};
