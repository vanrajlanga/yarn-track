import React, {
    useState,
    useEffect,
    useMemo,
    useCallback,
    useRef,
} from "react";
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
import { validateRequired } from "../utils/validationUtils";
import { useUppercaseForm } from "../hooks/useUppercaseForm";

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
    const [isFactoryOneTimeEditing, setIsFactoryOneTimeEditing] =
        useState(false);
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
    const {
        canChangeStatus,
        currentPage,
        setCurrentPage,
        itemsPerPage,
        totalOrders,
    } = useOrders();

    // State to manage the visibility and position of the tooltip
    const [activeTooltip, setActiveTooltip] = useState(null);

    const tooltipHideTimeout = useRef(null);

    const showTooltip = (order, event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setActiveTooltip({
            orderId: order.id,
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        });

        // Clear any existing timeout
        if (tooltipHideTimeout.current) {
            clearTimeout(tooltipHideTimeout.current);
        }
    };

    const hideTooltip = () => {
        tooltipHideTimeout.current = setTimeout(() => {
            setActiveTooltip(null);
        }, 200); // Small delay to allow moving to tooltip
    };

    const cancelHideTooltip = () => {
        if (tooltipHideTimeout.current) {
            clearTimeout(tooltipHideTimeout.current);
        }
    };

    // Memoize orders.length to prevent unnecessary re-renders
    const ordersCount = useMemo(() => orders.length, [orders]);

    // Load change requests when component mounts or when orders change
    useEffect(() => {
        const loadChangeRequests = async () => {
            if (!orders || orders.length === 0) return;

            setLoadingRequests(true);
            const token = localStorage.getItem("token");

            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/change-requests`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const requests = data.changeRequests || [];

                    // Group by order ID and status
                    const pendingByOrder = {};
                    const approvedByOrder = {};

                    requests.forEach((request) => {
                        const orderId = request.orderId;

                        if (request.status === "pending") {
                            if (!pendingByOrder[orderId]) {
                                pendingByOrder[orderId] = [];
                            }
                            pendingByOrder[orderId].push(request);
                        } else if (request.status === "approved") {
                            if (!approvedByOrder[orderId]) {
                                approvedByOrder[orderId] = [];
                            }
                            approvedByOrder[orderId].push(request);
                        }
                    });

                    setPendingRequests(pendingByOrder);
                    setApprovedRequests(approvedByOrder);
                }
            } catch (error) {
                console.error("Error loading change requests:", error);
            } finally {
                setLoadingRequests(false);
            }
        };

        loadChangeRequests();
    }, [orders]);

    const handleRequestChange = (order) => {
        setChangeRequestOrder(order);
    };

    const handleCloseModal = () => {
        setChangeRequestOrder(null);
        setEditOrder(null);
        setEditingRequestId(null);
        setIsFactoryOneTimeEditing(false);
    };

    const handleSuccessfulRequest = (data) => {
        // Update pending requests state
        setPendingRequests((prev) => {
            const orderId = data.changeRequest.orderId;
            const newRequests = { ...prev };

            if (!newRequests[orderId]) {
                newRequests[orderId] = [];
            }

            newRequests[orderId].push(data.changeRequest);
            return newRequests;
        });

        setChangeRequestOrder(null);
    };

    const hasPendingRequest = (orderId) => {
        return pendingRequests[orderId] && pendingRequests[orderId].length > 0;
    };

    const hasUnusedApprovedRequest = (orderId) => {
        const approved = approvedRequests[orderId];
        if (!approved || approved.length === 0) return false;

        return approved.some((request) => !request.isEditUsed);
    };

    const getFirstUnusedApprovedRequest = (orderId) => {
        const approved = approvedRequests[orderId];
        if (!approved || approved.length === 0) return null;

        return approved.find((request) => !request.isEditUsed) || null;
    };

    const handleEdit = (order) => {
        // Factory users can use one-time edit if available
        if (currentUser?.role === "factory" && !order.factoryOneTimeEditUsed) {
            setIsFactoryOneTimeEditing(true);
            setEditingRequestId(null);

            // Prepare order data for factory one-time editing
            const formattedOrder = {
                ...order,
                orderItems: order.items.map((item) => ({
                    denier: item.denier || "",
                    slNumber: item.slNumber || "",
                    quantity: item.quantity || "",
                })),
            };

            setOrderFormData(formattedOrder);
            setEditOrder(order);
            return;
        }

        // Check if there's an unused approved request for this order
        const unusedRequest = getFirstUnusedApprovedRequest(order.id);
        if (!unusedRequest) {
            console.log(
                "No unused approved request found for order:",
                order.id
            );
            return;
        }

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
        setIsFactoryOneTimeEditing(false); // Ensure this is false for non-factory edits
    };

    // Handle form changes in edit mode
    const handleChange = (e) => {
        const { name, value, type } = e.target;

        // Helper function to determine if a field should be uppercased
        const shouldUppercase = (fieldName, inputType) => {
            // Don't uppercase excluded input types
            const excludedTypes = [
                "password",
                "email",
                "url",
                "tel",
                "search",
                "number",
                "checkbox",
                "radio",
                "hidden",
                "submit",
                "reset",
                "button",
                "file",
                "image",
            ];

            if (excludedTypes.includes(inputType)) {
                return false;
            }

            // Don't uppercase select elements
            if (inputType === "select-one" || inputType === "select-multiple") {
                return false;
            }

            // Don't uppercase fields that typically contain special formats
            const excludedFieldNames = [
                "email",
                "password",
                "url",
                "phone",
                "tel",
                "website",
                "role",
            ];

            return !excludedFieldNames.some((excluded) =>
                fieldName.toLowerCase().includes(excluded)
            );
        };

        // Determine the final value (uppercase if applicable)
        const finalValue = shouldUppercase(name, type)
            ? value.toUpperCase()
            : value;

        setOrderFormData((prev) => ({
            ...prev,
            [name]: finalValue,
        }));
    };

    // Handle order item changes
    const handleOrderItemChange = (index, field, value) => {
        setOrderFormData((prev) => {
            const newOrderItems = [...prev.orderItems];

            // Apply uppercase transformation to text fields, keep quantity numeric
            let finalValue = value;
            if (field === "quantity" && value) {
                finalValue = parseInt(value, 10);
            } else if (field === "denier" || field === "slNumber") {
                finalValue = value.toUpperCase();
            }

            newOrderItems[index] = {
                ...newOrderItems[index],
                [field]: finalValue,
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

        // We use the validateForm from useFormWithValidation, which updates the errors state
        // We only proceed with submission if there are no validation errors
        // The errors object is managed by useFormWithValidation hook in OrderDashboard.
        // In OrdersTable edit modal, we pass empty errors object, so we need to manually validate here if needed.

        // For factory one-time edit, manually validate only the editable fields (deliveryParty, sdyNumber)
        if (isFactoryOneTimeEditing) {
            const factoryEditErrors = {};
            const sdyNumberError = validateRequired(
                orderFormData.sdyNumber,
                "SDY Number"
            );
            if (sdyNumberError) factoryEditErrors.sdyNumber = sdyNumberError;
            const deliveryPartyError = validateRequired(
                orderFormData.deliveryParty,
                "Delivery Party"
            );
            if (deliveryPartyError)
                factoryEditErrors.deliveryParty = deliveryPartyError;

            // If there are validation errors, update local errors state (or handle differently)
            // For simplicity, let's just show a toast for now if validation fails.
            if (Object.keys(factoryEditErrors).length > 0) {
                // In a real app, you might want to display these errors next to the fields
                console.error(
                    "Factory one-time edit validation errors:",
                    factoryEditErrors
                );
                toast.error(
                    "Please fill in required fields for one-time edit."
                ); // Generic error
                return;
            }

            // Prepare update data for factory one-time edit
            const updateData = {
                deliveryParty: orderFormData.deliveryParty,
                sdyNumber: orderFormData.sdyNumber,
                factoryOneTimeEditUsed: true, // Mark one-time edit as used
            };

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Not authenticated");
                    return;
                }

                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/orders/${editOrder.id}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(updateData),
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error ||
                            `Failed to update order: ${response.statusText}`
                    );
                }

                const updatedOrder = await response.json();
                console.log("Factory one-time edit successful:", updatedOrder);

                // Refresh the orders list and close the modal
                await refreshOrders();
                handleCloseModal();
                toast.success("Order updated successfully");
            } catch (error) {
                console.error("Error submitting factory one-time edit:", error);
                toast.error(error.message || "Error updating order.");
            }
            return; // Exit the function after handling factory edit
        }

        // Existing logic for Operator/Approved Change Request edits
        // This part assumes validation is handled by useFormWithValidation or not needed here.

        // Ensure we have an editingRequestId for approved change requests
        if (!editingRequestId) {
            console.error("Editing without a valid change request ID.");
            toast.error("Invalid edit operation.");
            return;
        }

        // Prepare update data for approved change request
        // This assumes orderFormData contains the complete updated order data
        const updateData = {
            ...orderFormData,
            // Do not include orderItems here as they are updated via a separate endpoint
            orderItems: undefined,
            // We need to send the editingRequestId to the backend to mark the request as used
            editingRequestId: editingRequestId,
        };

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Not authenticated");
                return;
            }

            // Send PATCH request to update the order
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/orders/${editOrder.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updateData),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Failed to update order: ${response.statusText}`
                );
            }

            // const updatedOrder = await response.json(); // Not strictly needed here if refreshing
            console.log("Order update successful (via approved request).");

            // Update local state to mark the request as used
            setApprovedRequests((prev) => {
                const orderId = editOrder.id;
                const newRequests = { ...prev };

                if (newRequests[orderId]) {
                    newRequests[orderId] = newRequests[orderId].map((request) =>
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
        } catch (error) {
            console.error("Error during update:", error);
            toast.error("Error updating order list. Please try again.");
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

    // Handle order deletion (Admin only)
    const handleDeleteOrder = async (orderId) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this order?"
        );

        if (!confirmed) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                toast.error("Not authenticated");
                return;
            }

            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/orders/${orderId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error ||
                        `Failed to delete order: ${response.statusText}`
                );
            }

            // Refresh the orders list
            await refreshOrders();

            toast.success("Order deleted successfully");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error(error.message || "Error deleting order.");
        }
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
                            {/* Actions column remains if edit, change request or delete is allowed */}
                            {(canEditOrders ||
                                canRequestChanges ||
                                currentUser?.role === "admin") && (
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
                                        <div className="relative inline-block group">
                                            <OrderItemsView
                                                items={order.items}
                                            />

                                            {/* Info icon */}
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-4 w-4 text-gray-400 cursor-help inline-block ml-1 align-middle"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                onMouseEnter={(event) =>
                                                    showTooltip(order, event)
                                                }
                                                onMouseLeave={hideTooltip}
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
                                    {/* Actions column data */}
                                    {(canEditOrders ||
                                        canRequestChanges ||
                                        currentUser?.role === "admin") && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end">
                                            {/* Determine if the order is editable by the current user */}
                                            {(() => {
                                                const isFactoryOneTimeAvailable =
                                                    currentUser?.role ===
                                                        "factory" &&
                                                    !order.factoryOneTimeEditUsed;
                                                const hasApprovedRequest =
                                                    canRequestChanges &&
                                                    hasUnusedApprovedRequest(
                                                        order.id
                                                    );

                                                if (
                                                    isFactoryOneTimeAvailable ||
                                                    hasApprovedRequest
                                                ) {
                                                    return (
                                                        <Button
                                                            size="sm"
                                                            variant="primary"
                                                            className="ml-2"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    order
                                                                )
                                                            }
                                                            title={
                                                                isFactoryOneTimeAvailable
                                                                    ? "Edit order (one-time factory edit)"
                                                                    : "Edit order (one-time use after approval)"
                                                            }
                                                        >
                                                            Edit Order
                                                        </Button>
                                                    );
                                                } else if (
                                                    canRequestChanges &&
                                                    !hasPendingRequest(order.id)
                                                ) {
                                                    // Show Request Change button if not editable but can request changes and no pending request
                                                    return (
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
                                                    );
                                                } else if (
                                                    canRequestChanges &&
                                                    hasPendingRequest(order.id)
                                                ) {
                                                    // Show Request Pending text if can request changes and has pending request
                                                    return (
                                                        <span className="ml-2 text-sm text-gray-500">
                                                            Request Pending
                                                        </span>
                                                    );
                                                }

                                                return null; // Render nothing if no action is available for edit/request
                                            })()}
                                            {/* Show Delete button for admin only, alongside other actions */}
                                            {currentUser?.role === "admin" && (
                                                <Button
                                                    size="sm"
                                                    variant="danger"
                                                    className="ml-2"
                                                    onClick={() =>
                                                        handleDeleteOrder(
                                                            order.id
                                                        )
                                                    }
                                                    title="Delete order"
                                                >
                                                    Delete
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
                                                    // AND only if SDY Number and Delivery Party are filled
                                                    canEdit={
                                                        currentUser?.role ===
                                                            "factory" &&
                                                        !!order.sdyNumber &&
                                                        !!order.deliveryParty
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
                                                {/* Add a message if editing is disabled due to missing fields */}
                                                {currentUser?.role ===
                                                    "factory" &&
                                                    (!order.sdyNumber ||
                                                        !order.deliveryParty) && (
                                                        <p className="mt-2 text-sm text-orange-600">
                                                            Please fill in SDY
                                                            Number and Delivery
                                                            Party in the Edit
                                                            Order to enable item
                                                            details editing.
                                                        </p>
                                                    )}
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
                    <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span>
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                    >
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
                    isOneTimeEdit={isFactoryOneTimeEditing}
                />
            )}

            {/* Global Tooltip positioned relative to the viewport */}
            {activeTooltip && (
                <span
                    className={`fixed w-[400px] p-2 bg-white border border-gray-300 text-xs rounded-md transition-opacity duration-200 z-[10000] shadow-lg`}
                    style={{
                        top: activeTooltip.y,
                        left: activeTooltip.x,
                    }}
                    onMouseEnter={cancelHideTooltip}
                    onMouseLeave={hideTooltip}
                >
                    <OrderItemsDetailView
                        items={activeTooltip.order.items}
                        canEdit={false}
                        onItemUpdate={() => {}}
                    />
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
