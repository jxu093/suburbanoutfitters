import { Stack } from "expo-router";
import { ToastProvider } from "./components/toast";

export default function RootLayout() {
  return (
    <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { paddingTop: 0 }
        }}
      />
    </ToastProvider>
  );
}
