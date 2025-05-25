import React, { useState, useEffect, useMemo } from "react";
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
import { toast } from "react-hot-toast";

export const OrderDashboard = () => {
	const { currentUser } = useAuth();
	const {
		orders,
		loading,
		error,
		setFilters: contextSetFilters,
		createOrder,
		updateOrderStatus,
		refreshOrders,
		canEditOrders,
		canAddOrders,
		canRequestChanges,
		salesUsers,
		fetchSalesUsers,
		filters: contextFilters,
	} = useOrders();

	const [showNewOrderForm, setShowNewOrderForm] = useState(false);

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
		setFilters({
			searchTerm: searchInput,
		});
	};

	const clearFilters = () => {
		setFilters({
			searchTerm: "",
		});
		setSearchInput("");
	};

	// Define the handler for exporting orders
	const handleExportOrders = async (filters) => {
		try {
			console.log("Exporting orders with filters:", filters);
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("Not authenticated");
				return;
			}

			// Construct the API URL with filter parameters
			const queryParams = new URLSearchParams();
			if (filters.status && filters.status !== 'all') {
				queryParams.append('status', filters.status);
			}
			if (filters.startDate) {
				queryParams.append('startDate', filters.startDate);
			}
			if (filters.endDate) {
				queryParams.append('endDate', filters.endDate);
			}
			// Add other filters if needed (e.g., salespersonId, searchTerm)
			// Note: Salesperson filter might be applied on the backend based on user role
			// Search term might also need to be included if backend supports it

			const apiUrl = `${import.meta.env.VITE_API_URL}/orders/export?${queryParams.toString()}`;

			const response = await fetch(apiUrl, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || `Failed to export orders: ${response.statusText}`);
			}

			// Handle the file download
			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = `orders_export_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);

			toast.success("Orders exported successfully.");

		} catch (error) {
			console.error("Error exporting orders:", error);
			toast.error(error.message || "Error exporting orders. Please try again.");
		}
	};

	// Display all orders regardless of user role
	const displayOrders = orders;

	// Fetch orders when component mounts or filters change (using context filters)
	useEffect(() => {
		refreshOrders();
	}, [contextFilters, refreshOrders]);

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
						filters={contextFilters}
						onFilterChange={contextSetFilters}
						showSalespersonFilter={["admin", "operator"].includes(
							currentUser?.role
						)}
						salesUsers={salesUsers}
						isFactoryUser={isFactoryUser}
						onExport={handleExportOrders}
					/>
				)}

				{/* Orders Table */}
				<OrdersTable
					orders={displayOrders}
					canEditOrders={canEditOrders}
					canRequestChanges={canRequestChanges}
					refreshOrders={refreshOrders}
					isFactoryUser={isFactoryUser}
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
