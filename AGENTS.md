# Project workflow

## Deployment and GitHub synchronization

The owner has authorized ongoing GitHub synchronization after production changes. Do not ask them to repeat this request.

- Review the diff and exclude credentials, local `.dev.vars*` / `.env*`, `work/`, generated builds, database exports, and customer data. `.env.example` contains placeholders only.
- Fetch `origin` and preserve concurrent remote changes. Never force-push or discard another task's edits. Resolve ordinary conflicts and run the relevant checks.
- Commit reviewed changes before deployment. Use `npm run deploy` for the site or `npm run deploy:mailer` for the mail worker. These commands deploy a clean committed checkout and push the exact commit to the current upstream branch only after successful deployment.
- A production change is not complete until deployment and GitHub synchronization have both succeeded. If push fails after deployment, report the deployed commit and the push failure, then resolve/retry without re-deploying unnecessarily.
- When synchronizing an already deployed version, commit/push the corresponding reviewed source directly; do not redeploy solely to create a backup.
- Do not publish unfinished drafts or unrelated experiments as production changes. Never copy secrets or production customer records to GitHub.

## Product direction

As authorized on 2026-10-08, the attachment quiz uses fixed V2: 14 relationship-reaction questions and six unscored context questions, four authored main reports, actual-choice evidence, and one optional payment for relationship risks and origins. Report creation and viewing do not use AI. See `docs/2026-10-08-attachment-fixed-v2.md`. Keep historical report snapshots and previously purchased deep-report rights intact. Evaluate new iterations using edition-specific funnel data; do not overwrite the managed catalog on reads. Other image quizzes are not changed by this decision.

Quiz options should describe reactions and actions directly. Avoid decorative body metaphors, neurochemical buzzwords, and ambiguous figurative language that can turn into misleading literal translations.

## Catalog source of truth

- D1 `quiz_tests`, `quiz_questions`, and `quiz_report_templates` are authoritative for the admin, public quiz, images, ordering, publication state, prices, and new report interpretations.
- Show saved question text verbatim on the public site regardless of browser language. Do not overlay built-in translations on the managed catalog.
- Code defaults initialize an empty database only. Do not overwrite the existing catalog on reads, filter published questions by a fixed list of IDs, or resurrect deleted rows during deployment.
- Update existing production content through the admin or an explicitly scoped data migration. Changing the seed files alone does not update a live catalog. Preserve completed report snapshots.
