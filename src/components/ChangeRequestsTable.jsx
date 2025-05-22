import React, { useState, useEffect } from "react";
import { Button } from "./ui/Button";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { toast } from "react-toastify";

export const ChangeRequestsTable = () => {
	const { currentUser } = useAuth();
	const [changeRequests, setChangeRequests] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [processingId, setProcessingId] = useState(null);
	const fetchInProgress = React.useRef(false);
	const [adminNote, setAdminNote] = useState("");
	const [showNoteModal, setShowNoteModal] = useState(false);
	const [selectedRequest, setSelectedRequest] = useState(null);
	const [actionType, setActionType] = useState(null);

	// Load change requests
	useEffect(() => {
		let isSubscribed = true;
		const abortController = new AbortController();

		const fetchChangeRequests = async () => {
			// Prevent duplicate fetches
			if (!isSubscribed || fetchInProgress.current) return;

			fetchInProgress.current = true;
			setLoading(true);

			try {
				const token = localStorage.getItem("token");
				if (!token) {
					setError("Authentication required");
					return;
				}

				const response = await fetch(`${import.meta.env.VITE_API_URL}/change-requests`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
					signal: abortController.signal,
				});

				if (!response.ok) {
					throw new Error(
						data.error || "Failed to fetch change requests"
					);
				}

				const data = await response.json();
				if (isSubscribed) {
					setChangeRequests(data);
				}
			} catch (err) {
				if (err.name === "AbortError") {
					// ignore abort errors
					return;
				}
				if (isSubscribed) {
					setError(
						err.message || "An error occurred while fetching data"
					);
					console.error("Error fetching change requests:", err);
				}
			} finally {
				if (isSubscribed) {
					setLoading(false);
				}
				fetchInProgress.current = false;
			}
		};

		fetchChangeRequests();

		return () => {
			isSubscribed = false;
			abortController.abort();
			fetchInProgress.current = false;
		};
	}, []);

	// Handle opening the note modal for approval/rejection
	const handleActionClick = (request, action) => {
		setSelectedRequest(request);
		setActionType(action);
		setAdminNote("");
		setShowNoteModal(true);
	};

	// Handle processing the change request (approve/reject)
	const handleProcessRequest = async () => {
		if (!selectedRequest || !actionType) return;

		setProcessingId(selectedRequest.id);
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Authentication required");
				return;
			}

			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/change-requests/${selectedRequest.id}/process`,
				{
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						status: actionType,
						adminNote,
					}),
				}
			);

			const data = await response.json();
			if (!response.ok) {
				throw new Error(
					data.error || `Failed to ${actionType} change request`
				);
			}

			// Update the list with the processed request
			setChangeRequests((prevRequests) =>
				prevRequests.map((req) => (req.id === data.id ? data : req))
			);

			// Close the modal
			setShowNoteModal(false);
		} catch (err) {
			setError(
				err.message || "An error occurred while processing the request"
			);
			console.error("Error processing change request:", err);
		} finally {
			setProcessingId(null);
		}
	};

	// Render loading state
	if (loading) {
		return (
			<div className="text-center py-4">Loading change requests...</div>
		);
	}

	// Render error state
	if (error) {
		return (
			<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
				{error}
			</div>
		);
	}

	// Status badge component
	const StatusBadge = ({ status }) => {
		const classes = {
			pending: "bg-yellow-100 text-yellow-800",
			approved: "bg-green-100 text-green-800",
			rejected: "bg-red-100 text-red-800",
		};

		return (
			<span
				className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
					classes[status] || "bg-gray-100 text-gray-800"
				}`}
			>
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</span>
		);
	};

	return (
		<div className="overflow-x-auto">
			<h2 className="text-xl font-semibold mb-4">Change Requests</h2>

			{changeRequests.length === 0 ? (
				<div className="text-center py-4 text-gray-500">
					No change requests found.
				</div>
			) : (
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Order
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Requested By
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Status
							</th>
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{changeRequests.map((request) => (
							<tr key={request.id}>
								<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
									{request.Order?.sdyNumber || "N/A"}
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
									{request.requester?.username || "Unknown"}
									{request.requester?.role && (
										<span className="ml-1 text-xs text-gray-400">
											({request.requester.role})
										</span>
									)}
								</td>
								<td className="px-6 py-4 whitespace-nowrap">
									<StatusBadge status={request.status} />
								</td>
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									{currentUser?.role === "admin" &&
										request.status === "pending" && (
											<div className="flex space-x-2">
												<Button
													size="sm"
													onClick={() =>
														handleActionClick(
															request,
															"approved"
														)
													}
													disabled={!!processingId}
												>
													Approve
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handleActionClick(
															request,
															"rejected"
														)
													}
													disabled={!!processingId}
												>
													Reject
												</Button>
											</div>
										)}
									{request.status !== "pending" && (
										<span className="text-xs text-gray-500">
											{request.approver?.username ||
												"Admin"}
										</span>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			{/* Admin Note Modal */}
			{showNoteModal && selectedRequest && (
				<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
					<div className="bg-white rounded-lg w-full max-w-md p-6">
						<h3 className="text-lg font-semibold mb-4">
							{actionType === "approved" ? "Approve" : "Reject"}{" "}
							Change Request
						</h3>
						<p className="text-gray-600 mb-4">
							{actionType === "approved"
								? "Approving this request will allow the user to make changes to this order."
								: "Rejecting this request will deny the user's ability to make changes."}
						</p>
						<div className="mb-4">
							<label className="block text-gray-700 text-sm font-bold mb-2">
								Admin Note (Optional)
							</label>
							<textarea
								value={adminNote}
								onChange={(e) => setAdminNote(e.target.value)}
								className="shadow border rounded w-full py-2 px-3 text-gray-700 h-24"
								placeholder="Add a note about your decision"
							></textarea>
						</div>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								onClick={() => setShowNoteModal(false)}
								disabled={!!processingId}
							>
								Cancel
							</Button>
							<Button
								onClick={handleProcessRequest}
								disabled={!!processingId}
							>
								{processingId ? "Processing..." : "Confirm"}
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
