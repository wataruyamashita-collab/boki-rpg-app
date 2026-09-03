'use strict';const c=require('./audit-core'),r=c.lockCheck();console.log(r.ok?`PASS ${r.hash}`:`AUDIT_LOCK_BROKEN ${r.errors.join(', ')}`);process.exit(r.ok?0:1);
