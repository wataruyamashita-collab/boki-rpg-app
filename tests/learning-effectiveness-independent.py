#!/usr/bin/env python3
"""Recompute durable evidence from a seeded event ledger without model helpers."""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import random
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MODES = ['story', 'training', 'review', 'exam', 'desk']
rng = random.Random(200)
events = []
start_ms = int(datetime(2026, 1, 1, 12, tzinfo=timezone.utc).timestamp() * 1000)
for index in range(1200):
    mode = MODES[index % 5]
    events.append(dict(id=rng.choice(['Q', 'R', 'T']), correct=rng.randrange(3) != 0,
                       mode=mode, support=rng.choice(['none', 'hint-1', 'hint-2', 'unknown']),
                       tag=rng.choice(['a', 'b', 'foreign']), at=start_ms + (index // 40) * 86400000 + (index % 40) * 1000,
                       stage=index % 5, due=mode == 'review' and index % 7 != 0,
                       coaching=index % 4 == 0))

driver = r"""
const fs=require('fs'),Model=require('./js/model');
const events=JSON.parse(fs.readFileSync(0,'utf8'));
const integrityInput=state=>[state.learningEffectiveness,state.questionStats,state.lastLearningAt,state.answeredIds,state.correctIds,state.incorrectIds,state.learningContinuityState,state.reviewSchedule,state.reviewAssignments,state.examHistory,state.examSession,state.examAttempt,state.contentMigrationArchive,state.contentRecheckIds,state.placement,state.mistakeCounts,state.drafts,state.learningDayHistory,state.legacyProvenance,state.completed,state.lastExamReview];
const questions={Q:{type:'journal',category:'x'},R:{type:'journal',category:'x'},T:{type:'ledger',category:'x',table:{inputCells:['a','b']}}};
const run=legacy=>{
 let bytes=null;const store={getItem:()=>bytes,setItem:(_k,value)=>{bytes=value;return true;}};
 let model=new Model(questions,store);
 if(legacy){const old=JSON.parse(JSON.stringify(model.state));delete old.learningEffectiveness;delete old.learningEvidenceIntegrity;old.learningSchemaVersion=2;bytes=JSON.stringify(old);model=new Model(questions,store);}
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
  if(e.mode!=='exam')model.record(e.id,e.correct,e.at);
  if(i%79===0)model=new Model(questions,store);
 }
 model=new Model(questions,store);
 if(!Model.validateBackupState(model.state,questions))throw Error('invalid final backup');
 return {evidence:model.state.learningEffectiveness,integrity:model.state.learningEvidenceIntegrity,integrityInput:integrityInput(model.state),schema:model.state.learningSchemaVersion,stats:model.state.questionStats,mistakeCounts:model.state.mistakeCounts,retained:model.state.attempts.length};
};
const examRuns=legacy=>{
 const catalog=Object.fromEntries(Array.from({length:15},(_,i)=>['E'+i,{type:'journal',category:'x'}]));
 let bytes=null;const store={getItem:()=>bytes,setItem:(_k,value)=>{bytes=value;return true;}};let model=new Model(catalog,store,undefined,Object.keys(catalog));
 if(legacy){const old=JSON.parse(JSON.stringify(model.state));delete old.learningEffectiveness;delete old.learningEvidenceIntegrity;old.learningSchemaVersion=2;bytes=JSON.stringify(old);model=new Model(catalog,store,undefined,Object.keys(catalog));}
 const sessions=[{startedAt:10000,endAt:20000,answers:[['E0',true,10010],['E1',false,10020]]},
   {startedAt:20000,endAt:30000,answers:[['E0',false,9000],['E2',true,20020]]},
   {startedAt:30000,endAt:40000,answers:[['E0',true,30010],['E1',true,30020]]}];
 for(const [attempt,session] of sessions.entries()){
  model.state.examAttempt=attempt;model.state.examSession={ids:Object.keys(catalog),startedAt:session.startedAt,endAt:session.endAt,status:'RUNNING',evidenceVersion:1,scores:{}};model.state.mode='exam';
  for(const [id,correct,at] of session.answers){
   const number=model.nextLearningObservation(id);if(!model.recordAttempt(id,correct,20,'journal-entry',false,at,null,'unsure',{mode:'exam',support:'none',observationNumber:number}))throw Error('exam recording');
   model.state.examSession.scores[id]={correct,earned:Number(correct),possible:1,ratio:Number(correct),observationNumber:number};model.refreshEvidenceIntegrity();model.save();
  }
  model.state.mode='training';for(let i=0;i<201;i++)if(!model.recordAttempt('E14',true,20,'',false,session.endAt+i,null,'unsure',{mode:'training',support:'none'}))throw Error('exam eviction');
  model=new Model(catalog,store,undefined,Object.keys(catalog));if(model.storageWriteBlocked||!Model.validateBackupState(model.state,catalog,Object.keys(catalog)))throw Error('exam restore');
 }
 return {evidence:model.state.learningEffectiveness,integrity:model.state.learningEvidenceIntegrity,integrityInput:integrityInput(model.state),schema:model.state.learningSchemaVersion,retainedOnlyTraining:model.state.attempts.length===200&&model.state.attempts.every(row=>row.questionId==='E14')};
};
console.log(JSON.stringify({fresh:run(false),legacy:run(true),exams:{fresh:examRuns(false),legacy:examRuns(true)}}));
"""
actual = json.loads(subprocess.check_output(['node', '-e', driver], cwd=ROOT, input=json.dumps(events), text=True, env={**os.environ, 'TZ': 'UTC'}))
exam_actual = actual.pop('exams')
integrity_checked = 0
for result in [*actual.values(), *exam_actual.values()]:
    assert result['integrityInput'][0] == result['evidence']
    encoded = json.dumps(result['integrityInput'], ensure_ascii=False, separators=(',', ':')).encode('utf-16-le')
    fingerprint = 2166136261
    for index in range(0, len(encoded), 2):
        unit = int.from_bytes(encoded[index:index+2], 'little')
        fingerprint = ((fingerprint ^ unit) * 16777619) & 0xffffffff
    assert result['schema'] == 3
    assert result['integrity'] == {'schemaVersion': 10, 'signature': f'{fingerprint:08x}'}
    integrity_checked += 1
exam_checked = 0
exam_sessions = [(10000, 20000, [('E0', True, 10010), ('E1', False, 10020)]),
                 (20000, 30000, [('E0', False, 9000), ('E2', True, 20020)]),
                 (30000, 40000, [('E0', True, 30010), ('E1', True, 30020)])]
for origin, result in exam_actual.items():
    assert result['retainedOnlyTraining']
    expected, counts, successes, first = {}, {}, {}, {}
    for attempt, (start, end, answers) in enumerate(exam_sessions):
        for qid, correct, at in answers:
            counts[qid] = counts.get(qid, 0) + 1
            successes[qid] = successes.get(qid, 0) + int(correct)
            first.setdefault(qid, dict(correct=correct, at=at, mode='exam', support='none'))
            expected[qid] = dict(observationNumber=counts[qid], correct=correct, at=at,
                                 session=dict(startedAt=start, endAt=end, attempt=attempt))
    for qid, receipt in expected.items():
        item = result['evidence']['questions'][qid]
        assert item['lastExamObservation'] == receipt
        assert item['firstAttempt'] == (first[qid] if origin == 'fresh' else None)
        assert item['modes']['exam'] == dict(attempts=counts[qid], successes=successes[qid])
        exam_checked += 1
checks = 0
for origin, result in actual.items():
    expected_mistakes = {qid: sum(not e['correct'] and e['mode'] != 'exam' for e in events if e['id'] == qid) for qid in ['Q', 'R', 'T']}
    assert result['mistakeCounts'] == expected_mistakes, (origin, result['mistakeCounts'], expected_mistakes)
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
        retention['receipts'] = {}
        for kind, result_correct in [('correct', True), ('incorrect', False)]:
            matches = [(i, e) for i, e in enumerate(events) if qid == 'R' and e['due'] and e['correct'] == result_correct]
            if not matches:
                retention['receipts'][kind] = None
            else:
                i, event = matches[-1]
                retention['receipts'][kind] = dict(sourceId=qid, questionId=event['id'], observationNumber=sum(e['id'] == event['id'] for e in events[:i+1]), at=event['at'], stage=event['stage'])
        assert value['delayedReview'] == retention
        bindings = {}
        for kind, result_correct in [('correct', True), ('incorrect', False)]:
            matches = [(i, e) for i, e in enumerate(events) if e['due'] and e['correct'] == result_correct]
            if matches and matches[-1][1]['id'] == qid:
                i, event = matches[-1]
                bindings.setdefault('R', {})[kind] = dict(observationNumber=sum(e['id'] == qid for e in events[:i+1]), at=event['at'], stage=event['stage'])
        assert value['reviewBindings'] == bindings
        assert value['lastExamObservation'] is None  # This ledger has no active exam session.
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
def continuity_from_ledger(ledger, include_days=False):
    days = {}
    for event in ledger:
        key = datetime.fromtimestamp(event['at'] / 1000, timezone.utc).strftime('%Y-%m-%d')
        day = days.setdefault(key, dict(dayKey=key, attempts=0, correctCount=0, questionIds=[], reviewSuccessCount=0))
        day['attempts'] += 1
        day['correctCount'] += int(event['correct'])
        day['reviewSuccessCount'] += int(event['correct'] and event.get('due', False))
        if event['id'] not in day['questionIds']:
            day['questionIds'].append(event['id'])
    return days if include_days else dict(activeDayKeys=sorted(days), today=days[key])

expected_continuity = continuity_from_ledger(events)
assert len(expected_continuity['activeDayKeys']) == 30
continuity_checked = 0
for result in actual.values():
    assert result['integrityInput'][6] == expected_continuity
    assert result['integrityInput'][17] == continuity_from_ledger(events, True)
    continuity_checked += 1
exam_ledger = []
for start, end, answers in exam_sessions:
    exam_ledger.extend(dict(id=qid, correct=correct, at=at) for qid, correct, at in answers)
    exam_ledger.extend(dict(id='E14', correct=True, at=end+i) for i in range(201))
for result in exam_actual.values():
    assert result['integrityInput'][6] == continuity_from_ledger(exam_ledger)
    assert result['integrityInput'][17] == continuity_from_ledger(exam_ledger, True)
    continuity_checked += 1
print(json.dumps(dict(status='PASS', events_per_origin=len(events), origins=list(actual), question_aggregates_checked=checks, mistake_totals_checked=6,
                      replay_rejections=2*len(events), outer_integrity_records_checked=integrity_checked, continuity_records_checked=continuity_checked,
                      learning_days_per_origin=30, exam_session_receipts_checked=exam_checked, retention_successes=sum(e['due'] and e['correct'] for e in events))))
