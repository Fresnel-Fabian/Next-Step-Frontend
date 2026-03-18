/**
 * Login Screen for the app
 * - Supports email/password login and Google Sign-In
 * - Uses Expo Auth Session for Google authentication
 *
 * @see https://docs.expo.dev/versions/latest/sdk/auth-session/
 * @see https://docs.expo.dev/guides/authentication/
 * @see https://developers.google.com/identity/protocols/oauth2/web-server#node.js
 */
import { GoogleAuthConfig } from "@/config/google-auth";
import { useAuthStore } from "@/store/authStore";
import { Ionicons } from "@expo/vector-icons";
import {
  makeRedirectUri,
  ResponseType,
  useAuthRequest,
  useAutoDiscovery,
} from "expo-auth-session";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
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

// This is required for the auth session to work
WebBrowser.maybeCompleteAuthSession();

// Google's OIDC discovery document: expo-auth-session reads authorization
// and token endpoints from here automatically.
const GOOGLE_DISCOVERY_URL = "https://accounts.google.com";

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const discovery = useAutoDiscovery(GOOGLE_DISCOVERY_URL);
  const redirectUri = makeRedirectUri({
    // scheme: "myapp",  // uncomment and set for standalone builds
  });

  // ── Base useAuthRequest (NOT Google.useAuthRequest) ───────────────────────
  // Using the Google provider's hook causes it to auto-exchange the code for
  // tokens on the client side, which requires a client_secret that cannot
  // safely be bundled in a mobile app.
  //
  // The base hook just obtains the authorization code and code verifier;
  // our backend performs the actual token exchange.
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: GoogleAuthConfig.webClientId,
      scopes: GoogleAuthConfig.scopes,
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: true,
    },
    discovery,
  );

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === "success") {
      const code = response.params.code;
      const codeVerifier = request?.codeVerifier;

      if (!code || !codeVerifier) {
        setError("Google sign-in failed: missing PKCE parameters.");
        setIsLoading(false);
        return;
      }

      handleGoogleSuccess(code, codeVerifier, redirectUri);
    } else if (response?.type === "error") {
      setError(
        response.error?.message ?? "Google sign-in failed. Please try again.",
      );
      setIsLoading(false);
    } else if (response?.type === "dismiss") {
      setIsLoading(false);
    }
  }, [response]);

  const handleGoogleSuccess = async (
    code: string,
    codeVerifier: string,
    redirectUri: string,
  ) => {
    try {
      // Backend exchanges the code for id_token + access_token + refresh_token,
      // verifies identity, stores Drive tokens, and returns our own JWT.
      await loginWithGoogle(code, codeVerifier, redirectUri);
    } catch (err) {
      console.error("Google auth error:", err);
      setError("Failed to complete Google sign-in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Email/password login handler
  const handleEmailLogin = async () => {
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
    } catch {
      setError("Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await promptAsync();
    } catch (err) {
      console.error("Google prompt error:", err);
      setError("Failed to open Google sign-in");
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Logo */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="book" size={32} color="white" />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        {/* Login Form */}
        <View style={styles.formContainer}>
          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="your.email@school.edu"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#9CA3AF"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>
          </View>

          {/* Forgot Password */}
          <Pressable style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </Pressable>

          {/* Sign In Button */}
          <Pressable
            style={[styles.signInButton, isLoading && styles.buttonDisabled]}
            onPress={handleEmailLogin}
            disabled={isLoading}
          >
            {isLoading && email ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </Pressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In Button */}
          <Pressable
            style={[
              styles.googleButton,
              (!request || !discovery || isLoading) && styles.buttonDisabled,
            ]}
            onPress={handleGoogleLogin}
            disabled={!request || !discovery || isLoading}
          >
            {isLoading && !email ? (
              <ActivityIndicator color="#2563EB" />
            ) : (
              <>
                <Ionicons name="logo-google" size={20} color="#4B5563" />
                <Text style={styles.googleButtonText}>Google</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Need help? Contact your administrator
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    backgroundColor: "#2563EB",
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 4,
  },
  subtitle: { fontSize: 14, color: "#6B7280" },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: { flex: 1, fontSize: 14, color: "#DC2626" },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "white",
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 12, fontSize: 16, color: "#111827" },
  forgotPassword: { alignSelf: "flex-end", marginBottom: 16 },
  forgotPasswordText: { fontSize: 14, color: "#2563EB", fontWeight: "600" },
  signInButton: {
    backgroundColor: "#2563EB",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  signInButtonText: { color: "white", fontSize: 16, fontWeight: "600" },
  buttonDisabled: { opacity: 0.7 },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 16, fontSize: 14, color: "#6B7280" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  googleButtonText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 24,
  },
});