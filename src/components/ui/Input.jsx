import React from "react";
import PropTypes from "prop-types";

export const Input = ({ label, error, className = "", ...props }) => {
	return (
		<div className="w-full">
			{label && (
				<label className="block text-sm font-medium text-gray-700 mb-1">
					{label}
				</label>
			)}
			<input
				className={`w-full px-3 py-2 border ${
					error ? "border-red-300" : "border-gray-300"
				} rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
				{...props}
			/>
			{error && <p className="mt-1 text-sm text-red-600">{error}</p>}
		</div>
	);
};

Input.propTypes = {
	label: PropTypes.string,
	error: PropTypes.string,
	className: PropTypes.string,
	// Common input props
	id: PropTypes.string,
	name: PropTypes.string,
	type: PropTypes.string,
	value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	onChange: PropTypes.func,
	onBlur: PropTypes.func,
	onFocus: PropTypes.func,
	placeholder: PropTypes.string,
	disabled: PropTypes.bool,
	required: PropTypes.bool,
	min: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	max: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
	pattern: PropTypes.string,
	autoComplete: PropTypes.string,
	autoFocus: PropTypes.bool,
};
