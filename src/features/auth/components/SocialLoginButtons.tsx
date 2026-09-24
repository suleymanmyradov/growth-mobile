/**
 * SocialLoginButtons — Google and Apple sign-in buttons.
 *
 * Per AGENTS.md:
 * - OAuth uses `expo-auth-session` and `expo-web-browser` (Google) and
 *   `expo-apple-authentication` (Apple). Never embed an OAuth client secret.
 * - Apple Sign-In is required before an iOS release if another social login
 *   is offered; it is only available on iOS.
 * - Google native sign-in exchanges the PKCE code client-side (native OAuth
 *   clients are public) and sends the resulting id_token to the backend,
 *   which verifies it by signature and audience.
 *
 * Both buttons render nothing when the respective OAuth config is missing, so
 * auth screens degrade gracefully in local dev without OAuth set up.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { exchangeCodeAsync } from 'expo-auth-session';
import { maybeCompleteAuthSession } from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { ApiError } from '@/core/api/errors';
import { getEnv } from '@/core/config/env';
import { Button, ThemedText } from '@/design-system';
import { useTheme } from '@/design-system/theme';

import { useAppleLogin, useGoogleLogin } from '../hooks';

// Required for expo-auth-session to complete the redirect flow on native.
maybeCompleteAuthSession();

type SocialLoginButtonsProps = {
  /** Called when a social login fails with a user-facing error message. */
  onError?: (message: string) => void;
};

/**
 * Google login button. Extracted into its own component so the
 * `Google.useAuthRequest` hook is only called when Google OAuth is configured
 * — the hook throws if `iosClientId` is undefined on iOS.
 */
function GoogleLoginButton({
  onError,
  busy,
  setBusy,
}: {
  onError?: (message: string) => void;
  busy: 'google' | 'apple' | null;
  setBusy: (b: 'google' | 'apple' | null) => void;
}) {
  const { t } = useTranslation();
  const env = getEnv();
  const googleLogin = useGoogleLogin();

  const googleClientId =
    Platform.OS === 'ios'
      ? env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : Platform.OS === 'android'
        ? env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        : env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleClientId || undefined,
    iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
    androidClientId: env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || undefined,
    webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
    // We exchange the code ourselves below so failures surface to the user —
    // the provider's auto-exchange swallows errors and leaves the response
    // stuck with an unexchanged code.
    shouldAutoExchangeCode: false,
  });

  // Guard against the effect re-running for the same code (codes are
  // single-use — a second exchange would fail with invalid_grant).
  const exchangedCodeRef = useRef<string | null>(null);

  // Handle the Google auth response: exchange the PKCE code client-side
  // (native OAuth clients are public — no secret needed), then send the
  // resulting id_token to the backend, which verifies it by signature.
  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      const code = response.params.code;
      const codeVerifier = request?.codeVerifier;
      const redirectUri = request?.redirectUri;
      if (exchangedCodeRef.current === code) return;
      exchangedCodeRef.current = code;

      if (!googleClientId || !codeVerifier || !redirectUri) {
        setBusy(null);
        onError?.(t('auth.errors.googleFailed'));
        return;
      }

      setBusy('google');
      const fail = (err?: unknown) => {
        setBusy(null);
        const msg = err instanceof ApiError ? err.message : t('auth.errors.googleFailed');
        onError?.(msg);
      };
      exchangeCodeAsync(
        {
          clientId: googleClientId,
          redirectUri,
          code,
          extraParams: { code_verifier: codeVerifier },
        },
        Google.discovery,
      )
        .then((tokenResponse) => {
          const idToken = tokenResponse.idToken;
          if (!idToken) {
            fail();
            return;
          }
          googleLogin.mutate({ idToken }, { onSuccess: () => setBusy(null), onError: fail });
        })
        .catch(() => fail());
    } else if (response?.type === 'error') {
      setBusy(null);
      onError?.(t('auth.errors.googleFailed'));
    } else if (response?.type === 'dismiss') {
      setBusy(null);
    }
  }, [response, request, googleClientId, googleLogin, onError, t, setBusy]);

  const handleGoogleLogin = async () => {
    if (!googleClientId || !request) {
      Alert.alert(t('auth.errors.googleNotConfigured'));
      return;
    }
    setBusy('google');
    try {
      await promptAsync();
    } catch {
      setBusy(null);
      onError?.(t('auth.errors.googleFailed'));
    }
  };

  return (
    <Button
      variant="outline"
      fullWidth
      loading={busy === 'google'}
      disabled={busy !== null}
      onPress={handleGoogleLogin}
      accessibilityLabel={t('auth.continueWithGoogle')}
    >
      {t('auth.continueWithGoogle')}
    </Button>
  );
}

export function SocialLoginButtons({ onError }: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const env = getEnv();
  const appleLogin = useAppleLogin();
  const [busy, setBusy] = useState<'google' | 'apple' | null>(null);

  const googleClientId =
    Platform.OS === 'ios'
      ? env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
      : Platform.OS === 'android'
        ? env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID
        : env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const showGoogle = Boolean(googleClientId);
  const showApple = Platform.OS === 'ios';
  if (!showGoogle && !showApple) return null;

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') return;
    setBusy('apple');
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // The identity token is the primary credential; the authorization code
      // is optional but sent when available. fullName is only provided on the
      // first sign-in.
      if (!credential.identityToken) {
        throw new Error('No identity token returned from Apple Sign-In');
      }
      await appleLogin.mutateAsync({
        identityToken: credential.identityToken,
        authorizationCode: credential.authorizationCode ?? undefined,
        fullName:
          credential.fullName && (credential.fullName.givenName || credential.fullName.familyName)
            ? {
                givenName: credential.fullName.givenName ?? undefined,
                familyName: credential.fullName.familyName ?? undefined,
              }
            : undefined,
      });
      setBusy(null);
    } catch (err) {
      setBusy(null);
      // Cancellation is not an error — the user dismissed the native sheet.
      if (
        err instanceof Error &&
        'code' in err &&
        (err as { code: string }).code === 'ERR_REQUEST_CANCELED'
      )
        return;
      const msg = err instanceof ApiError ? err.message : t('auth.errors.appleFailed');
      onError?.(msg);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <ThemedText variant="caption" style={{ color: colors.mutedForeground }}>
          {t('auth.orContinueWith')}
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      {showGoogle ? (
        <GoogleLoginButton onError={onError} busy={busy} setBusy={setBusy} />
      ) : null}

      {showApple ? (
        <Button
          variant="outline"
          fullWidth
          loading={busy === 'apple'}
          disabled={busy !== null}
          onPress={handleAppleLogin}
          accessibilityLabel={t('auth.continueWithApple')}
        >
          {t('auth.continueWithApple')}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  dividerLine: { flex: 1, height: 1 },
});
