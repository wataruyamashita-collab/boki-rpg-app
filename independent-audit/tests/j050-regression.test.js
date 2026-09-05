'use strict';
const assert=require('assert');
const core=require('../../scripts/qa/audit-core');

const hasJ050Misclassification=prod=>core.audit(prod).findings.some(finding=>finding.code==='SPECIAL_ACCOUNT_MISCLASSIFIED'&&finding.id==='J050');
const production=core.loadProduction();
assert.strictEqual(production.domain.accountType('損益'),'closing');
assert.strictEqual(hasJ050Misclassification(production),false,'a closing transfer to equity is not an equity classification');

const wordingMutation=core.loadProduction();
wordingMutation.questions.J050.explanation+=' 損益勘定は通常の純資産勘定です。';
assert.strictEqual(hasJ050Misclassification(wordingMutation),true,'an authored normal-equity assertion must fail');

const structuredMutation=core.loadProduction();
const accountType=structuredMutation.domain.accountType;
const mutatedProduction={...structuredMutation,domain:{...structuredMutation.domain,accountType:account=>account==='損益'?'equity':accountType(account)}};
assert(core.audit(mutatedProduction).findings.some(finding=>finding.code==='PROFIT_CLASSIFICATION'),'a structured closing-to-equity mutation must fail');

console.log('J050 contextual classification regression: PASS');
