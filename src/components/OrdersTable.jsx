import React from "react";
import PropTypes from "prop-types";
import { format } from "date-fns";
import { ORDER_STATUS_LABELS } from "../types";
import { getStatusColor } from "../utils/statusUtils";
import { StatusDropdown } from "./StatusDropdown";
import { OrderItemsView } from "./OrderItemsView";

/**
 * A component for displaying orders in a table format
 */
export const OrdersTable = ({
	orders,
	canEditOrders,
	onStatusUpdate,
	isFactoryUser = false,
	activeStatusFilter = null,
}) => {
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
							Deniers & SLs
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Salesperson
						</th>
						<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
							Status
						</th>
						{canEditOrders && (
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						)}
					</tr>
				</thead>
				<tbody className="bg-white divide-y divide-gray-200">
					{orders.map((order) => (
						<tr key={order.id}>
							<td className="px-6 py-4 whitespace-nowrap">
								{order.sdyNumber}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{format(new Date(order.date), "dd/MM/yyyy")}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{order.partyName}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{order.deliveryParty}
							</td>
							<td className="px-6 py-4">
								<OrderItemsView items={order.items} />
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								{order.salesperson?.username}
							</td>
							<td className="px-6 py-4 whitespace-nowrap">
								<span
									className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
										order.currentStatus
									)}`}
								>
									{ORDER_STATUS_LABELS[order.currentStatus]}
								</span>
							</td>
							{canEditOrders && (
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<StatusDropdown
										value={order.currentStatus}
										onChange={(e) =>
											onStatusUpdate(
												order.id,
												e.target.value
											)
										}
										className="w-40"
									/>
								</td>
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

OrdersTable.propTypes = {
	orders: PropTypes.array.isRequired,
	canEditOrders: PropTypes.bool.isRequired,
	onStatusUpdate: PropTypes.func.isRequired,
	isFactoryUser: PropTypes.bool,
	activeStatusFilter: PropTypes.string,
};
