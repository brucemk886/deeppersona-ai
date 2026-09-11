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

Tests use intuitive image choices. Do not replace the experience with written scenario questionnaires. The relationship-test-v2-draft.md scenario proposal was rejected by the owner and is not approved for implementation.

## Catalog source of truth

- D1 `quiz_tests` and `quiz_questions` are authoritative for the admin, public quiz, images, ordering, publication state, prices, and new report interpretations.
- Code defaults initialize an empty database only. Do not overwrite the existing catalog on reads, filter published questions by a fixed list of IDs, or resurrect deleted rows during deployment.
- Update existing production content through the admin or an explicitly scoped data migration. Changing the seed files alone does not update a live catalog. Preserve completed report snapshots.
