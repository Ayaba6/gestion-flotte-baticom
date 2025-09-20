// src/components/ui/use-toast.js
import { createContext, useContext, useState } from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [messages, setMessages] = useState([]);

  const toast = ({ title, description }) => {
    setMessages([...messages, { id: Date.now(), title, description }]);
    setTimeout(() => {
      setMessages((prev) => prev.slice(1));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className="bg-gray-800 text-white px-4 py-2 rounded shadow"
          >
            <strong>{msg.title}</strong>
            <p className="text-sm">{msg.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
