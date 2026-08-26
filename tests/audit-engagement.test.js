'use strict';
const assert = require('assert');
const { panel, summary, engagementCoverage, examEvidence, output } = require('../scripts/audit-engagement');

assert.equal(examEvidence.independentReadiness, 1);
assert.equal(examEvidence.question1, 1);
assert.equal(examEvidence.question2, 1);
assert.equal(examEvidence.question3, 1);
assert.equal(examEvidence.unseenTransfer, 1);
assert.equal(output.summary.ExamConfidence.mean, 99);
assert.equal(output.redTeam.engagementDetected, true);
assert.equal(output.redTeam.examReadinessDetected, true);
assert.equal(engagementCoverage.knowledgeLinkCoverage, 9 / 300);
assert.equal(engagementCoverage.missionCoverage, 0);
assert.equal(output.features.missionChunking, false);

const completeReadiness = { independentReadiness: 1, question1: 1, question2: 1, question3: 1, unseenTransfer: 1 };
assert.equal(summary(panel(undefined, completeReadiness)).ExamConfidence.mean, output.summary.ExamConfidence.mean);
console.log('Engagement audit tests: PASS');
