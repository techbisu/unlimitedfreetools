import { useEffect, useState } from "react";

export function useToolToast(duration = 2400) {
  const [toast, setToast] = useState({ message: "", tone: "default" });

  useEffect(() => {
    if (!toast.message) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setToast({ message: "", tone: "default" });
    }, duration);

    return () => window.clearTimeout(timer);
  }, [toast, duration]);

  return {
    toast,
    showToast(message, tone = "default") {
      setToast({ message, tone });
    }
  };
}
