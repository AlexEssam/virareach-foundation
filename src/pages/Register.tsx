import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function Register() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-vira-cyan/5 via-transparent to-vira-purple/5" />
      <div className="absolute top-1/4 -left-32 w-64 h-64 bg-vira-cyan/10 rounded-full blur-3xl animate-pulse-slow" />
      <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-vira-purple/10 rounded-full blur-3xl animate-pulse-slow" />
      
      <div className="relative z-10 flex flex-col items-center">
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 self-start">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <AuthForm mode="register" />
      </div>
    </div>
  );
}
