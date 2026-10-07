-- User-requested V1 copy refinement. Match semantic response, never its shuffled display letter.
-- Only the one expected active option is changed. Existing report snapshots and historical banks remain intact.
UPDATE quiz_questions
SET options_json = json_set(options_json,
    '$[' || (SELECT key FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'anxious') || '].label',
    'I keep checking my phone, then keep sending follow-up texts until they reply.'),
    updated_at = CURRENT_TIMESTAMP
WHERE id = 'attachment-style-launch-v1-q01'
  AND test_id = 'attachment-style'
  AND active = 1
  AND prompt = 'Their replies are shorter than usual today. What happens inside you first?'
  AND (SELECT COUNT(*) FROM json_each(options_json) WHERE json_extract(value, '$.styleKey') = 'anxious') = 1
  AND EXISTS (SELECT 1 FROM json_each(options_json)
    WHERE json_extract(value, '$.styleKey') = 'anxious'
      AND json_extract(value, '$.label') = 'I start wondering whether I did something wrong and look for reassurance.');

SELECT quiz_questions.id, json_extract(value, '$.label') AS label, json_extract(value, '$.styleKey') AS response
FROM quiz_questions, json_each(options_json)
WHERE quiz_questions.id = 'attachment-style-launch-v1-q01'
  AND json_extract(value, '$.styleKey') = 'anxious';
