import React from "react";
import PropTypes from "prop-types";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { useAuth } from "../context/AuthContext";

export const OrderFormFields = ({
	formData,
	errors,
	handleChange,
	salesUsers = [],
	isEditMode = false,
}) => {
	const { currentUser } = useAuth();
	const isFactoryEditing = isEditMode && currentUser?.role === "factory";

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{isFactoryEditing && (
				<div className="col-span-full bg-blue-50 border-l-4 border-blue-400 p-4">
					<div className="flex">
						<div className="ml-3">
							<p className="text-sm text-blue-700">
								As a factory user, you can only edit the Delivery Party and SDY Number
								field. Other fields are disabled.
							</p>
						</div>
					</div>
				</div>
			)}
			{isEditMode && (
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
						disabled={isEditMode && !['operator', 'factory'].includes(currentUser?.role)}
						className={
							isEditMode && !['operator', 'factory'].includes(currentUser?.role)
								? "bg-gray-100 cursor-not-allowed"
								: ""
						}
					/>
				</div>
			)}

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
					disabled={isEditMode && currentUser?.role !== 'operator'}
					className={
						isEditMode && currentUser?.role !== 'operator'
							? "bg-gray-100 cursor-not-allowed"
							: ""
					}
				/>
			</div>

			{isEditMode && (
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
						disabled={isEditMode && !['operator', 'factory'].includes(currentUser?.role)}
						className={
							isEditMode && !['operator', 'factory'].includes(currentUser?.role)
								? "bg-gray-100 cursor-not-allowed"
								: ""
						}
					/>
				</div>
			)}
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
					disabled={isEditMode && currentUser?.role !== 'operator'}
					className={
						isEditMode && currentUser?.role !== 'operator'
							? "bg-gray-100 cursor-not-allowed"
							: ""
					}
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
