import React from "react";
import PropTypes from "prop-types";
import { Button } from "./ui/Button";
import { OrderFormFields } from "./OrderFormFields";
import { OrderItemFields } from "./OrderItemFields";

/**
 * Modal for adding or editing an order
 */
export const OrderModal = ({
	title = "Add New Order",
	formData,
	errors = {},
	salesUsers = [],
	showSalespersonField = false,
	onClose,
	onSubmit,
	handleChange,
	submitButtonText = "Create Order",
	isOneTimeEdit = false,
	handleOrderItemChange,
	handleAddOrderItem,
	handleRemoveOrderItem,
}) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-screen overflow-y-auto">
				<h3 className="text-xl font-bold mb-4">{title}</h3>

				{isOneTimeEdit && (
					<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
						<div className="flex">
							<div className="ml-3">
								<p className="text-sm text-yellow-700">
									<strong>Important:</strong> This is a
									one-time edit opportunity. After submitting
									these changes, you will need to submit a new
									change request for any future edits to this
									order.
								</p>
							</div>
						</div>
					</div>
				)}

				<form onSubmit={onSubmit} className="space-y-6">
					<div className="bg-gray-50 p-4 rounded-md">
						<h4 className="text-md font-medium mb-3 text-gray-700">
							Order Details
						</h4>
						<OrderFormFields
							formData={formData}
							errors={errors}
							handleChange={handleChange}
							salesUsers={salesUsers}
							showSalespersonField={showSalespersonField}
							isEditMode={title === "Edit Order"}
						/>
					</div>

					{/* Separate sections for Deniers and SL Numbers with Quantities */}
					<div className="bg-gray-50 p-4 rounded-md">
						<h4 className="text-md font-medium mb-3 text-gray-700">
							Items & Quantities
						</h4>
						<OrderItemFields
							orderItems={
								formData.orderItems || [
									{ denier: "", slNumber: "", quantity: "" },
								]
							}
							onOrderItemChange={handleOrderItemChange}
							onAddOrderItem={handleAddOrderItem}
							onRemoveOrderItem={handleRemoveOrderItem}
						/>
					</div>

					<div className="flex justify-end gap-2 pt-2">
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancel
						</Button>
						<Button type="submit">{submitButtonText}</Button>
					</div>
				</form>
			</div>
		</div>
	);
};

OrderModal.propTypes = {
	title: PropTypes.string,
	formData: PropTypes.object.isRequired,
	errors: PropTypes.object,
	salesUsers: PropTypes.array,
	showSalespersonField: PropTypes.bool,
	onClose: PropTypes.func.isRequired,
	onSubmit: PropTypes.func.isRequired,
	handleChange: PropTypes.func.isRequired,
	submitButtonText: PropTypes.string,
	isOneTimeEdit: PropTypes.bool,
};
