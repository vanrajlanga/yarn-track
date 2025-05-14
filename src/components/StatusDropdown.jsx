import React from "react";
import PropTypes from "prop-types";
import { Select } from "./ui/Select";
import { ORDER_STATUS_LABELS } from "../types";

/**
 * A reusable status dropdown component for order status selection
 * @param {Object} props - Component props
 * @returns {React.ReactElement} - Status dropdown component
 */
export const StatusDropdown = ({
	value,
	onChange,
	disabled = false,
	className = "",
	includeStatuses = null, // if null, include all statuses
}) => {
	// Filter statuses if needed
	const statusOptions = includeStatuses
		? Object.entries(ORDER_STATUS_LABELS).filter(([status]) =>
				includeStatuses.includes(status)
		  )
		: Object.entries(ORDER_STATUS_LABELS);

	return (
		<Select
			value={value}
			onChange={onChange}
			disabled={disabled}
			className={className}
		>
			{statusOptions.map(([value, label]) => (
				<option key={value} value={value}>
					{label}
				</option>
			))}
		</Select>
	);
};

StatusDropdown.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
	className: PropTypes.string,
	includeStatuses: PropTypes.arrayOf(PropTypes.string),
};
