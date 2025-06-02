import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Package, User, Lock } from "lucide-react";
import { useUppercaseForm } from "../hooks/useUppercaseForm";

export const LoginPage = () => {
    const { login, isLoading, currentUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState("");

    // Initial form state
    const initialFormState = {
        username: "",
        password: "",
    };

    useEffect(() => {
        // Only redirect if we're on the login page and user is logged in
        if (currentUser && location.pathname === "/login") {
            // Redirect admin to dashboard, others to orders
            const redirectPath =
                currentUser.role === "admin" ? "/dashboard" : "/orders";
            navigate(redirectPath, { replace: true });
        }
    }, [currentUser, navigate, location.pathname]);

    const handleLoginSubmit = async (formData) => {
        setError("");

        if (!formData.username || !formData.password) {
            setError("Please enter both username and password");
            return;
        }

        const success = await login(formData.username, formData.password);

        if (success) {
            // Get user from local storage since currentUser might not be updated yet
            const userData = JSON.parse(localStorage.getItem("user"));
            // Redirect admin to dashboard, others to orders
            const redirectPath =
                userData?.role === "admin" ? "/dashboard" : "/orders";
            navigate(redirectPath, { replace: true });
        } else {
            setError("Invalid username or password");
        }
    };

    // Use form hook
    const { formData, handleChange, handleSubmit } = useUppercaseForm(
        initialFormState,
        null,
        handleLoginSubmit
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                <div className="text-center mb-8">
                    <Package className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900">
                        Yarn Track
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Sign in to your account
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Username
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your username"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your password"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
            </div>
        </div>
    );
};
