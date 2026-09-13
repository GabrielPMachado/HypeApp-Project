import { Feather } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: fontFamily.bodyMedium,
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Lista",
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size ?? 20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mapa"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color, size }) => <Feather name="map" size={size ?? 20} color={color} />,
        }}
      />
    </Tabs>
  );
}
