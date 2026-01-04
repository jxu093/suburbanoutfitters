import { Stack } from "expo-router";
import { ToastProvider } from "./components/toast";
import { ItemsProvider } from "./contexts/items-context";

export default function RootLayout() {
  return (
    <ItemsProvider>
      <ToastProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { paddingTop: 0 }
          }}
        />
      </ToastProvider>
    </ItemsProvider>
  );
}
