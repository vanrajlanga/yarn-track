import React from "react";
import PropTypes from "prop-types";
import { Input } from "./ui/Input";
import { Select } from "./ui/Select";
import { ORDER_STATUS_LABELS } from "../types";

/**
 * A reusable component for order filtering controls
 *
 * @param {Object} props
 * @param {Object} props.filters - Current filter values
 * @param {Function} props.onFilterChange - Handler for filter changes
 * @param {boolean} props.showSalespersonFilter - Whether to show salesperson filter
 * @param {Array} props.salesUsers - List of sales users for filter dropdown
 * @param {boolean} props.isFactoryUser - Whether the user is a factory user
 * @returns {React.ReactElement}
 */
export const OrderFilters = ({
	filters,
	onFilterChange,
	showSalespersonFilter = false,
	salesUsers = [],
	isFactoryUser = false,
}) => {
	const handleFilterChange = (field, value) => {
		onFilterChange({ ...filters, [field]: value });
	};

	return (
		<div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-4">
				{/* Status Filter */}
				<div>
					<label
						htmlFor="status-filter"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Status
					</label>
					<div className="relative">
						<select
							id="status-filter"
							name="status"
							value={filters.status}
							onChange={(e) =>
								handleFilterChange("status", e.target.value)
							}
							className="block w-full cursor-pointer appearance-none rounded-md border border-gray-300 bg-white pl-3 pr-10 py-2.5 text-base shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
							style={{ height: "42px" }}
						>
							<option value="all">All Statuses</option>
							<option value="received">Received</option>
							<option value="dyeing">Dyeing</option>
							<option value="dyeing_complete">
								Dyeing Complete
							</option>
							<option value="conning">Conning</option>
							<option value="conning_complete">
								Conning Complete
							</option>
							<option value="packing">Packing</option>
							<option value="packed">Packed</option>
						</select>
						<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
							<svg
								className="w-4 h-4 fill-current"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
							>
								<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
							</svg>
						</div>
					</div>
				</div>

				{/* Salesperson Filter */}
				{showSalespersonFilter && salesUsers.length > 0 && (
					<div>
						<label
							htmlFor="salespersonFilter"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							Salesperson
						</label>
						<Select
							id="salespersonFilter"
							value={filters.salespersonId}
							onChange={(e) =>
								handleFilterChange(
									"salespersonId",
									e.target.value
								)
							}
						>
							<option value="all">All Salespersons</option>
							{salesUsers.map((user) => (
								<option key={user.id} value={user.id}>
									{user.username}
								</option>
							))}
						</Select>
					</div>
				)}

				{/* Order Date Filter */}
				<div>
					<label
						htmlFor="dateFilter"
						className="block text-sm font-medium text-gray-700 mb-1"
					>
						Order Date
					</label>
					<div className="flex items-center space-x-2">
						<Input
							type="date"
							value={filters.startDate}
							onChange={(e) =>
								handleFilterChange("startDate", e.target.value)
							}
						/>
						<span className="text-gray-500">to</span>
						<Input
							type="date"
							value={filters.endDate}
							onChange={(e) =>
								handleFilterChange("endDate", e.target.value)
							}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};

OrderFilters.propTypes = {
	filters: PropTypes.shape({
		status: PropTypes.string.isRequired,
		salespersonId: PropTypes.string,
		startDate: PropTypes.string,
		endDate: PropTypes.string,
	}).isRequired,
	onFilterChange: PropTypes.func.isRequired,
	showSalespersonFilter: PropTypes.bool,
	salesUsers: PropTypes.array,
	isFactoryUser: PropTypes.bool,
};
