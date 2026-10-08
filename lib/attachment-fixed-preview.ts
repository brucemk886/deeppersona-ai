import {hasUsefulFixedReading, type FixedBlock, type FixedOverview, type FixedReport} from './attachment-fixed';

// Only an unfinished opening is public. The continuation is never sent as
// blurred text, and the source is the same frozen chapter unlocked after payment.
export function fixedChapterOpening(block:FixedBlock):Pick<FixedBlock,'id'|'title'|'preview'> {
 const paragraph=(block.paragraphs.find(p=>p.trim())??'').replace(/\s+/g,' ').trim();
 const limit=Math.min(180,Math.floor(paragraph.length*.58));
 let cut=paragraph.lastIndexOf(' ',limit);
 if(cut<1)cut=limit;
 const opening=paragraph.slice(0,cut).trim().replace(/[.,;:!?—–-]+$/u,'');
 return {id:block.id,title:block.title,preview:opening?opening+'…':''};
}

export function fixedFreeOverview(report:FixedReport):FixedOverview {
 // Old snapshots may contain the previously public full-paragraph sample.
 // Project them to today's public shape without rewriting the saved report.
 const {readingSample:_retiredSample,...overview}=report.overview;
 const permitted=overview.state!=='insufficient';
 return {...overview,
  evidence:permitted?overview.evidence.slice(0,3):[],
  traits:[],
  riskPreviews:permitted?report.risks.slice(0,3).map(fixedChapterOpening):[],
  familyPreviews:permitted?report.origins.slice(0,3).map(fixedChapterOpening):[],
  deeperPreviews:permitted?report.deeper.map(fixedChapterOpening):[],
  purchasable:hasUsefulFixedReading(report),
 };
}