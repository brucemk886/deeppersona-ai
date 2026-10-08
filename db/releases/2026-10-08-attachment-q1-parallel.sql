-- Approved Q1 parallel reactions: compare one moment, not a sequence of texts.
-- Stable option IDs, positions, style keys and tags are preserved.
-- Historical snapshots, other questions and report templates are not touched.
UPDATE quiz_questions
SET prompt='Your partner usually keeps in touch, but you haven''t heard anything for several hours. Which reaction feels closest to yours right now?',
    options_json=json_set(options_json,
      '$[0].label',
      'I start worrying that my partner doesn''t care about me and feel an urgent need for a reply.',
      '$[0].fixed.title',
      'Silence makes you question how much you matter',
      '$[0].fixed.reading',
      'A few hours without contact can start to feel like a sign that you matter less. A reply may feel urgent because it would reassure you about the relationship, not simply update you on your partner''s day.',
      '$[0].fixed.preview',
      'A gap in contact can quickly become a question about whether you still matter.',
      '$[0].fixed.reviewZh.label',
      '我开始担心对方是不是不在乎我，很需要马上得到回应。',
      '$[0].fixed.reviewZh.reading',
      '几个小时没有联系，可能开始让你怀疑自己在对方心里的分量。你急着得到回应，是想确认关系还在，而不只是想知道对方正在做什么。',
      '$[1].label',
      'I don''t like caring this much, so I lower my expectations and pull back emotionally.',
      '$[1].fixed.title',
      'You protect yourself by lowering your expectations',
      '$[1].fixed.reading',
      'When you notice how much the silence affects you, you try to care less and pull back. Keeping your expectations low may feel safer than waiting on someone else to make you feel secure. That can protect you from disappointment while also making it harder to stay open to closeness.',
      '$[1].fixed.preview',
      'Lowering your expectations can feel safer than letting the wait affect you.',
      '$[1].fixed.reviewZh.label',
      '我不喜欢自己这么在意对方，会刻意收起期待，减少投入。',
      '$[1].fixed.reviewZh.reading',
      '当你发现没有消息会影响自己的情绪，你会试着少在乎一点、收回一些投入。比起等别人让自己安心，降低期待可能更让你觉得踏实。这能减少失望，也可能让你更难继续敞开自己。',
      '$[2].label',
      'I assume my partner is busy and feel comfortable getting on with my day until we can talk.',
      '$[2].fixed.title',
      'You can trust the connection while you wait',
      '$[2].fixed.reading',
      'You leave room for an ordinary explanation, such as your partner being busy, and keep living your day. A gap in contact does not immediately change what you believe about the relationship.',
      '$[2].fixed.preview',
      'You can leave room for a delay without immediately questioning the relationship.',
      '$[2].fixed.reviewZh.label',
      '我觉得对方可能在忙，能安心做自己的事，等有空再聊。',
      '$[2].fixed.reviewZh.reading',
      '你能为暂时没有消息保留一种普通的解释，例如对方正在忙，也能继续过自己的生活。联系暂时中断，不会立刻改变你对这段关系的信任。',
      '$[3].label',
      'I want to reach out, but I''m afraid my partner won''t respond, so I hesitate.',
      '$[3].fixed.title',
      'You want contact and hesitate to risk no response',
      '$[3].fixed.reading',
      'You want to reach out, but the possibility of getting no response makes you hesitate. Wanting connection and protecting yourself from rejection are both present at the same moment. Holding back does not necessarily mean you care less.',
      '$[3].fixed.preview',
      'You want closeness and protection from rejection at the same time.',
      '$[3].fixed.reviewZh.label',
      '我很想联系，却又怕自己的主动得不到回应，想靠近又不敢。',
      '$[3].fixed.reviewZh.reading',
      '你想主动联系，但又怕得不到回应。想靠近的愿望和保护自己不被拒绝的顾虑同时存在。你的犹豫，不代表你没有那么在乎。'),
    updated_at=CURRENT_TIMESTAMP
WHERE id='attachment-style-fixed-v2-q01' AND test_id='attachment-style' AND active=1
  AND prompt='They usually keep in touch, but you have not heard from them for several hours. What do you do first?'
  AND json_extract(report_config_json,'$.version')='attachment-fixed-v2'
  AND json_extract(report_config_json,'$.kind')='core'
  AND json_array_length(options_json)=4
  AND json_extract(options_json,'$[0].label')='I keep checking my phone, then send a few more messages.'
  AND json_extract(options_json,'$[0].optionId')='q01-a'
  AND json_extract(options_json,'$[0].styleKey')='anxious'
  AND json_extract(options_json,'$[0].fixed.id')='q01-a'
  AND json_extract(options_json,'$[0].fixed.tag')='reassurance'
  AND json_extract(options_json,'$[0].fixed.title')='Waiting makes it hard to put your phone down'
  AND json_extract(options_json,'$[0].fixed.reading')='When contact stops, it can be hard to bring your attention back to your own day. Sending another message may be your way of checking that the connection is still there.'
  AND json_extract(options_json,'$[0].fixed.preview')='When contact stops, it can be hard to bring your attention back to your own day.'
  AND json_extract(options_json,'$[0].fixed.reviewZh.label')='反复看手机，又忍不住接着发几条消息。'
  AND json_extract(options_json,'$[0].fixed.reviewZh.reading')='当联系突然停下来，你很难把注意力放回自己的生活。你可能通过继续发消息，尽快确认你们之间没有出问题。'
  AND json_extract(options_json,'$[1].label')='I pull my attention back and feel less interested in reaching out.'
  AND json_extract(options_json,'$[1].optionId')='q01-b'
  AND json_extract(options_json,'$[1].styleKey')='avoidant'
  AND json_extract(options_json,'$[1].fixed.id')='q01-b'
  AND json_extract(options_json,'$[1].fixed.tag')='distance'
  AND json_extract(options_json,'$[1].fixed.title')='You lower your expectations before you get more invested'
  AND json_extract(options_json,'$[1].fixed.reading')='When a reply does not come, you lower your expectations. Pulling back your attention can help you feel less affected by what the other person does.'
  AND json_extract(options_json,'$[1].fixed.preview')='When a reply does not come, you lower your expectations.'
  AND json_extract(options_json,'$[1].fixed.reviewZh.label')='把注意力收回来，也不太想主动联系了。'
  AND json_extract(options_json,'$[1].fixed.reviewZh.reading')='当回应没有出现，你会先把期待降下来。与其一直等，你更习惯收回投入，让自己的心情少受对方影响。'
  AND json_extract(options_json,'$[2].label')='I check in once, then get on with what I am doing.'
  AND json_extract(options_json,'$[2].optionId')='q01-c'
  AND json_extract(options_json,'$[2].styleKey')='secure'
  AND json_extract(options_json,'$[2].fixed.id')='q01-c'
  AND json_extract(options_json,'$[2].fixed.tag')='space'
  AND json_extract(options_json,'$[2].fixed.title')='You can keep living your day while you wait'
  AND json_extract(options_json,'$[2].fixed.reading')='You notice the change and can leave room for a reply. This pause alone is not enough for you to decide that something is wrong between you.'
  AND json_extract(options_json,'$[2].fixed.preview')='You notice the change and can leave room for a reply.'
  AND json_extract(options_json,'$[2].fixed.reviewZh.label')='问候一次，然后继续忙自己的事。'
  AND json_extract(options_json,'$[2].fixed.reviewZh.reading')='你会在意联系的变化，也能留出等待的空间。这一次没有回复，暂时还不足以让你认定关系出了问题。'
  AND json_extract(options_json,'$[3].label')='I want to message again, but hold back because I do not want to seem too invested.'
  AND json_extract(options_json,'$[3].optionId')='q01-d'
  AND json_extract(options_json,'$[3].styleKey')='fearful'
  AND json_extract(options_json,'$[3].fixed.id')='q01-d'
  AND json_extract(options_json,'$[3].fixed.tag')='push-pull'
  AND json_extract(options_json,'$[3].fixed.title')='You want contact and hesitate to show it'
  AND json_extract(options_json,'$[3].fixed.reading')='You want to know the connection is still there, and you also want to protect how much you reveal. Your phone may stay quiet while you keep going back and forth inside.'
  AND json_extract(options_json,'$[3].fixed.preview')='You want to know the connection is still there, and you also want to protect how much you reveal.'
  AND json_extract(options_json,'$[3].fixed.reviewZh.label')='很想再发消息，却又怕显得太在乎，最后忍着不发。'
  AND json_extract(options_json,'$[3].fixed.reviewZh.reading')='你想确认联系还在，也想保护自己不被看出有多在意。手机上看起来安静，心里却可能一直在犹豫。';
