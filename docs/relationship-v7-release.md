# Relationship image quiz, edition 7

US-realistic short copy plus matching option photos. Fixes the live Chinese mistranslation of left-on-read as 邮件, and the stale weekend-invite / new-town / cinema labels on phone photos.

- Same public IDs (`attachment-style-v3-q01` through `q20`). Atlas files move to `/quiz/relationship-v7/q01.webp` … `q20.webp` so CDN/browser cache cannot keep serving the previous tiles.
- Prompts and option labels follow the v7 bank exactly. Helper copy is `No wrong answers.` Scoring stays A anxious, B avoidant, C secure, D fearful. Card microcopy equals the option labels.
- Q1 is text / iMessage Read, never email. Chinese locale copy uses 短信/消息已读 and never 邮件.
- `reconcilePublicCatalog()` upserts `prompt`, `options_json`, and `atlas_path`. `rowToQuestion()` also prefers the committed catalog for public IDs, so a stale D1 weekend-invite row cannot outrank the bank.
- After deploy, hit home or a test page so reconcile runs, then hard-refresh. New v7 URLs bypass the old `/quiz/relationship-v3/` cache.
