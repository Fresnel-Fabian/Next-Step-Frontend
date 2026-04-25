// app/invite.tsx
/**
 * Invite acceptance screen.
 *
 * Flow:
 * 1. User opens invite link: http://localhost:8081/invite?token=xxx
 * 2. This screen validates the token with the backend
 * 3. User clicks "Accept & Sign in with Google"
 * 4. Google auth runs — backend matches their email to the invite
 * 5. Account is created with the correct role (STUDENT or TEACHER)
 * 6. User is redirected to their dashboard
 */

import { GoogleAuthConfig } from '@/config/google-auth';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import {
    makeRedirectUri,
    ResponseType,
    useAuthRequest,
    useAutoDiscovery,
} from 'expo-auth-session';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

interface InviteInfo {
  email: string;
  role: string;
  expires_at: string;
}

export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { loginWithGoogle } = useAuthStore();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  // Google PKCE auth setup — same as login screen
  const discovery = useAutoDiscovery('https://accounts.google.com');
  const redirectUri = makeRedirectUri();

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

  // Validate the token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invite link. No token found.');
      setLoading(false);
      return;
    }
    validateToken();
  }, [token]);

  // Handle Google auth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGoogleSuccess(code);
    } else if (response?.type === 'error') {
      setError('Google sign-in failed. Please try again.');
      setSigningIn(false);
    } else if (response?.type === 'dismiss') {
      setSigningIn(false);
    }
  }, [response]);

  const validateToken = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/v1/invitations/validate?token=${token}`);
      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'This invite link is invalid or has expired.');
        return;
      }
      setInvite(await res.json());
    } catch {
      setError('Could not connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (code: string) => {
    if (!code || !request?.codeVerifier) {
      setError('Failed to get authorization code.');
      setSigningIn(false);
      return;
    }
    try {
      await loginWithGoogle(code, request.codeVerifier, redirectUri);
      // Navigation happens automatically via root layout based on role
    } catch {
      setError('Failed to complete sign-in. Make sure you sign in with the invited email.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleAccept = async () => {
    setSigningIn(true);
    setError(null);
    try {
      await promptAsync();
    } catch {
      setError('Failed to open Google sign-in.');
      setSigningIn(false);
    }
  };

  const roleLabel = invite?.role
    ? invite.role.charAt(0) + invite.role.slice(1).toLowerCase()
    : '';

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Validating invite...</Text>
      </View>
    );
  }

  // Error state
  if (error && !invite) {
    return (
      <View style={styles.centered}>
        <View style={styles.errorIcon}>
          <Ionicons name="close-circle" size={48} color="#EF4444" />
        </View>
        <Text style={styles.errorTitle}>Invalid Invite</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable style={styles.backBtn} onPress={() => router.replace('/')}>
          <Text style={styles.backBtnText}>Go to Login</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Ionicons name="mail-open-outline" size={36} color="#2563EB" />
        </View>

        {/* Title */}
        <Text style={styles.title}>You're Invited!</Text>
        <Text style={styles.subtitle}>
          You've been invited to join{' '}
          <Text style={styles.bold}>Next Step</Text> as a{' '}
          <Text style={styles.bold}>{roleLabel}</Text>.
        </Text>

        {/* Invite details */}
        <View style={styles.detailBox}>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>{invite?.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={styles.detailText}>Role: {roleLabel}</Text>
          </View>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="information-circle-outline" size={16} color="#D97706" />
          <Text style={styles.warningText}>
            You must sign in with <Text style={styles.bold}>{invite?.email}</Text> for this invite to work.
          </Text>
        </View>

        {/* Error */}
        {error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Accept Button */}
        <Pressable
          style={[styles.acceptBtn, (!request || signingIn) && styles.btnDisabled]}
          onPress={handleAccept}
          disabled={!request || signingIn}
        >
          {signingIn ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#fff" />
              <Text style={styles.acceptBtnText}>Accept & Sign in with Google</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.declineText}>Decline</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
    color: '#111827',
  },
  detailBox: {
    width: '100%',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 16,
    gap: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
  },
  warningBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  errorBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    lineHeight: 18,
  },
  acceptBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 4,
  },
  acceptBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  btnDisabled: { opacity: 0.6 },
  declineText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  errorIcon: { marginBottom: 8 },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  errorMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  backBtn: {
    marginTop: 8,
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});