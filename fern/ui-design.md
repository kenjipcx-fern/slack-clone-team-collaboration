# UI Design - Component System & Visual Design

## Design Philosophy

**Modern, Clean, Performance-First**
- Inspired by shadcn/ui's thoughtful component architecture
- Vercel's attention to micro-interactions and smooth animations  
- Discord's playful but professional emoji and reaction system
- Minimalist aesthetic that doesn't overwhelm users

### Core Design Principles
1. **Clarity over Cleverness**: Every UI element should have obvious purpose
2. **Speed over Polish**: Fast interactions beat beautiful animations
3. **Context over Chrome**: Information density without visual noise
4. **Consistency over Creativity**: Predictable patterns across all views

## Design System Foundation

### Color Palette
```
Primary Colors (Brand):
- Primary Blue:     #0066CC  (links, buttons, active states)
- Primary Dark:     #004499  (hover states, emphasis)
- Success Green:    #00AA44  (online status, success states)
- Warning Orange:   #FF8800  (notifications, warnings)
- Error Red:        #DD3333  (errors, destructive actions)

Neutral Palette (Interface):
- Gray 50:  #F8FAFC  (backgrounds, subtle borders)
- Gray 100: #F1F5F9  (hover backgrounds)
- Gray 200: #E2E8F0  (borders, dividers)
- Gray 300: #CBD5E1  (disabled text)
- Gray 400: #94A3B8  (placeholder text)
- Gray 500: #64748B  (secondary text)
- Gray 600: #475569  (primary text)
- Gray 700: #334155  (headings)
- Gray 800: #1E293B  (dark mode background)
- Gray 900: #0F172A  (darkest text)

Special Colors:
- Huddle Purple: #8B5CF6  (voice/video calls)
- Thread Blue:   #3B82F6  (threading system)
- Emoji Gold:    #FBB040  (emoji reactions)
```

### Typography Scale
```
Font Family: Inter (primary), SF Pro Display (Apple), system-ui

Sizes:
- xs:  12px  (timestamps, metadata)
- sm:  14px  (secondary text, captions)
- base: 16px (body text, messages)
- lg:  18px  (subheadings)
- xl:  20px  (page titles)
- 2xl: 24px  (section headers)
- 3xl: 30px  (main headings)

Weights:
- light:   300  (large display text)
- normal:  400  (body text)  
- medium:  500  (emphasis, labels)
- semibold: 600 (headings, buttons)
- bold:    700  (important headings)
```

### Spacing System (Tailwind-inspired)
```
- 0.5: 2px   (fine borders)
- 1:   4px   (tight spacing)
- 2:   8px   (small padding)
- 3:   12px  (medium padding)
- 4:   16px  (standard padding)
- 5:   20px  (large padding)
- 6:   24px  (section spacing)
- 8:   32px  (component spacing)
- 12:  48px  (page margins)
- 16:  64px  (large sections)
```

## Component Library

### 1. Message Component
```
┌─────────────────────────────────────────────────────────────────────┐
│ [👤] Mike Chen                                     2:14 PM    [⋯]    │
│      Senior Developer                                                │
│                                                                      │
│      Hey team! 👋 The new designs are ready for review.             │
│      I've uploaded the latest version with the feedback             │
│      incorporated from yesterday's huddle.                          │
│                                                                      │
│      📎 design-system-v2.fig                                        │
│      ┌─────────────────────────────────┐                           │
│      │ [📄] design-system-v2.fig       │                           │
│      │ 2.4 MB • Figma File             │                           │
│      │ Updated 5 minutes ago            │                           │
│      └─────────────────────────────────┘                           │
│                                                                      │
│      [👍 3] [🎨 2] [👀 1] [💬 Reply] [🧵 3 replies]               │
└─────────────────────────────────────────────────────────────────────┘

Variations:
- Compact mode (for busy channels)
- Thread reply (indented with connector line)
- System message (centered, muted styling)
- File-only message (larger file preview)
- Code block message (syntax highlighted)
```

**Component Props:**
- `user`: User object with avatar, name, role
- `timestamp`: Message timestamp
- `content`: Rich text message content
- `attachments`: File attachments array
- `reactions`: Reaction counts and types
- `threadCount`: Number of thread replies
- `isThreadReply`: Boolean for thread styling
- `isSystem`: Boolean for system message styling

### 2. Sidebar Navigation Component
```
┌──────────────────────────┐
│ 🏠 TeamApp                │
│ ──────────────────────   │
│                          │
│ 🔍 [Search everything...] │
│                          │
│ 📬 UNREADS               │
│ # general           (12) │ ← Active channel highlight
│ # dev-team          (3)  │
│ 💬 Mike Chen        •    │ ← Online indicator  
│                          │
│ 📢 CHANNELS              │
│ # general                │
│ # random                 │
│ # dev-team               │
│ # design                 │
│ # announcements          │
│ [+ Add channel]          │
│                          │
│ 💬 DIRECT MESSAGES       │
│ 👤 Sarah Johnson    •    │
│ 👤 Emma Wilson     🌙    │ ← Away status
│ 👤 Alex Thompson         │
│ [+ New message]          │
│                          │
│ 🎵 HUDDLES               │
│ 🔊 Design Review    •    │ ← Active huddle
│ [+ Start huddle]         │
│                          │
│ ── Settings ──           │
│ ⚙️  Preferences          │
│ 👤 Profile              │
│ 🚪 Sign out             │
└──────────────────────────┘
```

**Interactive States:**
- Hover: Subtle background highlight
- Active: Strong background + border accent
- Unread: Bold text + unread count badge
- Online status: Green dot, away = yellow crescent

### 3. Emoji Reaction Picker
```
┌─────────────────────────────────────────────────────────────────┐
│ 😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺️😚😙 │
│ 😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬🤥  │
│ 😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠😎🤓  │
│                                                                 │
│ ────────────── CUSTOM EMOJIS ──────────────                    │
│ :party-parrot: :this-is-fine: :shipit: :mindblown: :rocket:    │
│ :team-win: :coffee: :pizza: :thumbs-up-fast: :facepalm:        │
│                                                                 │
│ ────────────── RECENT ──────────────                           │
│ 👍 🎉 😄 🚀 ❤️ 👀 🔥 💯                                      │
│                                                                 │
│ 🔍 [Search emojis...]                              [+ Add Emoji] │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Category tabs (Recent, Smileys, Objects, etc.)
- Custom emoji upload and management
- Emoji search with keywords
- Skin tone variations for relevant emojis
- Recently used tracking

### 4. Huddle Interface Component
```
┌─────────────────────────────────────────────────────────────────┐
│ 🎵 Design Review Huddle                 👥 3 participants       │
│ ─────────────────────────────────────────────────────────────── │
│                                                                 │
│          👤 Sarah                  👤 Mike                      │
│         🎤 Speaking               🔇 Muted                      │
│       Quality: ●●●●○             Quality: ●●●●●                │
│                                                                 │
│                     👤 Emma                                     │
│                   🎤 ○○○○○                                     │
│                 Quality: ●●○○○                                 │
│                                                                 │
│ ──────────────── Screen Share ─────────────────                │
│ 📺 Mike is sharing: Figma - Design System                      │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                                                             │ │
│ │              [Screen Content Preview]                       │ │
│ │                                                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│ ──────────────── Controls ─────────────────                   │
│ [🎤 Mute] [📷 Video] [📺 Share] [💬 Chat] [⚙️] [📞 Leave]      │
│                                                                 │
│ 💬 Huddle Chat                                   [↗️ Pop out]   │
│ Sarah: Can you zoom in on the navigation?                      │
│ Mike: Sure! Let me highlight that section                      │
│ [Type a message...]                                            │
└─────────────────────────────────────────────────────────────────┘
```

**States & Controls:**
- Muted/unmuted microphone with visual feedback
- Video on/off with camera preview
- Screen share with application picker
- Audio quality indicators
- Participant management (mute others, etc.)

### 5. Channel Header Component
```
┌─────────────────────────────────────────────────────────────────┐
│ # general                                                  [⋯]  │
│ 👥 12 members • General team discussions and announcements      │
│                                                                 │
│ [📌 Pinned] [👥 Members] [🔍 Search] [🔔 Notifications] [⭐]     │
│ ─────────────────────────────────────────────────────────────── │
└─────────────────────────────────────────────────────────────────┘
```

**Interactive Elements:**
- Channel name: Click to edit (if permissions)
- Description: Expandable on hover/click
- Member count: Click to view member list
- Action buttons: Hover tooltips with shortcuts

### 6. Message Input Component
```
┌─────────────────────────────────────────────────────────────────┐
│ [Bold] [Italic] [Code] [Link] [List] │ [📎] [🎤] [😀] [📅]      │
│ ─────────────────────────────────────┼─────────────────────────│
│                                      │                         │
│ Type your message here...            │                         │
│                                      │                         │
│                                      │                         │
│ ─────────────────────────────────────┼─────────────────────────│
│ [Shift + Enter for new line]         │            [Send] [📤] │
└─────────────────────────────────────────────────────────────────┘

Rich Text Features:
- **Bold text** with Cmd+B
- *Italic text* with Cmd+I  
- `Code blocks` with Cmd+Shift+C
- > Quote blocks
- 1. Numbered lists
- • Bullet lists
- [Links](url) with auto-detection
- @mentions with autocomplete
- #channel references with autocomplete

File Upload States:
┌─────────────────────────────────────┐
│ 📎 Uploading design-file.png...     │
│ ████████████████░░░░ 75%            │
│                              [×]    │
└─────────────────────────────────────┘
```

### 7. Thread Panel Component
```
┌─────────────────────────────────────┐
│ ← Back to #general      🧵 Thread   │
│ ─────────────────────────────────── │
│                                     │
│ ┌─ Original Message ───────────────┐ │
│ │ Mike Chen  2:14 PM               │ │
│ │ Hey team! New designs ready...   │ │
│ │ 📎 design-v2.fig                 │ │
│ │ [👍 2] [🎨 1]                    │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Thread Reply ───────────────────┐ │
│ │ 👤 Emma  2:15 PM                 │ │
│ │ │ Love the new color scheme!      │ │
│ │ │ [👍 1]                         │ │
│ └───────────────────────────────────┘ │
│                                     │
│ ┌─ Thread Reply ───────────────────┐ │
│ │ 👤 Sarah  2:18 PM                │ │
│ │ │ Agreed! Let's discuss in huddle │ │
│ │ │ [🎵 Join Huddle]               │ │
│ └───────────────────────────────────┘ │
│                                     │
│ [💬 Reply to thread...]             │
│ ─────────────────────────────────── │
│ 🔔 You'll be notified of new replies│
└─────────────────────────────────────┘
```

### 8. Mobile Responsive Components

#### Mobile Message List
```
┌─────────────────┐
│ [☰] #general [🔔]│
├─────────────────┤
│ Mike C.    2:14 │
│ Hey team! New   │
│ designs are...  │
│ 📎 design-v2.fig │
│ [💬3] [👍2] [⋯] │
├─────────────────┤
│ Sarah J.   2:18 │
│ Thanks! Start.. │
│ [🎵 Join Huddle] │
├─────────────────┤
│ [Type message...] │
│ [😀][📎][🎤][➤] │
└─────────────────┘
```

#### Mobile Sidebar (Slide-out)
```
┌─────────────────┐
│ 🏠 TeamApp  [×] │
├─────────────────┤
│ 🔍 Search...    │
│                 │
│ 📬 UNREADS      │
│ # general  (12) │
│ # dev-team (3)  │
│                 │
│ 📢 CHANNELS     │
│ # general       │
│ # random        │
│ # design        │
│                 │
│ 💬 MESSAGES     │
│ Mike Chen   •   │
│ Emma Wilson 🌙  │
│                 │
│ 🎵 HUDDLES      │
│ Design Review • │
└─────────────────┘
```

## Animation & Micro-interactions

### Message Animations
```css
/* Message Send Animation */
.message-sending {
  opacity: 0.6;
  transform: translateY(10px);
  transition: all 0.2s ease-out;
}

.message-sent {
  opacity: 1;
  transform: translateY(0);
}

/* Reaction Animation */
.reaction-pop {
  animation: reactionPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes reactionPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

/* Typing Indicator */
.typing-indicator {
  animation: pulse 1.5s infinite;
}

/* Huddle Join Animation */
.huddle-join {
  animation: slideUpFade 0.4s ease-out;
}
```

### Loading States
```
Message Loading:
┌─────────────────────────┐
│ ░░░░░░░░  ░░░░░░        │ ← Skeleton loading
│ ░░░░░░░░░░░░░░░░░░░░    │
│ ░░░░░░░░░░              │
└─────────────────────────┘

File Upload Progress:
[████████████░░░░] 75% uploading...

Connection Status:
🟢 Connected  🟡 Connecting...  🔴 Disconnected
```

## Accessibility Features

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Arrow keys for message navigation
- Escape to close modals/panels

### Screen Reader Support
- Proper ARIA labels on all components
- Live regions for new messages
- Role attributes for custom components
- Alt text for images and emojis

### High Contrast Mode
```css
@media (prefers-contrast: high) {
  .message { border: 2px solid currentColor; }
  .reaction { background: ButtonFace; }
  .active { outline: 3px solid Highlight; }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Component Architecture

### Base Component Structure
```typescript
interface BaseComponent {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'compact' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
}

interface MessageComponent extends BaseComponent {
  user: User;
  content: string;
  timestamp: Date;
  reactions?: Reaction[];
  attachments?: Attachment[];
  threadCount?: number;
  onReact?: (emoji: string) => void;
  onReply?: () => void;
  onThread?: () => void;
}
```

### State Management
- Component-level state for UI interactions
- Global state for user data, messages, channels
- Real-time state synchronization via WebSocket
- Optimistic updates for smooth UX

This UI design system balances modern aesthetics with practical functionality, ensuring our Slack clone feels both familiar and fresh to users.
