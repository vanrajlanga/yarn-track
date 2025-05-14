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
}) => {
	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
			<div className="bg-white p-6 rounded-lg w-full max-w-5xl max-h-screen overflow-y-auto">
				<h3 className="text-xl font-bold mb-4">{title}</h3>
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
							onOrderItemChange={(index, field, value) =>
								handleChange({
									target: {
										name: `orderItems[${index}].${field}`,
										value,
									},
								})
							}
							onAddOrderItem={() => {
								// Initialize the array if it doesn't exist yet
								const currentItems = formData.orderItems || [
									{ denier: "", slNumber: "", quantity: "" },
								];
								const updatedItems = [
									...currentItems,
									{ denier: "", slNumber: "", quantity: "" },
								];
								handleChange({
									target: {
										name: "orderItems",
										value: updatedItems,
									},
								});
							}}
							onRemoveOrderItem={(index) => {
								const updatedItems = [
									...(formData.orderItems || []),
								];
								updatedItems.splice(index, 1);
								handleChange({
									target: {
										name: "orderItems",
										value: updatedItems,
									},
								});
							}}
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
};
