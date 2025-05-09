import React from "react";
import PropTypes from "prop-types";

export const Select = ({
	label,
	error,
	className = "",
	children,
	...props
}) => {
	return (
		<div className="w-full">
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{label}
				</label>
			)}
			<select
				className={`w-full px-3 py-2 border ${
					error ? "border-red-300" : "border-gray-300"
				} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
				{...props}
			>
				{children}
			</select>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
};

Select.propTypes = {
	label: PropTypes.string,
	error: PropTypes.string,
	className: PropTypes.string,
	children: PropTypes.node.isRequired,
};
