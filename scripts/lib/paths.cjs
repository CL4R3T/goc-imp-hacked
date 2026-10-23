const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const rootPath=(...parts)=>path.join(ROOT,...parts);
function outputPath(...parts){
  const target=rootPath('artifacts',...parts);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  return target;
}
module.exports={ROOT,rootPath,outputPath};
