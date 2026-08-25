'use strict';
const fs = require('fs');

const source = ['index.html','js/controller.js','js/model.js','js/rpg.js','js/view.js'].map(file => fs.readFileSync(file, 'utf8')).join('\n');
const groups = [
  ['A',.9,.5,.7], ['B',.1,.5,.4], ['C',.3,.6,.5], ['D',1,.7,.8], ['E',.4,.7,.5],
  ['F',.2,.8,.8], ['G',.8,.6,.6], ['H',.3,.15,.4], ['I',.4,.5,.5], ['J',.05,.7,.2]
];
const features = {
  immediateFeedback: source.includes("score.correct ? '正解です！'"),
  adaptive: source.includes('adaptiveDifficulty(concept'),
  spacedReview: source.includes('20 * 60 * 1000') && source.includes('7 * 24 * 60 * 60 * 1000'),
  confidenceLearning: source.includes("confidence === 'sure'") && !source.includes("confidence === 'bold' ? 3 : 1"),
  nonBlockingFailure: !source.includes('資金ショート') && source.includes('帳簿信頼度'),
  progress: source.includes('Chapter進捗') && source.includes('mastery'),
  materials: source.includes('renderMaterials(question)'),
  curiosityHook: /Accounting Surprise|curiosity|次の疑問/.test(source),
  missionChunking: /mission/i.test(source),
  jobUnlock: /NEW JOB|仕事マップ|解放/.test(source)
};
function panel(active = features) {
  const rows=[];
  for (const [group,game,failure,curiosity] of groups) for (let i=0;i<10;i+=1) {
    const variation=(i-4.5)*.8;
    const learning=45+12*active.materials+10*active.adaptive+10*active.spacedReview+8*active.confidenceLearning;
    const safety=35+35*active.nonBlockingFailure+failure*15;
    const engagement=28+game*12+curiosity*10+8*active.immediateFeedback+6*active.progress+8*active.curiosityHook+6*active.missionChunking+5*active.jobUnlock;
    const clamp=value=>Math.max(0,Math.min(100,Math.round(value+variation)));
    rows.push({group,First5MinExcitement:clamp(engagement),OneMoreQuestionIntent:clamp(engagement*.65+learning*.35),NextDayReturnIntent:clamp(engagement*.5+learning*.35+safety*.15),LearningClarity:clamp(learning),Frustration:clamp(100-safety),PerceivedProgress:clamp(learning*.55+engagement*.45),Curiosity:clamp(engagement),Achievement:clamp(engagement*.6+learning*.4),NarrativeInterest:clamp(25+game*15+10*active.curiosityHook),ExamConfidence:clamp(learning*.8+20*active.spacedReview)});
  }
  return rows;
}
const mean=(values)=>Math.round(values.reduce((a,b)=>a+b,0)/values.length*10)/10;
const summary=rows=>Object.fromEntries(['First5MinExcitement','OneMoreQuestionIntent','NextDayReturnIntent','LearningClarity','Frustration','PerceivedProgress','Curiosity','Achievement','NarrativeInterest','ExamConfidence'].map(metric=>{const values=rows.map(row=>row[metric]).sort((a,b)=>a-b); const middle=values.length/2; return [metric,{mean:mean(values),median:values.length%2 ? values[Math.floor(middle)] : (values[middle-1]+values[middle])/2,min:values[0],max:values[values.length-1]}];}));
const rows=panel();
const personas=Object.fromEntries(groups.map(([group])=>[group,summary(rows.filter(row=>row.group===group))]));
const mutation={...features,nonBlockingFailure:false,progress:false,curiosityHook:false,missionChunking:false};
const output={classification:'SIMULATED — deterministic heuristic, not real-user evidence',features,summary:summary(rows),personas,redTeam:{baselineOneMore:summary(rows).OneMoreQuestionIntent.mean,mutatedOneMore:summary(panel(mutation)).OneMoreQuestionIntent.mean,detected:summary(panel(mutation)).OneMoreQuestionIntent.mean < summary(rows).OneMoreQuestionIntent.mean}};
console.log(JSON.stringify(output,null,2));
if (!output.redTeam.detected) process.exitCode=1;
