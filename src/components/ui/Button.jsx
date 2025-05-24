import React from "react";
import PropTypes from "prop-types";

export const Button = ({
	children,
	variant = "primary",
	size = "md",
	onClick,
	type = "button",
	disabled = false,
	className = "",
	icon,
}) => {
	const baseClasses =
		"inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";

	const variantClasses = {
		primary:
			"bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500",
		secondary:
			"bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500",
		outline:
			"border hover:bg-gray-50 focus:ring-indigo-500",
		ghost: "hover:bg-gray-100 focus:ring-gray-500",
		danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
	};

	const sizeClasses = {
		sm: "text-sm px-3 py-1.5",
		md: "text-base px-4 py-2",
		lg: "text-lg px-6 py-3",
		icon: "p-2",
	};

	const disabledClasses = disabled
		? "opacity-50 cursor-not-allowed"
		: "cursor-pointer";

	const iconClasses = size === 'icon' && icon && !children ? '' : 'mr-2';

	return (
		<button
			type={type}
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
			onClick={onClick}
			disabled={disabled}
		>
			{icon && <span className={iconClasses}>{icon}</span>}
			{children}
		</button>
	);
};

Button.propTypes = {
	children: PropTypes.node,
	variant: PropTypes.oneOf(["primary", "secondary", "outline", "ghost", "danger"]),
	size: PropTypes.oneOf(["sm", "md", "lg", "icon"]),
	onClick: PropTypes.func,
	type: PropTypes.oneOf(["button", "submit", "reset"]),
	disabled: PropTypes.bool,
	className: PropTypes.string,
	icon: PropTypes.node,
};
