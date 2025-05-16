import { useState } from "react";

/**
 * Custom hook for form management with error handling
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Validation function
 * @param {Function} onSubmitFn - Submit handler function
 * @returns {Object} - Form state and handlers
 */
export const useFormWithValidation = (
	initialValues,
	validateFn,
	onSubmitFn
) => {
	const [formData, setFormData] = useState(initialValues);
	const [errors, setErrors] = useState({});

	const handleChange = (e) => {
		const { name, value } = e.target;

		// Handle nested fields using array notation e.g., "orderItems[0].denier"
		if (name.includes("[") && name.includes("]")) {
			const matches = name.match(/(\w+)\[(\d+)\]\.(\w+)/);
			if (matches) {
				const [_, arrayName, index, fieldName] = matches;
				setFormData((prev) => {
					// Ensure the array exists
					const array = prev[arrayName] || [];
					const newArray = [...array];
					// Ensure the object at index exists
					newArray[index] = {
						...(newArray[index] || {}),
						[fieldName]: value,
					};
					return { ...prev, [arrayName]: newArray };
				});
				return;
			}
		}

		// Handle normal field
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));

		// Clear error when field is edited
		if (errors[name]) {
			setErrors((prev) => {
				const newErrors = { ...prev };
				delete newErrors[name];
				return newErrors;
			});
		}
	};

	const handleNestedChange = (index, field, value) => {
		if (!formData[field]) return;

		setFormData((prev) => {
			const newItems = [...prev[field]];
			if (Array.isArray(newItems[index])) {
				newItems[index] = value;
			} else if (typeof newItems[index] === "object") {
				newItems[index] = { ...newItems[index], ...value };
			} else {
				// Handle simple array case
				newItems[index] = value;
			}
			return { ...prev, [field]: newItems };
		});
	};

	const handleSubmit = (e) => {
		// If e is an event object, prevent default behavior
		if (e && typeof e.preventDefault === "function") {
			e.preventDefault();
		}

		const validationErrors = validateFn ? validateFn(formData) : {};
		setErrors(validationErrors);

		if (Object.keys(validationErrors).length === 0) {
			onSubmitFn(formData);
			return true;
		}
		return false;
	};

	const resetForm = (newValues = initialValues) => {
		setFormData(newValues);
		setErrors({});
	};

	return {
		formData,
		errors,
		setFormData,
		handleChange,
		handleNestedChange,
		handleSubmit,
		resetForm,
	};
};
