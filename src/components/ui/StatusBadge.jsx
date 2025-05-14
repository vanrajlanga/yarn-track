import React from "react";
import PropTypes from "prop-types";
import { getStatusColor, getStatusLabel } from "../../utils/statusUtils";

export const StatusBadge = ({ status, className = "" }) => {
	return (
		<span
			className={`px-3 py-1 inline-flex text-sm font-medium rounded-full border ${getStatusColor(
				status
			)} ${className}`}
		>
			{getStatusLabel(status)}
		</span>
	);
};

StatusBadge.propTypes = {
	status: PropTypes.oneOf([
		"received",
		"dyeing",
		"dyeing_complete",
		"conning",
		"conning_complete",
		"packing",
		"packed",
	]).isRequired,
	className: PropTypes.string,
};
