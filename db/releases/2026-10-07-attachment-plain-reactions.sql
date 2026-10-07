-- User-requested plain reactions; all four replacements are one guarded update.
-- Preserve style mappings, option order, historical banks, and saved reports.
UPDATE quiz_questions
SET options_json=json_set(options_json,
    '$[' || (SELECT key FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'anxious') || '].label', 'I feel happy, but keep asking whether they really care about me.',
    '$[' || (SELECT key FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'avoidant') || '].label', 'I feel uncomfortable and want some distance.',
    '$[' || (SELECT key FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'secure') || '].label', 'I feel happy and respond with affection.',
    '$[' || (SELECT key FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'fearful') || '].label', 'I feel happy at first, then worry they''ll change their mind, so I hold back.'),
    updated_at=CURRENT_TIMESTAMP
WHERE id='attachment-style-launch-v1-q05' AND test_id='attachment-style' AND active=1
  AND prompt='They become more affectionate as the relationship grows. What do you notice?'
  AND (SELECT COUNT(*) FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='anxious')=1 AND EXISTS (SELECT 1 FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='anxious' AND json_extract(value, '$.label')='I love it and soon want to know it will keep happening.')
  AND (SELECT COUNT(*) FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='avoidant')=1 AND EXISTS (SELECT 1 FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='avoidant' AND json_extract(value, '$.label')='I like them, but start protecting more time and space for myself.')
  AND (SELECT COUNT(*) FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='secure')=1 AND EXISTS (SELECT 1 FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='secure' AND json_extract(value, '$.label')='I enjoy it and speak up if I need a different pace.')
  AND (SELECT COUNT(*) FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='fearful')=1 AND EXISTS (SELECT 1 FROM json_each(options_json) WHERE json_extract(value, '$.styleKey')='fearful' AND json_extract(value, '$.label')='I feel drawn in, then uneasy about how much it matters to me.');

SELECT quiz_questions.id,json_extract(value,'$.styleKey') AS response,json_extract(value,'$.label') AS label
FROM quiz_questions,json_each(options_json)
WHERE quiz_questions.id='attachment-style-launch-v1-q05';
