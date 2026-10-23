const {WHEEL_SOURCES,cardById}=require('../../src/rules/impossible-rules.cjs');

// Enumerate the public card IDs for ownership fixtures and card metadata checks.
const ids=['coin','deal','plinko','slot'].flatMap(game=>
  [0,1,2,3].flatMap(band=>[...WHEEL_SOURCES,'global'].map(source=>`${game}:${band}:${source}`)));
ids.push(...Array.from({length:6},(_,index)=>`unique:${index}:global`));
module.exports=ids.map(cardById);
