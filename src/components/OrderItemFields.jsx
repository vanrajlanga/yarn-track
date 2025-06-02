import React from "react";
import PropTypes from "prop-types";
import { Input } from "./ui/Input";
import { Button } from "./ui/Button";
import { Plus, Trash2 } from "lucide-react";

export const OrderItemFields = ({
    orderItems = [{ denier: "", slNumber: "", quantity: "" }],
    onOrderItemChange,
    onAddOrderItem,
    onRemoveOrderItem,
    disabled = false,
}) => {
    // Helper function to determine if a field should be uppercased
    const shouldUppercase = (field, value) => {
        // Don't uppercase empty values
        if (!value) return value;

        // Uppercase text fields but not quantity
        const uppercaseFields = ["denier", "slNumber"];

        if (uppercaseFields.includes(field)) {
            return value.toUpperCase();
        }

        return value;
    };

    // Enhanced onChange handler with uppercase transformation
    const handleItemChange = (index, field, value) => {
        const finalValue = shouldUppercase(field, value);
        onOrderItemChange(index, field, finalValue);
    };

    return (
        <div className="space-y-4">
            {/* Order Items Section */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Order Items
                    </label>
                    <Button
                        type="button"
                        size="sm"
                        onClick={onAddOrderItem}
                        className="flex items-center"
                        disabled={disabled}
                    >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                </div>

                {/* Column headers */}
                <div className="grid grid-cols-12 gap-4 mb-2 px-2">
                    <div className="col-span-5 text-xs font-medium text-gray-700">
                        Denier
                    </div>
                    <div className="col-span-5 text-xs font-medium text-gray-700">
                        SL Number
                    </div>
                    <div className="col-span-2 text-xs font-medium text-gray-700">
                        Quantity (KG)
                    </div>
                </div>

                <div className="space-y-3">
                    {orderItems.map((item, index) => (
                        <div
                            key={index}
                            className="grid grid-cols-12 gap-4 items-center bg-gray-50 p-2 rounded"
                        >
                            <div className="col-span-5">
                                {" "}
                                <Input
                                    value={item.denier}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "denier",
                                            e.target.value
                                        )
                                    }
                                    placeholder="Denier"
                                    disabled={disabled}
                                    className={
                                        disabled
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : ""
                                    }
                                />
                            </div>
                            <div className="col-span-5">
                                {" "}
                                <Input
                                    value={item.slNumber}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "slNumber",
                                            e.target.value
                                        )
                                    }
                                    placeholder="SL Number"
                                    disabled={disabled}
                                    className={
                                        disabled
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : ""
                                    }
                                />
                            </div>
                            <div className="col-span-1 relative">
                                {" "}
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    min="1"
                                    placeholder=""
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "quantity",
                                            e.target.value ? e.target.value : ""
                                        )
                                    }
                                    disabled={disabled}
                                    className={
                                        disabled
                                            ? "bg-gray-100 cursor-not-allowed"
                                            : ""
                                    }
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500">KG</span>
                                </div>
                            </div>
                            <div className="col-span-1 flex justify-center">
                                {orderItems.length > 1 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onRemoveOrderItem(index)}
                                        title="Remove item"
                                        disabled={disabled}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

OrderItemFields.propTypes = {
    orderItems: PropTypes.arrayOf(
        PropTypes.shape({
            denier: PropTypes.string,
            slNumber: PropTypes.string,
            quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        })
    ),
    onOrderItemChange: PropTypes.func.isRequired,
    onAddOrderItem: PropTypes.func.isRequired,
    onRemoveOrderItem: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};
