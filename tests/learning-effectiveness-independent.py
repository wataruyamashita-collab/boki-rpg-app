#!/usr/bin/env python3
"""Recompute durable evidence from a seeded event ledger without model helpers."""
import json
from pathlib import Path
import random
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MODES = ['story', 'training', 'review', 'exam', 'desk']
rng = random.Random(200)
events = []
for index in range(1200):
    mode = MODES[index % 5]
    events.append(dict(id=rng.choice(['Q', 'R', 'T']), correct=rng.randrange(3) != 0,
                       mode=mode, support=rng.choice(['none', 'hint-1', 'hint-2', 'unknown']),
                       tag=rng.choice(['a', 'b', 'foreign']), at=100000 + index * 1000,
                       stage=index % 5, due=mode == 'review' and index % 7 != 0,
                       coaching=index % 4 == 0))

driver = r"""
const fs=require('fs'),Model=require('./js/model');
const events=JSON.parse(fs.readFileSync(0,'utf8'));
const questions={Q:{type:'journal',category:'x'},R:{type:'journal',category:'x'},T:{type:'ledger',category:'x',table:{inputCells:['a','b']}}};
const run=legacy=>{
 let bytes=null;const store={getItem:()=>bytes,setItem:(_k,value)=>{bytes=value;return true;}};
 let model=new Model(questions,store);
 if(legacy){const old=JSON.parse(JSON.stringify(model.state));delete old.learningEffectiveness;bytes=JSON.stringify(old);model=new Model(questions,store);}
 for(const [i,e] of events.entries()){
  model.state.mode=e.mode;
  model.state.reviewSchedule.R={stage:e.stage,dueAt:e.due?e.at:e.at+1};
  model.assignReview('R',e.id,e.at-1);
  const n=model.nextLearningObservation(e.id);
  if(!model.recordAttempt(e.id,e.correct,20,e.tag,e.due&&e.correct,e.at,e.stage,'unsure',
    {mode:e.mode,support:e.support,observationNumber:n,reviewSourceId:'R'}))throw Error('record '+i);
  const bytesBefore=bytes;
  if(model.recordAttempt(e.id,e.correct,20,e.tag,e.due&&e.correct,e.at,e.stage,'unsure',
    {mode:e.mode,support:e.support,observationNumber:n,reviewSourceId:'R'})!==false || bytes!==bytesBefore)throw Error('replay '+i);
  if(!e.correct&&e.coaching)model.recordAssistedRecovery(e.id,n,e.at+1);
  if(i%79===0)model=new Model(questions,store);
 }
 model=new Model(questions,store);
 if(!Model.validateBackupState(model.state,questions))throw Error('invalid final backup');
 return {evidence:model.state.learningEffectiveness,stats:model.state.questionStats,retained:model.state.attempts.length};
};
console.log(JSON.stringify({fresh:run(false),legacy:run(true)}));
"""
actual = json.loads(subprocess.check_output(['node', '-e', driver], cwd=ROOT, input=json.dumps(events), text=True))
checks = 0
for origin, result in actual.items():
    assert result['retained'] == 200
    assert result['evidence']['initialHistory'] == ('complete' if origin == 'fresh' else 'unknown')
    for qid in ['Q', 'R', 'T']:
        rows = [e for e in events if e['id'] == qid]
        value = result['evidence']['questions'][qid]
        correct = sum(e['correct'] for e in rows)
        assert (value['observedAttempts'], value['correctCount'], value['incorrectCount']) == (len(rows), correct, len(rows)-correct)
        assert (value['firstObservedAt'], value['lastObservedAt']) == (rows[0]['at'], rows[-1]['at'])
        first = {k: rows[0][k] for k in ['correct', 'at', 'mode', 'support']} if origin == 'fresh' else None
        assert value['firstAttempt'] == first
        assert result['stats'][qid]['correctCount'] == correct
        assert result['stats'][qid]['incorrectCount'] == len(rows)-correct
        for mode in MODES:
            selected = [e for e in rows if e['mode'] == mode]
            assert value['modes'][mode] == dict(attempts=len(selected), successes=sum(e['correct'] for e in selected))
        due = [e for e in events if e['due']] if qid == 'R' else []
        successes = [e for e in due if e['correct']]
        retention = dict(attempts=len(due), successes=len(successes), lastAt=due[-1]['at'] if due else None,
                         highestConfirmedStage=max(min(e['stage']+1, 4) for e in successes) if successes else None,
                         stages=[dict(attempts=sum(e['stage'] == stage for e in due),
                                      successes=sum(e['stage'] == stage for e in successes)) for stage in range(5)])
        assert value['delayedReview'] == retention
        tags = ['journal-entry'] if qid != 'T' else ['cell:a', 'cell:b', 'table-cell']
        patterns = {}
        for tag in tags:
            wrong = [i for i, e in enumerate(rows) if not e['correct'] and
                     ('journal-entry' if qid != 'T' else 'cell:'+e['tag'] if e['tag'] in ['a', 'b'] else 'table-cell') == tag]
            if not wrong:
                continue
            recovered, assisted = [], []
            # Each wrong occurrence opens an episode, ending at the next occurrence.
            # Find the first unsupported/assisted success in that interval separately.
            for position, start in enumerate(wrong):
                end = wrong[position+1] if position+1 < len(wrong) else len(rows)
                unassisted = next((i for i in range(start+1, end) if rows[i]['correct'] and rows[i]['support'] == 'none'), None)
                hint = next((i for i in range(start+1, unassisted if unassisted is not None else end)
                             if rows[i]['correct'] and rows[i]['support'] in ['hint-1', 'hint-2']), None)
                # Coaching for any subsequent wrong response also corrects all open
                # cell patterns of this question, not only its newest wrong cell.
                coaching = next((i for i in range(start, unassisted if unassisted is not None else end)
                                 if not rows[i]['correct'] and rows[i]['coaching']), None)
                assisted_times = ([rows[hint]['at']] if hint is not None else []) + ([rows[coaching]['at']+1] if coaching is not None else [])
                if assisted_times:
                    assisted.append(min(assisted_times))
                if unassisted is not None:
                    recovered.append(rows[unassisted]['at'])
            patterns[tag] = dict(occurrences=len(wrong), recoveredCount=len(recovered), assistedRecoveredCount=len(assisted),
                                 lastOccurredAt=rows[wrong[-1]]['at'], lastRecoveredAt=recovered[-1] if recovered else None,
                                 lastAssistedRecoveredAt=assisted[-1] if assisted else None,
                                 pending=unassisted is None, assisted=bool(assisted_times))
        assert value['misconceptionStats'] == patterns, (origin, qid, value['misconceptionStats'], patterns)
        checks += 1
print(json.dumps(dict(status='PASS', events_per_origin=len(events), origins=list(actual), question_aggregates_checked=checks,
                      replay_rejections=2*len(events), retention_successes=sum(e['due'] and e['correct'] for e in events))))
