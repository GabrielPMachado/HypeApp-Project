import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRef, useState, type ReactNode } from "react";
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
  type TextInputProps,
} from "react-native";

import { FeedbackModal } from "@/components/FeedbackModal";
import { GoogleLogo } from "@/components/GoogleLogo";
import { PressableScale } from "@/components/PressableScale";
import { isGoogleSignInConfigured, useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { fontFamily } from "@/theme/typography";
import { haptics } from "@/utils/haptics";

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
    case "auth/network-request-failed":
      return "Sem conexão com a internet. Confere o Wi-Fi ou os dados móveis.";
    default:
      return "Não deu pra continuar. Tenta de novo em instantes.";
  }
}

interface FieldProps extends TextInputProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  inputRef?: React.RefObject<TextInput | null>;
  right?: ReactNode;
}

// Campo com ícone à esquerda e (opcional) ação à direita. O `label` vira
// o rótulo de acessibilidade — o placeholder some quando a pessoa digita
// e leitores de tela não o anunciam de forma confiável.
function Field({ icon, label, inputRef, right, style, ...inputProps }: FieldProps) {
  return (
    <View style={styles.inputRow}>
      <Feather name={icon} size={16} color={colors.textFaint} />
      <TextInput
        ref={inputRef}
        style={[styles.input, style]}
        placeholderTextColor={colors.textFaint}
        accessibilityLabel={label}
        placeholder={label}
        {...inputProps}
      />
      {right}
    </View>
  );
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [isResetSent, setResetSent] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const isSignup = mode === "signup";

  const changeMode = (next: Mode) => {
    if (next === mode) return;
    haptics.tap();
    setError("");
    setMode(next);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setError("");
    // O perfil é público e as regras do Firestore exigem nome de 2 a 30
    // letras — melhor barrar aqui do que criar a conta e falhar ao gravar
    // o perfil.
    if (isSignup && (name.trim().length < 2 || name.trim().length > 30)) {
      haptics.warning();
      setError("Digita seu nome (entre 2 e 30 letras).");
      return;
    }
    setSubmitting(true);
    try {
      if (isSignup) {
        await signUpWithEmail(name.trim(), email.trim(), password);
      } else {
        await signInWithEmail(email.trim(), password);
      }
      haptics.success();
    } catch (submitError) {
      haptics.warning();
      setError(mapAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    if (isSubmitting) return;
    setError("");
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (submitError) {
      haptics.warning();
      setError(mapAuthError(submitError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      haptics.warning();
      setError("Digita seu e-mail acima primeiro.");
      return;
    }
    setError("");
    try {
      await resetPassword(email.trim());
      setResetSent(true);
    } catch (submitError) {
      haptics.warning();
      setError(mapAuthError(submitError));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <LinearGradient colors={["#2A2418", "#15130E"]} style={styles.logoMark} aria-hidden>
            <MaterialCommunityIcons name="lightning-bolt" size={38} color={colors.accent} />
          </LinearGradient>
          <Text style={styles.wordmark} accessibilityRole="header">
            HYPEAPP
          </Text>
          <Text style={styles.subtitle}>
            {isSignup ? "Cria sua conta em segundos." : "Entra pra ver o que tá bombando agora."}
          </Text>
        </View>

        <View style={styles.segmented} accessibilityRole="tablist">
          {(["login", "signup"] as const).map((option) => {
            const selected = mode === option;
            return (
              <Pressable
                key={option}
                onPress={() => changeMode(option)}
                style={[styles.segment, selected && styles.segmentSelected]}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                accessibilityLabel={option === "login" ? "Entrar" : "Criar conta"}
              >
                <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                  {option === "login" ? "Entrar" : "Criar conta"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.form}>
          {isSignup && (
            <Field
              icon="user"
              label="Nome"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
              submitBehavior="submit"
            />
          )}

          <Field
            icon="mail"
            label="E-mail"
            inputRef={emailRef}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            submitBehavior="submit"
          />

          <Field
            icon="lock"
            label="Senha"
            inputRef={passwordRef}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={isSignup ? "new-password" : "current-password"}
            textContentType={isSignup ? "newPassword" : "password"}
            returnKeyType="go"
            onSubmitEditing={handleSubmit}
            right={
              <Pressable
                onPress={() => setShowPassword((value) => !value)}
                hitSlop={10}
                style={styles.eyeButton}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={18} color={colors.textMuted} />
              </Pressable>
            }
          />

          {isSignup && !error && <Text style={styles.helper}>Use pelo menos 6 caracteres na senha.</Text>}

          {error.length > 0 && (
            <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {error}
            </Text>
          )}

          <PressableScale
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={styles.submitButton}
            accessibilityRole="button"
            accessibilityLabel={isSignup ? "Criar conta" : "Entrar"}
            accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={styles.submitText}>{isSignup ? "Criar conta" : "Entrar"}</Text>
            )}
          </PressableScale>

          {!isSignup && (
            <Pressable
              onPress={handleForgotPassword}
              hitSlop={8}
              style={styles.linkButton}
              accessibilityRole="button"
              accessibilityLabel="Esqueci minha senha"
            >
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

            <PressableScale
              onPress={handleGoogle}
              disabled={isSubmitting}
              style={styles.googleButton}
              accessibilityRole="button"
              accessibilityLabel="Continuar com Google"
            >
              <GoogleLogo size={20} />
              <Text style={styles.googleText}>Continuar com Google</Text>
            </PressableScale>
          </>
        )}
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
    gap: 22,
  },
  brand: {
    alignItems: "center",
    gap: 8,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(232, 178, 77, 0.3)",
    marginBottom: 4,
  },
  wordmark: {
    fontSize: 24,
    fontFamily: fontFamily.display,
    color: colors.text,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
  },
  segment: {
    flex: 1,
    minHeight: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segmentSelected: {
    backgroundColor: colors.accentMuted,
  },
  segmentText: {
    fontSize: 14,
    fontFamily: fontFamily.bodyMedium,
    color: colors.textMuted,
  },
  segmentTextSelected: {
    fontFamily: fontFamily.bodySemiBold,
    color: colors.accent,
  },
  form: {
    gap: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    minHeight: 50,
    fontSize: 15,
    fontFamily: fontFamily.body,
    color: colors.text,
  },
  eyeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  error: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.hypeHigh,
  },
  submitButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.accent,
    borderRadius: 12,
    minHeight: 50,
  },
  submitText: {
    fontSize: 15,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.background,
  },
  linkButton: {
    alignSelf: "center",
    minHeight: 32,
    justifyContent: "center",
  },
  linkText: {
    fontSize: 13,
    fontFamily: fontFamily.bodyMedium,
    color: colors.accent,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: fontFamily.body,
    color: colors.textFaint,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 12,
    minHeight: 50,
  },
  googleText: {
    fontSize: 15,
    fontFamily: fontFamily.bodySemiBold,
    color: colors.text,
  },
});
