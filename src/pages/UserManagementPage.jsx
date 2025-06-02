import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Button } from "../components/ui/Button";
import { useUppercaseForm } from "../hooks/useUppercaseForm";

const UserManagementPage = () => {
    const { currentUser, isLoading } = useAuth();
    const [users, setUsers] = useState([]);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);

    // Initial form state for new user
    const initialNewUserState = {
        username: "",
        email: "",
        password: "",
        role: "sales",
    };

    // Initial form state for editing user
    const initialEditUserState = {
        id: "",
        username: "",
        email: "",
        password: "",
        role: "sales",
    };

    const fetchUsers = async () => {
        try {
            setPageLoading(true);
            console.log("Fetching users from API...");
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                }
            );

            console.log("Response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error:", errorData);
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }

            const data = await response.json();
            console.log("Received users data:", data);

            // The backend returns users array directly, not nested in a users property
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError(err.message);
        } finally {
            setPageLoading(false);
        }
    };

    useEffect(() => {
        console.log("UserManagementPage useEffect - isLoading:", isLoading);
        console.log("UserManagementPage useEffect - currentUser:", currentUser);

        // Wait for AuthContext loading to finish and currentUser to be available.
        // AdminRoute should ensure that only authenticated admins reach here.
        if (!isLoading && currentUser) {
            console.log(
                "Auth loading complete and user is available, attempting to fetch users."
            );
            fetchUsers();
        } else if (!isLoading && !currentUser) {
            // If loading is complete but no user is available, something is wrong (AdminRoute should have redirected).
            // Set an authentication error state as a fallback.
            console.log(
                "Auth loading complete but user not available - fallback to auth error."
            );
            setError("Authentication required.");
            setPageLoading(false);
        }
        // If isLoading is true, the initial pageLoading state handles the indicator.
    }, [isLoading, currentUser]); // Depend on isLoading and currentUser

    // Add user form handlers
    const handleAddUserSubmit = async (formData) => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                    body: JSON.stringify(formData),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }
            toast.success("User added successfully!");
            resetAddForm();
            setShowAddForm(false);
            fetchUsers(); // Refresh the list after adding
        } catch (err) {
            toast.error("Error adding user: " + err.message);
            setError(err.message);
        }
    };

    // Edit user form handlers
    const handleEditUserSubmit = async (formData) => {
        try {
            const { id, username, email, role, password } = formData;
            const updateData = { username, email, role };
            if (password) {
                updateData.password = password;
            }
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/users/${id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${localStorage.getItem(
                            "token"
                        )}`,
                    },
                    body: JSON.stringify(updateData),
                }
            );
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.error || `HTTP error! status: ${response.status}`
                );
            }
            toast.success("User updated successfully!");
            setEditingUser(null);
            resetEditForm();
            fetchUsers(); // Refresh the list after editing
        } catch (err) {
            toast.error("Error updating user: " + err.message);
            setError(err.message);
        }
    };

    // Initialize form hooks
    const {
        formData: newUserFormData,
        handleChange: handleAddUserChange,
        handleSubmit: handleAddUserFormSubmit,
        resetForm: resetAddForm,
    } = useUppercaseForm(initialNewUserState, null, handleAddUserSubmit);

    const {
        formData: editUserFormData,
        handleChange: handleEditUserChange,
        handleSubmit: handleEditUserFormSubmit,
        resetForm: resetEditForm,
        setFormData: setEditUserFormData,
    } = useUppercaseForm(initialEditUserState, null, handleEditUserSubmit);

    const handleEditClick = (user) => {
        setEditUserFormData({ ...user, password: "" });
        setEditingUser(user);
        setShowAddForm(false);
    };

    const handleDeleteClick = async (userId) => {
        if (window.confirm("Are you sure you want to soft delete this user?")) {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/users/${userId}`,
                    {
                        method: "DELETE",
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem(
                                "token"
                            )}`,
                        },
                    }
                );
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.error ||
                            `HTTP error! status: ${response.status}`
                    );
                }
                toast.success("User soft deleted successfully!");
                fetchUsers(); // Refresh the list after deleting
            } catch (err) {
                toast.error("Error deleting user: " + err.message);
                setError(err.message);
            }
        }
    };

    // Render logic: Show loading or error, otherwise render content
    if (isLoading || pageLoading) {
        return <div className="p-4">Loading users...</div>;
    }

    if (error) {
        return <div className="p-4 text-red-500">Error: {error}</div>;
    }

    // If we reach here, isLoading is false, pageLoading is false, and no fetch error.
    // AdminRoute should have prevented non-admins from reaching this point.
    // We can render the user management content.

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                User Management
            </h1>

            {!editingUser && (
                <Button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="mb-4"
                >
                    {showAddForm ? "Cancel Add User" : "Add New User"}
                </Button>
            )}

            {showAddForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Add New User
                    </h2>
                    <form
                        onSubmit={handleAddUserFormSubmit}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username:
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={newUserFormData.username}
                                onChange={handleAddUserChange}
                                required
                                autoComplete="off-username"
                                placeholder="Enter username"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email:
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={newUserFormData.email}
                                onChange={handleAddUserChange}
                                required
                                autoComplete="off-email"
                                placeholder="Enter email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password:
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={newUserFormData.password}
                                onChange={handleAddUserChange}
                                required
                                autoComplete="new-password"
                                placeholder="Enter password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role:
                            </label>
                            <select
                                name="role"
                                value={newUserFormData.role}
                                onChange={handleAddUserChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="sales">Sales</option>
                                <option value="operator">Operator</option>
                                <option value="factory">Factory</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-span-full flex space-x-4 mt-4">
                            <Button type="submit">Create User</Button>
                            <Button
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {editingUser && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">
                        Edit User
                    </h2>
                    <form
                        onSubmit={handleEditUserFormSubmit}
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username:
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={editUserFormData.username}
                                onChange={handleEditUserChange}
                                required
                                autoComplete="off-username"
                                placeholder="Enter username"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email:
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={editUserFormData.email}
                                onChange={handleEditUserChange}
                                required
                                autoComplete="off-email"
                                placeholder="Enter email"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password (leave blank to keep current):
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={editUserFormData.password}
                                onChange={handleEditUserChange}
                                autoComplete="new-password"
                                placeholder="Leave blank to keep current password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role:
                            </label>
                            <select
                                name="role"
                                value={editUserFormData.role}
                                onChange={handleEditUserChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                            >
                                <option value="sales">Sales</option>
                                <option value="operator">Operator</option>
                                <option value="factory">Factory</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="col-span-full flex space-x-4 mt-4">
                            <Button type="submit">Update User</Button>
                            <Button
                                type="button"
                                onClick={() => setEditingUser(null)}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {!showAddForm && !editingUser && (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {users.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                            <p>No users found. This could mean:</p>
                            <ul className="mt-2 text-sm">
                                <li>• API authentication failed</li>
                                <li>• No users exist in the database</li>
                                <li>• API endpoint returned empty array</li>
                            </ul>
                            <Button
                                onClick={fetchUsers}
                                className="mt-4"
                                variant="outline"
                            >
                                Retry Fetch Users
                            </Button>
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Username
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Email
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Role
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map((u) => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {u.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {u.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                                            {u.role}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() =>
                                                    handleEditClick(u)
                                                }
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteClick(u.id)
                                                }
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;
