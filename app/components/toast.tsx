import Ionicons from '@expo/vector-icons/Ionicons';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { Animated, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { Colors, Radii, Shadows, Spacing } from '../constants/theme';

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
  const translateY = useRef(new Animated.Value(20)).current;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 100, friction: 10, useNativeDriver: true }),
    ]).start();

    const hideTimer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -10, duration: 200, useNativeDriver: true }),
      ]).start();
    }, 2500);

    return () => clearTimeout(hideTimer);
  }, [opacity, translateY]);

  const backgroundColor =
    type === 'success' ? colors.success : type === 'error' ? colors.error : colors.tint;

  const iconName: keyof typeof Ionicons.glyphMap =
    type === 'success' ? 'checkmark-circle' : type === 'error' ? 'alert-circle' : 'information-circle';

  return (
    <Animated.View
      style={[
        styles.toast,
        Shadows.modal,
        { opacity, backgroundColor, transform: [{ translateY }] },
      ]}
    >
      <Ionicons name={iconName} size={18} color="#fff" />
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
    gap: Spacing.sm,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radii.pill,
    maxWidth: '85%',
  },
  text: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});
