import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

import { supabase } from "../lib/supabase";
import { User } from "../types";

interface EnterpriseUserContextType {

    user: User | null;

    loading: boolean;

    refreshUser: () => Promise<void>;

    signOut: () => Promise<void>;

    isAuthenticated: boolean;

    isAdmin: boolean;

    isBusinessOwner: boolean;

}

const EnterpriseUserContext =
    createContext<EnterpriseUserContextType | null>(null);

export const EnterpriseUserProvider = ({
    children,
}: {
    children: React.ReactNode;
}) => {

    const [user, setUser] = useState<User | null>(null);

    const [loading, setLoading] = useState(true);

    //--------------------------------------------------
    // Load Profile
    //--------------------------------------------------

    const refreshUser = async () => {

        setLoading(true);

        try {

            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();

            if (!authUser) {

                setUser(null);

                return;

            }

            const { data } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", authUser.id)
                .single();

            if (data) {

                setUser(data as User);

            }

        } finally {

            setLoading(false);

        }

    };

    //--------------------------------------------------
    // Logout
    //--------------------------------------------------

    const signOut = async () => {

        await supabase.auth.signOut();

        setUser(null);

    };

    //--------------------------------------------------
    // Initial Load
    //--------------------------------------------------

    useEffect(() => {

        refreshUser();

        const {

            data: listener,

        } = supabase.auth.onAuthStateChange(() => {

            refreshUser();

        });

        return () => {

            listener.subscription.unsubscribe();

        };

    }, []);

    //--------------------------------------------------
    // Derived State
    //--------------------------------------------------

    const value = useMemo(() => ({

        user,

        loading,

        refreshUser,

        signOut,

        isAuthenticated: !!user,

        isAdmin:
            user?.role === "admin" ||
            user?.role === "super_admin",

        isBusinessOwner:
            user?.role === "business_owner",

    }), [user, loading]);

    return (

        <EnterpriseUserContext.Provider value={value}>

            {children}

        </EnterpriseUserContext.Provider>

    );

};

export const useEnterpriseUser = () => {

    const ctx = useContext(EnterpriseUserContext);

    if (!ctx) {

        throw new Error(
            "useEnterpriseUser must be used inside EnterpriseUserProvider"
        );

    }

    return ctx;

};
