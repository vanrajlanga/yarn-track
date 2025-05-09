import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { Button } from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { useOrders } from "../context/OrderContext";

const statusColors = {
	received: "bg-yellow-100 text-yellow-800",
	dyeing: "bg-blue-100 text-blue-800",
	dyeing_complete: "bg-green-100 text-green-800",
	conning: "bg-blue-100 text-blue-800",
	conning_complete: "bg-green-100 text-green-800",
	packing: "bg-blue-100 text-blue-800",
	packed: "bg-green-100 text-green-800",
};

const statusLabels = {
	received: "Received / Booked",
	dyeing: "Sent to Dyeing",
	dyeing_complete: "Dyeing Complete",
	conning: "Sent to Conning",
	conning_complete: "Conning Complete",
	packing: "Sent to Packing",
	packed: "Packed / Ready for Dispatch",
};

export const OrderTable = ({ orders, onStatusChange, onEdit, onDelete }) => {
	const { currentUser } = useAuth();
	const { canEditOrders } = useOrders();

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full divide-y divide-gray-200">
				<thead className="bg-gray-50">
					<tr>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							SDY Number
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Date
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Party Name
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Delivery Party
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Salesperson
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Denier
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							SL Number
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						{canEditOrders && (
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						)}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{orders.map((order) => (
						<tr key={order.id}>
							<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
								{order.sdyNumber}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{format(new Date(order.date), "MMM d, yyyy")}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{order.partyName}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{order.deliveryParty}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{order.salesperson?.username || "Unknown"}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{order.denier}
							</td>
							<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
								{order.slNumber}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<span
									className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
										statusColors[order.currentStatus]
									}`}
								>
									{statusLabels[order.currentStatus]}
								</span>
							</td>
							{canEditOrders && (
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div className="flex justify-end space-x-2">
										<select
											value={order.currentStatus}
											onChange={(e) =>
												onStatusChange(
													order.id,
													e.target.value
												)
											}
											className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
										>
											{Object.entries(statusLabels).map(
												([value, label]) => (
													<option
														key={value}
														value={value}
													>
														{label}
													</option>
												)
											)}
										</select>
										<Button
											variant="outline"
											size="sm"
											onClick={() => onEdit(order)}
										>
											Edit
										</Button>
										<Button
											variant="outline"
											size="sm"
											onClick={() => onDelete(order.id)}
										>
											Delete
										</Button>
									</div>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

OrderTable.propTypes = {
	orders: PropTypes.arrayOf(
		PropTypes.shape({
			id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
				.isRequired,
			sdyNumber: PropTypes.string.isRequired,
			date: PropTypes.string.isRequired,
			partyName: PropTypes.string.isRequired,
			deliveryParty: PropTypes.string.isRequired,
			denier: PropTypes.string.isRequired,
			slNumber: PropTypes.string.isRequired,
			currentStatus: PropTypes.string.isRequired,
			salesperson: PropTypes.shape({
				username: PropTypes.string,
			}),
		})
	).isRequired,
	onStatusChange: PropTypes.func.isRequired,
	onEdit: PropTypes.func.isRequired,
	onDelete: PropTypes.func.isRequired,
};
