import * as React from 'react';
import { Toast, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast';

interface ToastMessage {
  id: number;
  title?: string;
  description?: string;
}

const ToastContext = React.createContext<{
  toast: (message: Omit<ToastMessage, 'id'>) => void;
} | null>(null);

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast harus dipakai di dalam ToastProvider');
  return context.toast;
};

export const ToastContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const toast = (message: Omit<ToastMessage, 'id'>) => {
    const id = Date.now();
    setMessages((prev) => [...prev, { id, ...message }]);
  };

  const remove = (id: number) => {
    setMessages((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider>
        {children}
        <ToastViewport />
        {messages.map((item) => (
          <Toast key={item.id} duration={2500} onOpenChange={(open) => !open && remove(item.id)}>
            {item.title && <ToastTitle>{item.title}</ToastTitle>}
            {item.description && <ToastDescription>{item.description}</ToastDescription>}
          </Toast>
        ))}
      </ToastProvider>
    </ToastContext.Provider>
  );
};
