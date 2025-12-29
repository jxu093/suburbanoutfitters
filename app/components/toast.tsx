import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);
  const lastMessageRef = useRef<string>('');
  const lastTimeRef = useRef<number>(0);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const now = Date.now();

    // Prevent duplicate toasts within 500ms
    if (message === lastMessageRef.current && now - lastTimeRef.current < 500) {
      return;
    }

    lastMessageRef.current = message;
    lastTimeRef.current = now;

    const id = ++idRef.current;
    setToasts((prev) => {
      // Limit to max 3 toasts at once, remove oldest if needed
      const newToasts = prev.length >= 3 ? prev.slice(1) : prev;
      return [...newToasts, { id, message, type }];
    });

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View style={styles.container} pointerEvents="none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} message={toast.message} type={toast.type} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

function ToastItem({ message, type }: { message: string; type: ToastType }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacity]);

  const backgroundColor =
    type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3';

  return (
    <Animated.View style={[styles.toast, { opacity, backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 8,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    maxWidth: '80%',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});
