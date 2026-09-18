import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FeedbackModal } from "@/components/FeedbackModal";
import { isGoogleSignInConfigured, useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";

type Mode = "login" | "signup";

// Firebase manda o motivo como um código (ex: "auth/wrong-password") —
// traduz pros mesmos avisos diretos e em PT-BR do resto do app.
function mapAuthError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "Senha muito curta (mínimo 6 caracteres).";
    case "auth/email-already-in-use":
      return "Esse e-mail já tem conta — tenta entrar em vez de criar.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";
    case "auth/user-not-found":
      return "Não achamos conta com esse e-mail.";
    case "auth/too-many-requests":
      return "Muitas tentativas — espera um pouco antes de tentar de novo.";
    default:
      return "Não deu pra continuar. Tenta de novo em instantes.";
  }
}

// Tela cheia (não modal) — é o "portão" de entrada do app quando o
// Firebase está configurado (ver RootNavigator em app/_layout.tsx). Sem
// conta, é só o que a pessoa vê.
export function AuthScreen() {
  const { signUpWithEmail, signInWithEmail, signInWithGoogle, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isResetSent, setResetSent] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSubmitting(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(name.trim(), email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (submitError) {
      setError(mapAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (submitError) {
      setError(mapAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Digita seu e-mail acima primeiro.");
      return;
    }
    setError("");
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (submitError) {
      setError(mapAuthError(submitError));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.wordmarkRow}>
          <View style={styles.wordmarkDot} />
          <Text style={styles.wordmark}>HYPEAPP</Text>
        </View>
        <Text style={styles.subtitle}>
          {mode === "login" ? "Entra pra ver o que tá bombando agora." : "Cria sua conta em segundos."}
        </Text>

        <View style={styles.form}>
          {mode === "signup" && (
            <View style={styles.inputRow}>
              <Feather name="user" size={15} color={colors.textFaint} />
              <TextInput
                style={styles.input}
                placeholder="Nome"
                placeholderTextColor={colors.textFaint}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.inputRow}>
            <Feather name="mail" size={15} color={colors.textFaint} />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor={colors.textFaint}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputRow}>
            <Feather name="lock" size={15} color={colors.textFaint} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor={colors.textFaint}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {error.length > 0 && <Text style={styles.error}>{error}</Text>}

          <Pressable
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={({ pressed }) => [
              styles.submitButton,
              (pressed || isSubmitting) && styles.submitButtonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitText}>{mode === "login" ? "Entrar" : "Criar conta"}</Text>
            )}
          </Pressable>

          {mode === "login" && (
            <Pressable onPress={handleForgotPassword} hitSlop={8}>
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </Pressable>
          )}
        </View>

        {isGoogleSignInConfigured && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>ou</Text>
              <View style={styles.dividerLine} />
            </View>

            <Pressable
              onPress={handleGoogle}
              disabled={isSubmitting}
              style={({ pressed }) => [styles.googleButton, pressed && styles.submitButtonPressed]}
            >
              <Feather name="chrome" size={16} color={colors.text} />
              <Text style={styles.googleText}>Continuar com Google</Text>
            </Pressable>
          </>
        )}

        <Pressable
          onPress={() => {
            setError("");
            setMode(mode === "login" ? "signup" : "login");
          }}
          hitSlop={8}
          style={styles.toggleRow}
        >
          <Text style={styles.toggleText}>
            {mode === "login" ? "Não tem conta? " : "Já tem conta? "}
            <Text style={styles.toggleTextAccent}>{mode === "login" ? "Criar uma" : "Entrar"}</Text>
          </Text>
        </Pressable>
      </ScrollView>

      <FeedbackModal
        visible={isResetSent}
        icon="mail"
        title="E-mail enviado"
        message="Confere sua caixa de entrada pra redefinir a senha."
        onClose={() => setResetSent(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  wordmarkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 8,
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  wordmark: {
    fontSize: 22,
    fontFamily: fontFamily.display,
    color: colors.text,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 28,
  },
  form: {
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  error: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.hypeHigh,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 13,
    minHeight: 46,
  },
  submitButtonPressed: {
    opacity: 0.85,
  },
  submitText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  linkText: {
    fontSize: 12,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
    textAlign: "center",
    marginTop: 4,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 10,
    paddingVertical: 13,
  },
  googleText: {
    fontSize: 14,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
  toggleRow: {
    marginTop: 24,
    alignItems: "center",
  },
  toggleText: {
    fontSize: 13,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
  },
  toggleTextAccent: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
});
