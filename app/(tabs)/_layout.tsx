import { Tabs } from "expo-router";
import { Text } from "react-native";

import { colors } from "@/theme/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lista",
          tabBarIcon: ({ color }) => <TabEmoji symbol="📋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => <TabEmoji symbol="🗺️" color={color} />,
        }}
      />
    </Tabs>
  );
}

// Placeholder simples de ícone (emoji) até definirmos um set de ícones
// (ex: @expo/vector-icons) para o app.
function TabEmoji({ symbol }: { symbol: string; color: string }) {
  return <Text style={{ fontSize: 18 }}>{symbol}</Text>;
}
