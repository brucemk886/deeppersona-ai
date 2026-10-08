-- Exact default-introduction correction only. Preserve managed edits, questions, paid chapters and saved reports.
UPDATE quiz_report_templates
SET content_json = json_set(content_json, '$.revision', revision + 1, '$.profiles.anxious.summary',
    'A slower reply can leave you wondering whether something has changed between you. You may replay the conversation, reach out again, and struggle to relax until you feel close again. Keeping the connection can take so much effort that what originally upset you never gets resolved.',
    '$.profiles.avoidant.summary',
    'You may care deeply about someone and still expect less when you feel disappointed. Instead of saying what hurt, you handle things yourself and reveal less of what you need. Your partner may assume you are fine, while you find it harder to feel supported in the relationship.',
    '$.profiles.fearful.summary',
    'You want to be close, but once you open up, you may worry that you have trusted too much. You pull back to feel safer, then miss the person and want contact again. You can spend more time deciding whether to trust the relationship than enjoying being in it.',
    '$.profiles.secure.summary',
    'You can care about someone, ask for what you need, and still keep time for your own life. A disagreement does not immediately make you doubt the whole relationship. But being patient and understanding can still leave you accepting too little if the other person repeatedly fails to follow through.'),
    revision = revision + 1, updated_at = CURRENT_TIMESTAMP
WHERE version = 'attachment-fixed-v2'
  AND json_extract(content_json, '$.profiles.anxious.summary') = 'Small changes in contact can take up a lot of space in your mind. You may want to talk, check, and make sure you still matter. Reassurance can help in the moment, while the next unanswered message brings the question back.'
  AND json_extract(content_json, '$.profiles.avoidant.summary') = 'You often turn toward yourself when feelings are difficult, and create space when closeness becomes demanding. Other people may see independence without realizing that you also have needs you rarely bring into the conversation.'
  AND json_extract(content_json, '$.profiles.fearful.summary') = 'You may reach for connection and then feel exposed when it arrives. A need comes out and is taken back; distance feels safer until you begin to miss the person. Wanting care and wanting protection can show up in the same moment.'
  AND json_extract(content_json, '$.profiles.secure.summary') = 'You tend to express what you need, allow room for time apart, and return to difficult conversations. You can still feel hurt or uncertain, while using what actually happens to judge the relationship instead of having to re-establish your worth each time.';
