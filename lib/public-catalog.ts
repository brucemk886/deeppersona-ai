// Client-safe identifiers only. Do not import paid interpretation content here.
export const ATTACHMENT_TEST_ID = 'attachment-style';
export const PUBLIC_QUESTION_IDS = new Set(Array.from({ length: 20 }, (_, index) => `${ATTACHMENT_TEST_ID}-v3-q${String(index + 1).padStart(2, '0')}`));
