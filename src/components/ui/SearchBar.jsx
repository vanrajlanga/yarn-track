import React from "react";
import PropTypes from "prop-types";
import { Search } from "lucide-react";

/**
 * A reusable search bar component
 *
 * @param {Object} props
 * @param {string} props.value - Current search value
 * @param {Function} props.onChange - Handler for input change
 * @param {Function} props.onSearch - Handler for search form submission
 * @param {string} props.placeholder - Placeholder text
 * @returns {React.ReactElement}
 */
export const SearchBar = ({
	value,
	onChange,
	onSearch,
	placeholder = "Search...",
}) => {
	const handleSubmit = (e) => {
		e.preventDefault();
		onSearch(value);
	};

	return (
		<form onSubmit={handleSubmit} className="relative">
			<input
				type="text"
				placeholder={placeholder}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
			/>
			<Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
		</form>
	);
};

SearchBar.propTypes = {
	value: PropTypes.string.isRequired,
	onChange: PropTypes.func.isRequired,
	onSearch: PropTypes.func.isRequired,
	placeholder: PropTypes.string,
};
