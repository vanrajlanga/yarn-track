import React from "react";
import PropTypes from "prop-types";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { Layout } from "./components/Layout";
import { OrderDashboard } from "./components/OrderDashboard";
import ChangeRequestsPage from "./pages/ChangeRequestsPage";

// Protected Route component
const ProtectedRoute = ({ children }) => {
	const { currentUser, isLoading } = useAuth();

	// Don't redirect while still checking authentication
	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!currentUser) {
		return <Navigate to="/login" replace />;
	}

	return <>{children}</>;
};

// Admin-only route component
const AdminRoute = ({ children }) => {
	const { currentUser, isLoading } = useAuth();

	// Don't redirect while still checking authentication
	if (isLoading) {
		return <div>Loading...</div>;
	}

	if (!currentUser) {
		return <Navigate to="/login" replace />;
	}

	// Redirect non-admin users to orders page
	if (currentUser.role !== "admin") {
		return <Navigate to="/orders" replace />;
	}

	return <>{children}</>;
};

ProtectedRoute.propTypes = {
	children: PropTypes.node.isRequired,
};

AdminRoute.propTypes = {
	children: PropTypes.node.isRequired,
};

// Create a DefaultRedirect component that uses useAuth hook inside the AuthProvider
const DefaultRedirect = () => {
	const { currentUser } = useAuth();
	const path = !currentUser
		? "/login"
		: currentUser.role === "admin"
		? "/dashboard"
		: "/orders";
	return <Navigate to={path} replace />;
};

const App = () => {
	return (
		<AuthProvider>
			<OrderProvider>
				<Router>
					<Routes>
						<Route path="/login" element={<LoginPage />} />
						<Route path="/" element={<DefaultRedirect />} />
						<Route
							path="/dashboard"
							element={
								<AdminRoute>
									<Dashboard />
								</AdminRoute>
							}
						/>
						<Route
							path="/orders"
							element={
								<ProtectedRoute>
									<Layout>
										<OrderDashboard />
									</Layout>
								</ProtectedRoute>
							}
						/>
						<Route
							path="/change-requests"
							element={
								<ProtectedRoute>
									<ChangeRequestsPage />
								</ProtectedRoute>
							}
						/>
						<Route path="*" element={<DefaultRedirect />} />
					</Routes>
					<ToastContainer />
				</Router>
			</OrderProvider>
		</AuthProvider>
	);
};

export default App;
