/**
 * Common validation functions for the application
 */

/**
 * Validates that a string is not empty
 * @param {string} value - The value to check
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, fieldName) => {
	if (!value || (typeof value === "string" && !value.trim())) {
		return `${fieldName} is required`;
	}
	return null;
};

/**
 * Validates a basic order form (common between OrderForm and NewOrderForm)
 * @param {Object} data - Form data
 * @returns {Object} - Validation errors object
 */
export const validateOrderForm = (data) => {
	const errors = {};

	const requiredFields = [
		{ key: "partyName", label: "Party Name" },
	];

	console.log("data", data);
	// Validate SDY Number only if the order has an ID (i.e., is being edited)
	if (data.id !== undefined) {
		const sdyNumberError = validateRequired(data.sdyNumber, "SDY Number");
		if (sdyNumberError) errors.sdyNumber = sdyNumberError;
	}

	requiredFields.forEach(({ key, label }) => {
		const error = validateRequired(data[key], label);
		if (error) errors[key] = error;
	});

	// Validate date to prevent backdating
	if (data.date) {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const selectedDate = new Date(data.date);
		selectedDate.setHours(0, 0, 0, 0);

		if (selectedDate < today) {
			errors.date = "Backdating orders is not allowed";
		}
	}

	// If the form includes salespersonId validation
	if ("salespersonId" in data && !data.salespersonId) {
		errors.salespersonId = "Salesperson is required";
	}
	console.log("errors", errors);	
	return errors;
};

/**
 * Validates that at least one denier or SL Number with quantity is provided
 * @param {Object} data - Form data containing deniers and slNumbersWithQuantities
 * @returns {boolean} - Whether the validation passes
 */
export const validateOrderItems = (data) => {
	const hasValidDeniers = data.deniers?.some((d) => d.trim());
	const hasValidSlNumbers = data.slNumbersWithQuantities?.some(
		(item) =>
			item.slNumber?.trim() &&
			item.quantity !== undefined &&
			item.quantity !== ""
	);

	// Also check orderItems array if present
	const hasValidOrderItems = data.orderItems?.some(
		(item) =>
			(item.denier?.trim() || item.slNumber?.trim()) &&
			item.quantity !== undefined &&
			item.quantity !== ""
	);

	return hasValidDeniers || hasValidSlNumbers || hasValidOrderItems;
};
