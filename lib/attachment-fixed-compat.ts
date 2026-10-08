import type {QuizQuestion,QuizOption} from './quiz';
import {FIXED_VERSION} from './attachment-fixed';
// Immutable release metadata for users who loaded the five-option page before
// the four-option correction. Never returned in the current public catalog.
const retiredCoreSkips:Record<string,QuizOption>={
  "attachment-style-fixed-v2-q01": {
    "optionId": "q01-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q01-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q02": {
    "optionId": "q02-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q02-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q03": {
    "optionId": "q03-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q03-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q04": {
    "optionId": "q04-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q04-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q05": {
    "optionId": "q05-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q05-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q06": {
    "optionId": "q06-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q06-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q07": {
    "optionId": "q07-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q07-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q08": {
    "optionId": "q08-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q08-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q09": {
    "optionId": "q09-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q09-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q10": {
    "optionId": "q10-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q10-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q11": {
    "optionId": "q11-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q11-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q12": {
    "optionId": "q12-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q12-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q13": {
    "optionId": "q13-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q13-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  },
  "attachment-style-fixed-v2-q14": {
    "optionId": "q14-skip",
    "label": "Not applicable / Hard to say",
    "microcopy": "",
    "meaning": "",
    "projection": "",
    "fixed": {
      "id": "q14-skip",
      "tag": "skip",
      "title": "This part stays open",
      "reading": "You did not provide enough information to interpret this situation. No personal history or reaction is filled in for this answer.",
      "preview": "You did not provide enough information to interpret this situation."
    }
  }
};
export function restoreRetiredCoreSkips(questions:QuizQuestion[],choices:Record<string,number>,optionIds?:Record<string,string>):QuizQuestion[]{
 return questions.map(q=>{
  const retired=retiredCoreSkips[q.id];
  if(q.testId!=='attachment-style'||q.reportConfig?.version!==FIXED_VERSION||q.reportConfig.kind!=='core'||q.options.length!==4||choices[q.id]!==4||!retired||optionIds?.[q.id]!==retired.optionId)return q;
  return {...q,options:[...q.options,retired]};
 });
}
