import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { Button } from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export const ChangeRequestModal = ({ order, onClose, onSuccess }) => {
	const { currentUser } = useAuth();
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);
	const [hasPendingRequest, setHasPendingRequest] = useState(false);
	const [showInfoBox, setShowInfoBox] = useState(true);

	// Check if the order already has a pending change request
	useEffect(() => {
		const checkPendingRequests = async () => {
			try {
				const token = localStorage.getItem("token");
				if (!token) return;

				const response = await fetch(
					`${import.meta.env.VITE_API_URL}/change-requests?orderId=${order.id}&status=pending`,
					{
						headers: {
							Authorization: `Bearer ${token}`,
						},
					}
				);

				if (response.ok) {
					const data = await response.json();
					setHasPendingRequest(data && data.length > 0);
				}
			} catch (err) {
				console.error("Error checking for pending requests:", err);
			}
		};

		checkPendingRequests();
	}, [order.id]);

	const handleSubmit = async () => {
		// Don't submit if there's already a pending request
		if (hasPendingRequest) return;

		setLoading(true);
		setError(null);

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				toast.error("Authentication required");
				setLoading(false);
				return;
			}

			// Send request to create a simplified change request
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/orders/${order.id}/request-change`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						// No field, newValue, or reason needed for simplified requests
						requestType: currentUser.role,
					}),
				}
			);

			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data.error || "Failed to submit change request"
				);
			}

			// Show success feedback
			if (onSuccess) {
				onSuccess(data);
			}
			onClose();
		} catch (err) {
			setError(
				err.message || "An error occurred while submitting your request"
			);
			console.error("Error submitting change request:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
			<div className="bg-white rounded-lg w-full max-w-md p-6">
				<h2 className="text-xl font-semibold mb-4">Request Change</h2>

				{showInfoBox && (
					<div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
						<div className="flex">
							<div className="ml-3">
								<p className="text-sm text-blue-700 mb-2">
									<strong>How change requests work:</strong>
								</p>
								<ol className="list-decimal pl-5 text-sm text-blue-700 space-y-1">
									<li>Submit your request for approval</li>
									<li>
										Admin will review and approve/reject it
									</li>
									<li>
										Once approved, you'll see an "Edit
										Order" button
									</li>
									<li>
										You can edit the order{" "}
										<strong>one time only</strong>
									</li>
									<li>
										For further edits, you'll need to submit
										a new request
									</li>
								</ol>
								<button
									className="text-blue-500 hover:text-blue-700 text-xs mt-2"
									onClick={() => setShowInfoBox(false)}
								>
									Dismiss
								</button>
							</div>
						</div>
					</div>
				)}

				<p className="text-gray-600 mb-6">
					Are you sure you want to request a change for this order?
					Your request will be submitted for admin approval.
					{currentUser.role === "factory" &&
						" As a factory user, you can request changes to the delivery party."}
					{currentUser.role === "operator" &&
						" As an operator, you can request changes to order details except dates."}
				</p>

				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
						{error}
					</div>
				)}

				{hasPendingRequest && (
					<div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
						A change request for this order is already pending
						approval.
					</div>
				)}

				<div className="flex items-center justify-between mt-6">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={loading}
					>
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						disabled={loading || hasPendingRequest}
					>
						{loading
							? "Submitting..."
							: hasPendingRequest
							? "Already Requested"
							: "Submit Request"}
					</Button>
				</div>
			</div>
		</div>
	);
};

ChangeRequestModal.propTypes = {
	order: PropTypes.shape({
		id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
			.isRequired,
		partyName: PropTypes.string,
		deliveryParty: PropTypes.string,
		salespersonId: PropTypes.oneOfType([
			PropTypes.string,
			PropTypes.number,
		]),
	}).isRequired,
	onClose: PropTypes.func.isRequired,
	onSuccess: PropTypes.func,
};
