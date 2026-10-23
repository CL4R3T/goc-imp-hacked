const fs=require('node:fs');
const {rootPath,outputPath}=require('./lib/paths.cjs');
const babel=require('./lib/runtime.cjs').loadBabel();
for(const [input,output] of [
  ['index-kVDE62Ka.js','index.formatted.js'],
  ['ImpossiblePage-7YXHmM7h.js','ImpossiblePage.formatted.js'],
]){
  const source=fs.readFileSync(rootPath('samples/upstream',input),'utf8');
  const formatted=babel.babelTransform(source,input,true,[],[]).code.replace(/\n\/\/# sourceMappingURL=.*$/s,'');
  fs.writeFileSync(outputPath('formatted',output),formatted+'\n');
  console.log('Formatted '+input+' -> artifacts/formatted/'+output);
}
