import React, { useState } from "react";
import PropTypes from "prop-types";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";

export const OrderForm = ({ onSubmit }) => {
	const { currentUser } = useAuth();
	const { canAddOrders } = useOrders();
	const [formData, setFormData] = useState({
		sdyNumber: "",
		date: new Date().toISOString().split("T")[0],
		partyName: "",
		deliveryParty: "",
		salespersonId: currentUser?.id || "",
		denier: "",
		slNumber: "",
	});

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [errors, setErrors] = useState({});

	// If user cannot add orders, don't render the form at all
	if (!canAddOrders) {
		return null;
	}

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const validateForm = () => {
		const newErrors = {};

		if (!formData.sdyNumber.trim()) {
			newErrors.sdyNumber = "SDY Number is required";
		}

		if (!formData.partyName.trim()) {
			newErrors.partyName = "Party Name is required";
		}

		if (!formData.deliveryParty.trim()) {
			newErrors.deliveryParty = "Delivery Party is required";
		}

		if (!formData.salespersonId) {
			newErrors.salespersonId = "Salesperson is required";
		}

		if (!formData.denier.trim()) {
			newErrors.denier = "Denier is required";
		}

		if (!formData.slNumber.trim()) {
			newErrors.slNumber = "SL Number is required";
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleSubmit = (e) => {
		e.preventDefault();

		if (validateForm()) {
			onSubmit({
				...formData,
				salesperson: {
					id: currentUser?.id || 0,
					username: currentUser?.username || "",
				},
			});
			setFormData({
				sdyNumber: "",
				date: new Date().toISOString().split("T")[0],
				partyName: "",
				deliveryParty: "",
				salespersonId: currentUser?.id || "",
				denier: "",
				slNumber: "",
			});
			setIsFormOpen(false);
		}
	};

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
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							<div>
								<label
									htmlFor="sdyNumber"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									SDY Number *
								</label>
								<Input
									id="sdyNumber"
									name="sdyNumber"
									value={formData.sdyNumber}
									onChange={handleChange}
									error={errors.sdyNumber}
								/>
							</div>

							<div>
								<label
									htmlFor="date"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Date *
								</label>
								<Input
									type="date"
									id="date"
									name="date"
									value={formData.date}
									onChange={handleChange}
								/>
							</div>

							<div>
								<label
									htmlFor="partyName"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Party Name *
								</label>
								<Input
									id="partyName"
									name="partyName"
									value={formData.partyName}
									onChange={handleChange}
									error={errors.partyName}
								/>
							</div>

							<div>
								<label
									htmlFor="deliveryParty"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Delivery Party *
								</label>
								<Input
									id="deliveryParty"
									name="deliveryParty"
									value={formData.deliveryParty}
									onChange={handleChange}
									error={errors.deliveryParty}
								/>
							</div>

							<div>
								<label
									htmlFor="denier"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									Denier *
								</label>
								<Input
									id="denier"
									name="denier"
									value={formData.denier}
									onChange={handleChange}
									error={errors.denier}
								/>
							</div>

							<div>
								<label
									htmlFor="slNumber"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									SL Number *
								</label>
								<Input
									id="slNumber"
									name="slNumber"
									value={formData.slNumber}
									onChange={handleChange}
									error={errors.slNumber}
								/>
							</div>
						</div>

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
