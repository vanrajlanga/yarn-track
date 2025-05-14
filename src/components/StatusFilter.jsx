import React from "react";
import PropTypes from "prop-types";
import { ORDER_STATUS_LABELS } from "../types";

/**
 * Component for filtering orders by status with special handling for factory users
 */
export const StatusFilter = ({
	selectedStatus,
	onStatusChange,
	isFactoryUser = false,
	availableStatuses = Object.keys(ORDER_STATUS_LABELS),
}) => {
	return (
		<div className="mb-4 flex items-center">
			<label
				htmlFor="status-filter"
				className="mr-2 text-sm font-medium text-gray-700"
			>
				Filter by status:
			</label>
			<select
				id="status-filter"
				className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
				value={selectedStatus || ""}
				onChange={(e) => onStatusChange(e.target.value || null)}
			>
				{!isFactoryUser && <option value="">All Statuses</option>}
				{availableStatuses.map((status) => (
					<option key={status} value={status}>
						{ORDER_STATUS_LABELS[status]}
					</option>
				))}
			</select>
		</div>
	);
};

StatusFilter.propTypes = {
	selectedStatus: PropTypes.string,
	onStatusChange: PropTypes.func.isRequired,
	isFactoryUser: PropTypes.bool,
	availableStatuses: PropTypes.arrayOf(PropTypes.string),
};
