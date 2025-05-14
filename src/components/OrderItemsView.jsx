import React from "react";
import PropTypes from "prop-types";

/**
 * A component for rendering order items (deniers and SL numbers with quantities)
 * in a consistent format across the application.
 *
 * @param {Object} props
 * @param {Array} props.items - The order items
 * @returns {React.ReactElement}
 */
export const OrderItemsView = ({ items }) => {
	if (!items || items.length === 0) {
		return <div className="text-sm text-gray-500">No items</div>;
	}

	// Categorize items based on their content
	const deniers = items
		.filter((item) => item.denier && item.denier.trim())
		.map((item) => item.denier);

	const slWithQty = items
		.filter((item) => item.slNumber && item.slNumber.trim())
		.map((item) => ({
			slNumber: item.slNumber,
			quantity: item.quantity || 0,
		}));

	return (
		<div className="space-y-2">
			{deniers.length > 0 && (
				<div className="text-sm">
					<span className="font-semibold">Deniers:</span>{" "}
					{deniers.join(", ")}
				</div>
			)}
			{slWithQty.length > 0 && (
				<div className="text-sm space-y-1">
					<span className="font-semibold">SL Numbers:</span>
					{slWithQty.map((item, idx) => (
						<div key={idx} className="ml-2">
							{item.slNumber}{" "}
							<span className="font-semibold">
								(Qty: {item.quantity})
							</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

OrderItemsView.propTypes = {
	items: PropTypes.arrayOf(
		PropTypes.shape({
			denier: PropTypes.string,
			slNumber: PropTypes.string,
			quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
		})
	),
};
