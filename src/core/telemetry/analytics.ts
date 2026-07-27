// Analytics event names are typed — no arbitrary strings.
export type AnalyticsEvent =
  | 'app_opened'
  | 'auth_login_started'
  | 'auth_login_succeeded'
  | 'auth_login_failed'
  | 'auth_logout'
  | 'auth_register_started'
  | 'auth_register_succeeded'
  | 'auth_register_failed'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'habit_created'
  | 'habit_deleted'
  | 'check_in_completed'
  | 'goal_created'
  | 'article_viewed'
  | 'article_saved'
  | 'search_performed'
  | 'subscription_viewed'
  | 'subscription_purchased';

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | null;
}

export interface Analytics {
  track(event: AnalyticsEvent, properties?: AnalyticsProperties): void;
  identify(userId: string): void;
  reset(): void;
  setConsent(granted: boolean): void;
}

// NoopAnalytics — used when consent is not granted or analytics is disabled.
export class NoopAnalytics implements Analytics {
  track(): void {}
  identify(): void {}
  reset(): void {}
  setConsent(): void {}
}
