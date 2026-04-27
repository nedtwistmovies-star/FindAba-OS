import { useEffect, useState } from "react";
import { subscribeToast } from "../lib/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<string[]>([]);

  useEffect(() => {
    const unsub = subscribeToast((msg: string) => {
      setToasts((prev) => [...prev, msg]);

      setTimeout(() => {
        setToasts((prev) => prev.slice(1));
      }, 3000);
    });

    return unsub;
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t, i) => (
        <div
          key={i}
          className="bg-black text-white px-4 py-2 rounded-xl shadow-lg animate-slideIn"
        >
          {t}
        </div>
      ))}
    </div>
  );
      }
