/**
 * Help & guide content — structured help blocks ported from the web frontend
 * (`frontend/src/components/help/help-content.ts`).
 *
 * The content is platform-neutral product guidance (no DOM/Next.js/CSS). Icons
 * are sourced from `lucide-react-native` to preserve the web product's icon
 * language without importing DOM packages. The structured block model is
 * rendered natively by `HelpScreen` (no arbitrary HTML/WebView), per AGENTS.md.
 */
import {
  BarChart3,
  Bell,
  Brain,
  Compass,
  CreditCard,
  HandFist,
  LifeBuoy,
  Rocket,
  SlidersHorizontal,
  Sun,
  Target,
  User,
  type LucideIcon,
} from 'lucide-react-native';

export type HelpBlock =
  | { kind: 'paragraph'; text: string }
  | { kind: 'steps'; items: string[] }
  | { kind: 'list'; items: string[] }
  | {
      kind: 'callout';
      tone: 'info' | 'pro' | 'warning';
      title?: string;
      text: string;
    };

export type HelpSubsection = {
  id: string;
  title: string;
  blocks: HelpBlock[];
};

export type HelpSection = {
  id: string;
  title: string;
  icon: LucideIcon;
  intro?: string;
  subsections: HelpSubsection[];
};

export const helpSections: HelpSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    icon: Rocket,
    intro:
      'New here? This section walks you from creating an account to completing your first check-in.',
    subsections: [
      {
        id: 'create-account',
        title: 'Creating an account',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You can sign up with an email and password, or use Google to sign in instantly. Go to the Register screen, fill in your name, username, email, and password, and submit.',
          },
          {
            kind: 'steps',
            items: [
              'Open the Register screen from the login screen.',
              'Enter your full name, a username, your email, and a password.',
              'Submit the form — or tap Continue with Google to skip the form.',
              "You'll be taken to a Check your email screen.",
            ],
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'Already have an account? Use the Login screen and enter your email and password.',
          },
        ],
      },
      {
        id: 'verify-email',
        title: 'Verifying your email',
        blocks: [
          {
            kind: 'paragraph',
            text: "After registering, we send a verification link to your email. Tap the link in that message to confirm your address. If you didn't get it, use the resend verification option on the verify-email screen.",
          },
          {
            kind: 'callout',
            tone: 'warning',
            title: 'Check spam',
            text: "If the email doesn't arrive within a few minutes, check your spam or promotions folder.",
          },
        ],
      },
      {
        id: 'onboarding',
        title: 'The onboarding wizard',
        blocks: [
          {
            kind: 'paragraph',
            text: 'The first time you log in, you go through a 7-step onboarding that sets up your first goal and habits. You can change everything later.',
          },
          {
            kind: 'steps',
            items: [
              'Set your primary goal and pick a category.',
              'Describe why this goal matters to you (your motivation).',
              'Note what usually gets in the way (your blockers).',
              'Choose how many minutes per day you can commit.',
              'Pick an accountability style: Gentle, Balanced, or Direct.',
              'Set your preferred daily check-in time.',
              'Review the AI-suggested habits and keep the ones you want.',
            ],
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'The habits suggested in step 7 are generated from your goal, motivation, blockers, and available time. They are intentionally small so they fit even on low-motivation days.',
          },
        ],
      },
      {
        id: 'first-check-in',
        title: 'Your first check-in',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Once onboarding is done you land on the Today tab. Tap the circle next to any habit to mark it done for today. That is a check-in. You can also open the rich check-in sheet to add mood, energy, a blocker, and notes — see the Plan section for details.',
          },
        ],
      },
    ],
  },
  {
    id: 'today',
    title: 'Today — your dashboard',
    icon: Sun,
    intro:
      'The Today tab is your daily home base: a quick view of how today is going and what to do next.',
    subsections: [
      {
        id: 'greeting-progress',
        title: 'Greeting and progress',
        blocks: [
          {
            kind: 'paragraph',
            text: 'At the top you see a personalized greeting and a progress counter showing how many of today\u2019s habits you have checked in. The headline changes based on how complete your day is.',
          },
        ],
      },
      {
        id: 'check-in',
        title: 'Checking in habits',
        blocks: [
          {
            kind: 'list',
            items: [
              'Tap a habit\u2019s circle for a one-tap check-in.',
              'Use Check in all to mark every pending habit done at once.',
              'Completed habits are visually distinct from pending ones.',
              'Streak indicators show how many days in a row you have kept a habit.',
            ],
          },
        ],
      },
      {
        id: 'weekly-chart',
        title: 'Weekly check-in chart',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A 7-day bar chart shows your check-ins across the week, with a short This week summary that adds context about your recent consistency.',
          },
        ],
      },
      {
        id: 'goal-focus',
        title: 'Goal focus card',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Your first active goal is shown as a focus card with quick access to its details and linked habits.',
          },
        ],
      },
      {
        id: 'coach-nudges',
        title: 'Coach nudges',
        blocks: [
          {
            kind: 'paragraph',
            text: 'When the AI coach notices a pattern that could be improved, it shows a nudge card with a suggested plan adjustment. Use Move it to accept or Not now to dismiss.',
          },
          {
            kind: 'callout',
            tone: 'pro',
            title: 'Pro feature',
            text: 'Plan adjustment suggestions are limited on the Free plan. Upgrade to Pro for advanced, ongoing plan adjustments.',
          },
        ],
      },
      {
        id: 'worth-reading',
        title: 'Worth reading tonight',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A small selection of articles is surfaced for evening reading. Tap a card to open the article, like it, or save it to your Library.',
          },
        ],
      },
    ],
  },
  {
    id: 'plan',
    title: 'Plan — habits & goals',
    icon: Target,
    intro:
      'The Plan tab is where you build and maintain your habits and goals, link them together, and use templates to get started fast.',
    subsections: [
      {
        id: 'create-habit',
        title: 'Creating a habit',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open the Plan tab and tap the add button.',
              'Choose Habit.',
              'Enter a name, an optional description, and a category.',
              'Save. The habit appears in today\u2019s list and on the Today tab.',
            ],
          },
        ],
      },
      {
        id: 'rich-check-in',
        title: 'The rich check-in sheet',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A quick tap checks a habit in, but you can open the detailed sheet to capture more context. This data feeds your weekly review and the AI coach.',
          },
          {
            kind: 'list',
            items: [
              'Mood: Great, Okay, Low, or Stressed.',
              'Energy: High, Medium, or Low.',
              'Blocker: Lack of time, Low motivation, Too distracted, Unclear plan, or Other.',
              'Notes: free-text about how the day went.',
            ],
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'You can edit today\u2019s check-in later in the day, and add retroactive check-ins from the Progress screen.',
          },
        ],
      },
      {
        id: 'manage-habits',
        title: 'Editing, archiving, and deleting habits',
        blocks: [
          {
            kind: 'list',
            items: [
              'Edit a habit to change its name, description, or category.',
              'Delete a habit with confirmation when you no longer want it.',
              'Sort habits by streak or name, and filter by category or status.',
              'Use Reset today to clear today\u2019s completion status and start fresh.',
            ],
          },
        ],
      },
      {
        id: 'create-goal',
        title: 'Creating a goal',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open the Plan tab and tap the add button.',
              'Choose Goal.',
              'Enter a title, description, category, and optional due date.',
              'Pick a measurement type (see below).',
              'Save.',
            ],
          },
        ],
      },
      {
        id: 'goal-measurement',
        title: 'Goal measurement types',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Goals can be tracked in the way that fits them best:',
          },
          {
            kind: 'list',
            items: [
              'Manual — slide the progress percentage yourself.',
              'Binary — simply done or not done.',
              'Numeric — log values toward a target with units (e.g. kg, miles, pages).',
              'Milestones — break the goal into steps; drag to reorder them.',
              'Habit-based — progress is derived from the check-ins of linked habits.',
            ],
          },
        ],
      },
      {
        id: 'link-habits-goals',
        title: 'Linking habits to goals',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A goal can group related habits so they contribute to its progress. Linked habits appear nested under the goal card on the Plan tab. Habits not linked to any goal appear in a separate Untied habits section.',
          },
        ],
      },
      {
        id: 'analyze-with-coach',
        title: 'Analyze a goal with the coach',
        blocks: [
          {
            kind: 'paragraph',
            text: 'From a goal, choose Analyze with Coach to start a coaching conversation pre-loaded with that goal\u2019s context. The coach can suggest next steps or propose changes to the goal and its habits.',
          },
        ],
      },
      {
        id: 'templates',
        title: 'Templates',
        blocks: [
          {
            kind: 'paragraph',
            text: 'In the Library, the Templates segment offers pre-built habit and goal templates. Tap one to pre-fill the create form, then adjust and save.',
          },
        ],
      },
      {
        id: 'free-limits',
        title: 'Free plan limits',
        blocks: [
          {
            kind: 'callout',
            tone: 'warning',
            title: 'Limits on Free',
            text: 'The Free plan allows up to 3 active goals and 5 active habits. When you reach a limit, you will see an upgrade prompt. Archive or delete an item to make room, or upgrade to Pro for unlimited goals and habits.',
          },
        ],
      },
    ],
  },
  {
    id: 'progress',
    title: 'Progress — weekly review',
    icon: BarChart3,
    intro:
      'The Progress screen turns your week into an AI-generated review: metrics, a coach\u2019s analysis, per-habit breakdown, and a plan for next week.',
    subsections: [
      {
        id: 'week-metrics',
        title: 'Current week metrics',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Four metric cards summarize the week:',
          },
          {
            kind: 'list',
            items: [
              'Consistency — the percentage of expected check-ins you completed.',
              'Check-ins — completed vs. total for the week.',
              'Most completed habit — the habit you kept most consistently.',
              'Mood average — your average mood on a 1\u20135 scale.',
            ],
          },
        ],
      },
      {
        id: 'coach-analysis',
        title: 'Coach analysis and per-habit breakdown',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Below the metrics, the coach writes a short analysis of your week: patterns it noticed, what helped, and what got in the way. A per-habit table shows each habit\u2019s completion rate and last check-in.',
          },
        ],
      },
      {
        id: 'suggested-adjustments',
        title: 'Suggested plan adjustments',
        blocks: [
          {
            kind: 'paragraph',
            text: 'For each habit the review may suggest one of the following adjustments, with a reason:',
          },
          {
            kind: 'list',
            items: [
              'Reduce difficulty — scale back volume or complexity.',
              'Change time — align the habit to a better time of day.',
              'Clarify plan — redefine the trigger or context.',
              'Pause habit — temporarily pause it.',
              'Keep same — maintain the current approach.',
            ],
          },
          {
            kind: 'paragraph',
            text: 'You can accept or reject each suggestion. Accepted suggestions can be applied to update your goals and habits automatically.',
          },
        ],
      },
      {
        id: 'next-week-plan',
        title: 'Next week\u2019s plan',
        blocks: [
          {
            kind: 'paragraph',
            text: 'The review closes with a forward-looking plan: a focus theme, commitments, risks to watch, and recovery actions if things slip.',
          },
        ],
      },
      {
        id: 'generate-review',
        title: 'Generating and regenerating a review',
        blocks: [
          {
            kind: 'paragraph',
            text: 'If no review exists for the current week, you can generate one. The response streams in as it is produced. You can regenerate to get a fresh take.',
          },
        ],
      },
      {
        id: 'history',
        title: 'Historical reviews',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Use week navigation to move between older and newer reviews and compare with the previous week.',
          },
          {
            kind: 'callout',
            tone: 'pro',
            title: 'Pro feature',
            text: 'Full weekly review history is available on Pro. Free users can see the current week\u2019s review.',
          },
        ],
      },
      {
        id: 'activity-feed',
        title: 'Activity feed',
        blocks: [
          {
            kind: 'paragraph',
            text: 'A recent activity list shows your latest check-ins, goal updates, and other actions, cross-referenced with the review data.',
          },
        ],
      },
    ],
  },
  {
    id: 'ai-coach',
    title: 'AI Coach',
    icon: HandFist,
    intro:
      'The Coach is your AI accountability partner. It remembers your patterns, references your goals and check-ins, and can take actions on your plan when you approve them.',
    subsections: [
      {
        id: 'start-conversation',
        title: 'Starting a text conversation',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Open the Coach tab to start a new conversation. You can also continue an existing one from the conversation list. The coach uses your goals, habits, recent check-ins, weekly reviews, and long-term memory as context — but only pulls what is relevant to your message.',
          },
        ],
      },
      {
        id: 'streaming',
        title: 'Streaming responses, stop and retry',
        blocks: [
          {
            kind: 'list',
            items: [
              'Responses stream in token by token so you see progress immediately.',
              'Tap Stop to cancel generation mid-stream.',
              'If a message fails, use Retry to send it again.',
            ],
          },
        ],
      },
      {
        id: 'proposals',
        title: 'Agentic proposals',
        blocks: [
          {
            kind: 'paragraph',
            text: 'The coach can propose changes to your plan — creating, updating, or deleting a goal or habit. When it does, a confirm/cancel card appears in the conversation. Nothing changes until you confirm.',
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'Proposals are suggestions. You stay in control: confirm to apply, or cancel to dismiss.',
          },
        ],
      },
      {
        id: 'conversation-management',
        title: 'Managing conversations',
        blocks: [
          {
            kind: 'list',
            items: [
              'Search conversations by title or message content.',
              'Archive conversations you want to keep but not see in the active list.',
              'Unarchive to bring a conversation back.',
              'Delete conversations you no longer need.',
            ],
          },
        ],
      },
      {
        id: 'goal-analysis',
        title: 'Goal analysis via the coach',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Starting a conversation from a goal (Analyze with Coach) pre-loads that goal\u2019s context so the coach can give specific, actionable next steps.',
          },
        ],
      },
      {
        id: 'voice-mode',
        title: 'Voice mode',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Voice mode is a full-screen, turn-based conversation: you record a short voice message, we transcribe it, the coach responds in streaming text, and the response is read aloud with text-to-speech.',
          },
          {
            kind: 'steps',
            items: [
              'Open the Coach tab and choose voice mode.',
              'Allow microphone access when prompted.',
              'Tap to record, then tap again to stop.',
              'Read the live transcript and the streaming coach response.',
              'Listen to the spoken response, then take your next turn.',
            ],
          },
          {
            kind: 'callout',
            tone: 'pro',
            title: 'Pro feature',
            text: 'Voice mode is available on Pro.',
          },
          {
            kind: 'callout',
            tone: 'warning',
            title: 'Microphone permission',
            text: 'If voice mode cannot access your microphone, check your device permissions for this app.',
          },
        ],
      },
    ],
  },
  {
    id: 'coach-memory',
    title: 'Coach memory',
    icon: Brain,
    intro:
      'The coach remembers durable facts about you so it does not ask the same things twice. You can see, add, and forget these facts anytime.',
    subsections: [
      {
        id: 'how-memory-works',
        title: 'How memory works',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Memory facts come from two sources: the coach extracts durable facts from your conversations automatically, and you can add facts yourself. Facts are conservative — passing emotions and one-off states are not stored.',
          },
        ],
      },
      {
        id: 'memory-categories',
        title: 'Memory categories',
        blocks: [
          {
            kind: 'list',
            items: [
              'Commitment — things you said you will do (e.g. "training Tue/Thu", "no phone after 10pm").',
              'Preference — how you want to be coached (e.g. "wants gentle accountability").',
              'Constraint — durable limits (e.g. "works night shifts", "recovering from knee surgery").',
              'Context — stable background (e.g. "software engineer", "two young children").',
            ],
          },
        ],
      },
      {
        id: 'add-fact',
        title: 'Adding a fact',
        blocks: [
          {
            kind: 'paragraph',
            text: 'On the Me tab, open the Memory section and add a fact with a category. User-added facts are treated as authoritative and can correct or supersede facts the coach extracted earlier.',
          },
        ],
      },
      {
        id: 'forget-facts',
        title: 'Forgetting facts',
        blocks: [
          {
            kind: 'list',
            items: [
              'Forget an individual fact to remove just that one.',
              'Forget all facts (with confirmation) to clear your coach memory entirely.',
            ],
          },
          {
            kind: 'callout',
            tone: 'info',
            text: 'Each fact has a confidence score. Low-confidence facts are hedged in coaching responses. Adding your own fact raises confidence.',
          },
        ],
      },
    ],
  },
  {
    id: 'personalizing-coach',
    title: 'Personalizing your coach',
    icon: SlidersHorizontal,
    intro:
      'Tune how the coach talks to you and how hard it pushes. These settings shape check-in feedback, weekly reviews, and coaching conversations.',
    subsections: [
      {
        id: 'accountability-style',
        title: 'Accountability style',
        blocks: [
          {
            kind: 'list',
            items: [
              'Gentle — warm and encouraging, avoids pressure. "That\u2019s okay. Let\u2019s make tomorrow easier."',
              'Balanced — constructive feedback, celebrates wins, addresses challenges. "You missed today, but the goal still matters."',
              'Direct — no-nonsense, high standards. "You committed to this. What blocked it?"',
            ],
          },
        ],
      },
      {
        id: 'preferred-tone',
        title: 'Preferred tone',
        blocks: [
          {
            kind: 'list',
            items: [
              'Supportive — warm, empathetic, builds confidence.',
              'Direct — straightforward, concise, action-oriented.',
              'Warm — friendly, approachable, conversational.',
              'Practical — pragmatic, solution-focused.',
              'Challenging — motivates by pushing for growth.',
            ],
          },
        ],
      },
      {
        id: 'difficulty',
        title: 'Difficulty preference',
        blocks: [
          {
            kind: 'list',
            items: [
              'Easy — small, safe steps that build momentum.',
              'Adaptive — adjusts to your pace (easier when struggling, harder when excelling).',
              'Ambitious — stretch goals that push for growth.',
            ],
          },
        ],
      },
      {
        id: 'coaching-notes',
        title: 'Coaching notes',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Add free-form notes for the coach — anything you want it to keep in mind across conversations. These complement the structured memory facts.',
          },
        ],
      },
      {
        id: 'where-it-applies',
        title: 'Where these apply',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Your coaching profile shapes three things: the feedback you get after each check-in, the tone of your weekly review, and the style of your coaching conversations. Change a setting and you will notice the difference in the next response.',
          },
        ],
      },
    ],
  },
  {
    id: 'library',
    title: 'Library',
    icon: Compass,
    intro:
      'The Library is your content hub: articles to read, things you have saved, and templates to start from.',
    subsections: [
      {
        id: 'explore',
        title: 'Explore segment',
        blocks: [
          {
            kind: 'list',
            items: [
              'Browse curated articles, with a featured article highlighted at the top.',
              'Filter by category.',
              'Like an article to show appreciation.',
              'Save an article to read later.',
              'See reading time and author attribution.',
            ],
          },
        ],
      },
      {
        id: 'saved',
        title: 'Saved segment',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Everything you have saved lives here: articles, habits, and goals. Remove an item from saved with one tap.',
          },
        ],
      },
      {
        id: 'templates-segment',
        title: 'Templates segment',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Habit and goal templates give you a fast start. Tap a template to pre-fill the create form, then adjust and save.',
          },
        ],
      },
      {
        id: 'search',
        title: 'Search',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Search across articles, habits, goals, and conversations from the Library. Results are relevance-ranked with highlighted snippets.',
          },
        ],
      },
      {
        id: 'article-reader',
        title: 'Article reader',
        blocks: [
          {
            kind: 'list',
            items: [
              'A reading progress bar tracks how far through the article you are.',
              'Adjust the reading size to small, medium, or large.',
              'Share an article via your device\u2019s share sheet.',
              'Use Make this a habit to pre-fill the habit create form from the article.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'profile-settings',
    title: 'Profile & settings',
    icon: User,
    intro: 'Manage your account, reminders, notifications, appearance, and data from the Me tab.',
    subsections: [
      {
        id: 'edit-profile',
        title: 'Editing your profile',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Update your avatar, display name, bio, location, website, and interests. Your username is read-only after registration.',
          },
        ],
      },
      {
        id: 'reminders',
        title: 'Reminders',
        blocks: [
          {
            kind: 'list',
            items: [
              'Set your daily nudge time — when you want a reminder to check in.',
              'Toggle habit reminders, goal reminders, streak warnings, and Sunday review reminders on or off.',
              'Set your timezone (IANA) so reminders fire at the right local time.',
            ],
          },
        ],
      },
      {
        id: 'notifications-settings',
        title: 'Notifications',
        blocks: [
          {
            kind: 'list',
            items: [
              'In-app notifications are always on.',
              'Toggle email notifications on or off.',
              'Toggle mobile push notifications on or off.',
            ],
          },
        ],
      },
      {
        id: 'appearance',
        title: 'Appearance',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Choose Light, Dark, or System theme. System follows your operating system setting.',
          },
        ],
      },
      {
        id: 'data-privacy',
        title: 'Data & privacy',
        blocks: [
          {
            kind: 'list',
            items: [
              'Export all your data as a JSON download — includes habits, goals, check-ins, and profile.',
              'Delete your account permanently. This is irreversible and removes all your data.',
            ],
          },
          {
            kind: 'callout',
            tone: 'warning',
            title: 'Account deletion is permanent',
            text: 'Deleting your account cannot be undone. Export your data first if you want a copy.',
          },
        ],
      },
    ],
  },
  {
    id: 'plans-billing',
    title: 'Plans & billing',
    icon: CreditCard,
    intro:
      'Growth has a Free plan and a Pro plan. Here is what each includes and how to upgrade or manage your subscription.',
    subsections: [
      {
        id: 'free-vs-pro',
        title: 'Free vs Pro',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Free plan includes:',
          },
          {
            kind: 'list',
            items: [
              'Up to 3 active goals.',
              'Up to 5 active habits.',
              'Daily check-ins.',
              'Basic AI feedback.',
              'Current weekly review.',
            ],
          },
          {
            kind: 'paragraph',
            text: 'Pro plan adds:',
          },
          {
            kind: 'list',
            items: [
              'Unlimited goals and habits.',
              'Full weekly review history.',
              'Personalized AI coaching.',
              'Advanced plan adjustments.',
              'Accountability style controls.',
              'Priority reminders.',
              'Voice mode.',
            ],
          },
        ],
      },
      {
        id: 'upgrade-triggers',
        title: 'Upgrade triggers',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You will see an upgrade prompt when you:',
          },
          {
            kind: 'list',
            items: [
              'Reach the goal or habit limit on Free.',
              'Try to view historical weekly reviews.',
              'Use personalized AI features.',
              'Hit the plan adjustment suggestion limit.',
              'Open voice mode.',
            ],
          },
        ],
      },
      {
        id: 'upgrade',
        title: 'Upgrading',
        blocks: [
          {
            kind: 'paragraph',
            text: 'On mobile, upgrading goes through your device\u2019s store (App Store or Google Play). Choose monthly or annual billing, complete the purchase, and your entitlements update automatically after reconciliation.',
          },
        ],
      },
      {
        id: 'manage-subscription',
        title: 'Managing your subscription',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Manage your subscription from your device\u2019s store settings to change plans, update payment methods, or cancel. Changes sync back to your account.',
          },
        ],
      },
      {
        id: 'restore-purchases',
        title: 'Restoring purchases',
        blocks: [
          {
            kind: 'paragraph',
            text: 'If you subscribed on mobile, use Restore purchases in the paywall to re-link your subscription to this account.',
          },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: Bell,
    intro: 'Stay on track with reminders and updates. Control what you get and where it goes.',
    subsections: [
      {
        id: 'notification-types',
        title: 'Notification types',
        blocks: [
          {
            kind: 'list',
            items: [
              'Habit reminder — a nudge to check in.',
              'Goal deadline — a goal\u2019s due date is approaching.',
              'Achievement — you hit a milestone or streak.',
              'Missed check-in — you missed a check-in.',
              'Weekly review — your review is ready.',
              'Encouragement — a supportive note from the coach.',
              'AI feedback — the coach has feedback on a check-in.',
              'Streak warning — your streak is at risk.',
              'System — account or platform updates.',
            ],
          },
        ],
      },
      {
        id: 'delivery-channels',
        title: 'Delivery channels and preferences',
        blocks: [
          {
            kind: 'paragraph',
            text: 'Notifications can be delivered in-app, by email, and by mobile push. Toggle each channel and each reminder type on the Me tab. Push notifications require the mobile app and a registered device.',
          },
        ],
      },
      {
        id: 'notifications-screen',
        title: 'The notifications screen',
        blocks: [
          {
            kind: 'list',
            items: [
              'Open the notifications screen from the bell icon.',
              'An unread badge shows how many notifications are new.',
              'Mark individual notifications as read, or mark all as read at once.',
              'Tap a notification to jump to its destination.',
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'reporting-support',
    title: 'Reporting & support',
    icon: LifeBuoy,
    intro: 'Found a bug or have feedback? Let us know.',
    subsections: [
      {
        id: 'report',
        title: 'Reporting a problem',
        blocks: [
          {
            kind: 'steps',
            items: [
              'Open Report a problem from the Me tab\u2019s Support section.',
              'Choose a category: Bug, Feedback, or Abuse.',
              'Add a short subject and the details of what happened.',
              'Optionally include an email if you want a reply.',
              'Submit.',
            ],
          },
        ],
      },
      {
        id: 'after-submit',
        title: 'After you submit',
        blocks: [
          {
            kind: 'paragraph',
            text: 'You see a confirmation screen. We review reports as soon as we can. If you included an email, we may follow up.',
          },
        ],
      },
    ],
  },
];
