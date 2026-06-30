import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Ranking from "./pages/Ranking";
import Lineups from "./pages/Lineups";
import Layout from "./components/Layout";
import type { ReactNode } from "react";

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user is locked, show a locked screen
  if (user.is_locked) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-red-500 mb-2">
          Conta Bloqueada
        </h1>
        <p className="text-neutral-400 text-center">
          Sua conta foi bloqueada pelo administrador.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans selection:bg-emerald-500/30">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="ranking" element={<Ranking />} />
              <Route path="escalacoes" element={<Lineups />} />
            </Route>
          </Routes>
        </div>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#171717",
              color: "#fff",
              border: "1px solid #262626",
            },
          }}
        />
      </Router>
    </AuthProvider>
  );
}
