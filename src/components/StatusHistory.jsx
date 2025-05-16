import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "../types";
import { getStatusColor } from "../utils/statusUtils";

export const StatusHistory = ({ history, currentStatus }) => {
	return (
		<div className="space-y-2">
			{history.map((entry, index) => (
				<div
					key={entry.id}
					className="flex items-center space-x-3 py-1 border-l-2 pl-3"
					style={{
						borderColor:
							entry.status === currentStatus
								? "#4F46E5"
								: "#E5E7EB",
					}}
				>
					<span
						className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getStatusColor(
							entry.status
						)}`}
					>
						{ORDER_STATUS_LABELS[entry.status]}
					</span>
					<span className="text-xs text-gray-500">
						{format(
							new Date(entry.created_at),
							"MMM d, yyyy h:mm a"
						)}
					</span>
					<span className="text-xs text-gray-400">
						Updated by {entry.User.username}
					</span>
				</div>
			))}
		</div>
	);
};

StatusHistory.propTypes = {
	history: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.number.isRequired,
			status: PropTypes.string.isRequired,
			created_at: PropTypes.string.isRequired,
			User: PropTypes.shape({
				username: PropTypes.string.isRequired,
			}).isRequired,
		})
	).isRequired,
	currentStatus: PropTypes.string.isRequired,
};
