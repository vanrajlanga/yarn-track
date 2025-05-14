import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "./ui/Button";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";
import { useFormWithValidation } from "../hooks/useFormWithValidation";
import { OrderFormFields } from "./OrderFormFields";
import { validateOrderForm } from "../utils/validationUtils";

export const OrderForm = ({ onSubmit }) => {
	const { currentUser } = useAuth();
	const { canAddOrders } = useOrders();
	const [isFormOpen, setIsFormOpen] = useState(false);

	// Set up form with validation
	const initialFormValues = {
		sdyNumber: "SDY -",
		date: new Date().toISOString().split("T")[0],
		partyName: "",
		deliveryParty: "",
		salespersonId: currentUser?.id || "",
		denier: "",
		slNumber: "",
	};

	// If user cannot add orders, don't render the form at all
	if (!canAddOrders) {
		return null;
	}

	const validateForm = (data) => {
		const baseErrors = validateOrderForm(data);

		// Add form-specific validations
		if (!data.denier.trim()) {
			baseErrors.denier = "Denier is required";
		}

		if (!data.slNumber.trim()) {
			baseErrors.slNumber = "SL Number is required";
		}

		return baseErrors;
	};

	const handleFormSubmit = (formData) => {
		onSubmit({
			...formData,
			salesperson: {
				id: currentUser?.id || 0,
				username: currentUser?.username || "",
			},
		});
		resetForm();
		setIsFormOpen(false);
	};

	const { formData, errors, handleChange, handleSubmit, resetForm } =
		useFormWithValidation(
			initialFormValues,
			validateForm,
			handleFormSubmit
		);

	return (
		<div className="bg-white rounded-lg shadow mb-6">
			<div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
				<h3 className="text-lg font-medium text-gray-900">
					Order Management
				</h3>
				<Button
					onClick={() => setIsFormOpen(!isFormOpen)}
					icon={<Plus className="h-4 w-4" />}
				>
					{isFormOpen ? "Cancel" : "Add New Order"}
				</Button>
			</div>

			{isFormOpen && (
				<div className="px-6 py-4">
					<form onSubmit={handleSubmit}>
						<OrderFormFields
							formData={formData}
							errors={errors}
							handleChange={handleChange}
						/>

						<div className="mt-6 flex justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => setIsFormOpen(false)}
								className="mr-3"
							>
								Cancel
							</Button>
							<Button type="submit">Create Order</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
};

OrderForm.propTypes = {
	onSubmit: PropTypes.func.isRequired,
};
