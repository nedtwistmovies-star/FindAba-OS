
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: string) => void;
  appLogo: string;
  oracleAvatar: string;
  socialLinks: any;

  // 🔴 ADD THESE
  orderCount?: number;
  messageCount?: number;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  currentView,
  setView,
  appLogo,
  oracleAvatar,
  socialLinks,
  orderCount = 0,
  messageCount = 0,
}) => {

  // 🔴 BADGE COMPONENT (INLINE — NO EXTRA FILE NEEDED)
  const Badge = ({ count }: { count: number }) => {
    if (!count) return null;

    return (
      <span className="ml-1 px-2 py-0.5 text-xs bg-red-600 text-white rounded-full">
        {count}
      </span>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}
      <header className="flex items-center justify-between p-3 shadow bg-white">
        <img src={appLogo} alt="logo" className="h-8" />

        <div className="flex items-center gap-4">
          <button onClick={() => setView("messages")} className="relative">
            💬
            <Badge count={messageCount} />
          </button>

          <button onClick={() => setView("orders")} className="relative">
            📦
            <Badge count={orderCount} />
          </button>
        </div>
      </header>

      {/* ========================= */}
      {/* MAIN CONTENT */}
      {/* ========================= */}
      <main className="flex-1">{children}</main>

      {/* ========================= */}
      {/* BOTTOM NAV (MOBILE) */}
      {/* ========================= */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around py-2">

        <button onClick={() => setView("home")}>
          Home
        </button>

        <button onClick={() => setView("messages")} className="relative">
          Messages
          <Badge count={messageCount} />
        </button>

        <button onClick={() => setView("orders")} className="relative">
          Orders
          <Badge count={orderCount} />
        </button>

        <button onClick={() => setView("profile")}>
          Profile
        </button>

      </nav>

    </div>
  );
};

export default Layout;
