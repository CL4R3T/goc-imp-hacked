const fs=require('node:fs');
const path=require('node:path');
const {predict}=require('../src/core/predict-event.cjs');

try{
  const [input,output]=process.argv.slice(2);
  if(!input)throw new Error('Usage: node scripts/predict-event.cjs INPUT.json [OUTPUT.json]');
  const config=JSON.parse(fs.readFileSync(input,'utf8').replace(/^\uFEFF/,''));
  const text=JSON.stringify(predict(config),null,2)+'\n';
  if(output){
    fs.mkdirSync(path.dirname(output),{recursive:true});
    fs.writeFileSync(output,text);
    console.log('Prediction written to '+output);
  }else process.stdout.write(text);
}catch(error){console.error(error.message);process.exitCode=1;}
