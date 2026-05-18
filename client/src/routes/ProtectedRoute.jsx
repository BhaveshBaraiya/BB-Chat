import { useContext} from "react";

import { Navigate } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children}) {

    const { user, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                Loading...
            </div>
        );
    }

    return user ? children : <Navigate to="/" />;
}