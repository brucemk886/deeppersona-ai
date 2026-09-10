import type { ReportResponse, ReportSnapshot } from './payment-types';

// Overall reading only. Individual choices and detailed modules remain paid.
export function reportPreview(snapshot: ReportSnapshot): NonNullable<ReportResponse['preview']> {
  const answered=snapshot.questions.map((q,index)=>({q,index,selectedIndex:snapshot.answerChoices[q.id]}))
    .filter(x=>Number.isInteger(x.selectedIndex)&&x.q.options[x.selectedIndex]);
  return {
    totalChoices:answered.length,
    modules:(snapshot.deepResult.modules??[]).map(m=>m.title),
    overview: [
      { title: 'Your relationship strengths', body: snapshot.result.strength },
      { title: 'Where you may get stuck', body: snapshot.result.watchout },
      { title: 'A starting point for you', body: snapshot.result.nextStep },
    ].filter(item=>Boolean(item.body)),
  };
}
