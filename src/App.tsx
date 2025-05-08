import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { OrderProvider } from "./context/OrderContext";
import { LoginPage } from "./pages/LoginPage";
import { Dashboard } from "./pages/Dashboard";
import { Layout } from "./components/Layout";
import { OrderDashboard } from "./components/OrderDashboard";

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
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

const App: React.FC = () => {
	return (
		<AuthProvider>
			<OrderProvider>
				<Router>
					<Routes>
						<Route path="/login" element={<LoginPage />} />
						<Route
							path="/"
							element={<Navigate to="/dashboard" replace />}
						/>
						<Route
							path="/dashboard"
							element={
								<ProtectedRoute>
									<Dashboard />
								</ProtectedRoute>
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
							path="*"
							element={<Navigate to="/dashboard" replace />}
						/>
					</Routes>
				</Router>
			</OrderProvider>
		</AuthProvider>
	);
};

export default App;
