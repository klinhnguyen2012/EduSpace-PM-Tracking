# EduSpace brand guidelines

## Brand character

EduSpace is a calm, approachable project workspace. The interface should feel clear and organized first, with a soft, optimistic personality from lavender and pink accents. Keep task data and actions more prominent than decoration.

## Color tokens

| Token | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| Page | `#FBF8FF` | `#171526` | Main canvas |
| Surface | `#FFFFFF` | `#211F35` | Cards, dialogs, menus |
| Primary text | `#302441` | `#F3EDF8` | Titles and key values |
| Secondary text | `#62566F` | `#D0C5DC` | Body content |
| Muted text | `#887E96` | `#A89BB5` | Hints and metadata |
| Border | `#EEE6F4` | `#38334D` | Dividers and control outlines |
| Purple accent | `#A542D5` | `#A542D5` | Primary actions, links, focus |
| Deep purple | `#842BB8` | `#842BB8` | Hover and pressed emphasis |
| Pink accent | `#E64DB5` | `#E64DB5` | Gradient endpoint and highlight |

The active navigation and brand mark may use a purple-to-pink gradient. Reserve gradients for a small number of high-attention elements; keep content panels flat and readable.

## Logo & brand mark rules

- **On light surfaces** (e.g. login cards, white topbar, light canvas): Use the primary colored brand mark (`/eduspace-mark.png`).
- **On blue surfaces** (e.g. sidebar `#192f73`, blue containers, `.on-blue` contexts): The logo turns solid white (`/eduspace-mark-white.png` or `filter: brightness(0) invert(1)`), without a white background box around it.

## Type and layout

- Use the existing Inter/system sans-serif stack.
- Use clear, compact headings and readable body text. Avoid shrinking labels to fit; allow the layout to adapt instead.
- Use rounded cards and controls consistently (roughly 8–14px), subtle borders, and restrained shadows.
- Keep the dashboard information hierarchy and current EduSpace data. Do not add decorative metrics or product features from reference images.

## Status and priority colors

Keep semantic meaning consistent in both themes: green for complete/fixed, amber for in progress or medium priority, red for overdue/critical, and violet for QA/retesting. Pair every color with a text label; color alone must not carry meaning. Assignee colors identify people and remain consistent across the task list and roadmap.

## Theme behavior

- Light theme is the default. Dark theme uses deep plum/navy surfaces with the same purple and pink accents.
- Theme selection is a visual preference only; it must not affect authentication, workspace data, or task status.
- Maintain visible keyboard focus and sufficient contrast for text, controls, and status labels in both themes.
