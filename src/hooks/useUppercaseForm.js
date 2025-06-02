import { useState, useCallback } from "react";

/**
 * Custom hook for form management with uppercase transformation
 * @param {Object} initialValues - Initial form values
 * @param {Function} validateFn - Validation function
 * @param {Function} onSubmitFn - Submit handler function
 * @returns {Object} - Form state and handlers with uppercase transformation
 */
export const useUppercaseForm = (initialValues, validateFn, onSubmitFn) => {
    const [formData, setFormData] = useState(initialValues);
    const [errors, setErrors] = useState({});

    // Input types that should be excluded from uppercase transformation
    const excludedTypes = [
        "password",
        "email",
        "url",
        "tel",
        "search",
        "number",
        "checkbox",
        "radio",
        "hidden",
        "submit",
        "reset",
        "button",
        "file",
        "image",
    ];

    // Check if a field should be uppercased
    const shouldUppercase = useCallback((name, type) => {
        // Don't uppercase excluded input types
        if (excludedTypes.includes(type)) {
            return false;
        }

        // Don't uppercase select elements
        if (type === "select-one" || type === "select-multiple") {
            return false;
        }

        // Don't uppercase fields that typically contain special formats
        const excludedFieldNames = [
            "email",
            "password",
            "url",
            "phone",
            "tel",
            "website",
            "role", // Don't uppercase role selections
        ];

        return !excludedFieldNames.some((excluded) =>
            name.toLowerCase().includes(excluded)
        );
    }, []);

    const handleChange = useCallback(
        (e) => {
            const { name, value, type } = e.target;

            // Determine the final value (uppercase if applicable)
            const finalValue = shouldUppercase(name, type)
                ? value.toUpperCase()
                : value;

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
                            [fieldName]: finalValue,
                        };
                        return { ...prev, [arrayName]: newArray };
                    });

                    // Clear error when field is edited
                    if (errors[name]) {
                        setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[name];
                            return newErrors;
                        });
                    }
                    return;
                }
            }

            // Handle normal field
            setFormData((prev) => ({
                ...prev,
                [name]: finalValue,
            }));

            // Clear error when field is edited
            if (errors[name]) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[name];
                    return newErrors;
                });
            }
        },
        [shouldUppercase, errors]
    );

    const handleNestedChange = useCallback(
        (index, field, value) => {
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
        },
        [formData]
    );

    const handleSubmit = useCallback(
        (e) => {
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
        },
        [formData, validateFn, onSubmitFn]
    );

    const resetForm = useCallback(
        (newValues = initialValues) => {
            setFormData(newValues);
            setErrors({});
        },
        [initialValues]
    );

    return {
        formData,
        errors,
        setFormData,
        handleChange,
        handleNestedChange,
        handleSubmit,
        resetForm,
        shouldUppercase, // Export this for components that need to check
    };
};
