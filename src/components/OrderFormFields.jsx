import React from "react";
import PropTypes from "prop-types";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";

export const OrderFormFields = ({
	formData,
	errors,
	handleChange,
	salesUsers = [],
	isEditMode = false,
}) => {
	return (
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
					value={formData.sdyNumber || "SDY -"}
					onChange={handleChange}
					error={errors.sdyNumber}
				/>
			</div>

			<div>
				<label
					htmlFor="date"
					className={`block text-sm font-medium ${
						isEditMode ? "text-gray-500" : "text-gray-700"
					} mb-1`}
				>
					Date *{" "}
					{isEditMode && (
						<span className="text-xs text-gray-500">
							(Cannot be edited)
						</span>
					)}
				</label>
				<Input
					type="date"
					id="date"
					name="date"
					value={formData.date}
					onChange={handleChange}
					min={new Date().toISOString().split("T")[0]}
					error={errors.date}
					disabled={isEditMode}
					className={
						isEditMode ? "bg-gray-100 cursor-not-allowed" : ""
					}
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
					Delivery Party
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
					htmlFor="salespersonId"
					className="block text-sm font-medium text-gray-700 mb-1"
				>
					Salesperson *
				</label>
				<Select
					id="salespersonId"
					name="salespersonId"
					value={formData.salespersonId}
					onChange={handleChange}
					error={errors.salespersonId}
				>
					<option value="">Select Salesperson</option>
					{salesUsers.map((user) => (
						<option key={user.id} value={user.id}>
							{user.username}
						</option>
					))}
				</Select>
			</div>
		</div>
	);
};

OrderFormFields.propTypes = {
	formData: PropTypes.object.isRequired,
	errors: PropTypes.object.isRequired,
	handleChange: PropTypes.func.isRequired,
	salesUsers: PropTypes.array,
	isEditMode: PropTypes.bool,
};
