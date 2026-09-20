import { Feather } from "@expo/vector-icons";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

// Rede de segurança na raiz do app: um erro de renderização que ninguém
// previu vira uma tela amigável com "Tentar de novo" em vez de uma tela
// branca (em produção não existe a tela vermelha do desenvolvimento).
// Fica FORA dos providers de propósito, então não pode depender de nenhum
// contexto (auth, bares, localização).
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro não tratado na interface:", error, info.componentStack);
  }

  private retry = () => this.setState({ hasError: false });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.screen} accessibilityRole="alert">
        <View style={styles.iconCircle}>
          <Feather name="alert-triangle" size={30} color={colors.accent} />
        </View>
        <Text style={styles.title}>Algo deu errado</Text>
        <Text style={styles.message}>
          O app encontrou um problema inesperado. Seus dados estão salvos — tenta de novo.
        </Text>
        <Pressable
          onPress={this.retry}
          accessibilityRole="button"
          accessibilityLabel="Tentar de novo"
          style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        >
          <Text style={styles.buttonText}>Tentar de novo</Text>
        </Pressable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accentMuted,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.display,
    color: colors.text,
  },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 21,
    maxWidth: 300,
  },
  button: {
    marginTop: 10,
    minHeight: 48,
    paddingHorizontal: 28,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontSize: 15,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
});
