// Keep routine verification out of the historical v7.0.0 evidence directory.
process.env.EVIDENCE_DIR ||= 'evidence/challenge-v7/rules';
for(const file of ['verify-v7','verify-base-v7','verify-ux-v7','verify-challenge'])require('./'+file+'.cjs');
