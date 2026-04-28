import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import AuthForm from "../components/AuthForm";

// 👇 Replace this with your actual app (RouteComponent or Layout wrapper)
import RouteComponent from "./RouteComponent";

const AppContent = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <p>Loading...</p>;

  // ❌ Not logged in
  if (!user) return <AuthForm />;

  // ✅ Logged in → show your app
  return <RouteComponent user={user} />;
};

export default AppContent;
