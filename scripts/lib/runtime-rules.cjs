const fs=require('node:fs');
const {rootPath}=require('./paths.cjs');
const {loadBabel}=require('./runtime.cjs');

// Reject dynamic access rather than silently omitting a runtime dependency.
function usedRuleExports(sources,babel=loadBabel()){
  const used=new Set();
  for(const [name,source] of Object.entries(sources)){
    const ast=babel.babelParse(source,name+'.js',false);
    let programScope;
    babel.traverse(ast,{Program(path){programScope=path.scope;path.stop();}});
    const isRules=path=>{
      if(!path.isIdentifier())return false;
      const binding=path.scope.getBinding(path.node.name);
      if(path.node.name==='RULES'&&!binding)return true;
      return binding?.scope===programScope&&binding.path.isVariableDeclarator()&&
        binding.path.node.init?.type==='Identifier'&&binding.path.node.init.name==='RULES';
    };
    babel.traverse(ast,{ReferencedIdentifier(path){
      if(!isRules(path))return;
      const parent=path.parentPath;
      if(path.node.name==='RULES'&&!path.scope.getBinding('RULES')&&parent.scope===programScope&&
        parent.isVariableDeclarator()&&path.key==='init'&&parent.node.id.type==='Identifier')return;
      if((parent.isMemberExpression()||parent.isOptionalMemberExpression())&&path.key==='object'){
        const property=parent.node.property;
        const key=!parent.node.computed&&property.type==='Identifier'?property.name:
          parent.node.computed&&property.type==='StringLiteral'?property.value:null;
        if(key===null)throw new Error('Dynamic rule access in '+name+' needs review.');
        used.add(key);return;
      }
      throw new Error('Whole rule object access in '+name+' needs review.');
    }});
  }
  return [...used].sort();
}

function buildRuntimeRules(sources){
  const babel=loadBabel();
  const fullSource=fs.readFileSync(rootPath('src/generated/impossible-rules.cjs'),'utf8');
  const fullRules=require(rootPath('src/generated/impossible-rules.cjs'));
  const exports=usedRuleExports(sources,babel);
  for(const name of exports)if(!Object.hasOwn(fullRules,name))throw new Error('Unknown rule export: '+name);
  const ast=babel.babelParse(fullSource,'rules.cjs',false);
  const replacements=[];
  // Browser consumers need source labels, game selection metadata and card percentages.
  // Keep card order and percentages intact; card identity/reward logic is unchanged.
  babel.traverse(ast,{VariableDeclarator(path){
    const name=path.node.id.name;
    let value;
    if(name==='b1'){
      value=Object.fromEntries(path.node.init.properties.map(property=>{
        const label=property.value.properties.find(p=>(p.key.name??p.key.value)==='name');
        if(label?.value.type!=='StringLiteral')throw new Error('Source label needs review.');
        return [property.key.name??property.key.value,{name:label.value.value}];
      }));
    }else if(name==='MINIGAMES'){
      value=fullRules.MINIGAMES.map(({id,name,unlockLevel})=>({id,name,unlockLevel}));
    }else if(name==='ORDINARY_CARD_ART'){
      value=Object.fromEntries(Object.entries(fullRules.ORDINARY_CARD_ART)
        .map(([source,cards])=>[source,cards.map(({percent})=>({percent}))]));
    }else return;
    replacements.push({start:path.node.init.start,end:path.node.init.end,text:JSON.stringify(value,null,2)});
  }});
  if(replacements.length!==3)throw new Error('Rule data layout needs review.');
  let source=fullSource;
  for(const patch of replacements.sort((a,b)=>b.start-a.start))source=source.slice(0,patch.start)+patch.text+source.slice(patch.end);
  const reduced=babel.babelParse(source,'rules.cjs',false);
  let scope;
  babel.traverse(reduced,{Program(path){scope=path.scope;path.stop();}});
  const selected=new Map();
  function include(name){
    if(selected.has(name))return;
    const binding=scope.getBinding(name);
    if(!binding||(!binding.path.isVariableDeclarator()&&!binding.path.isFunctionDeclaration()))
      throw new Error('Unsupported rule dependency: '+name);
    const path=binding.path;
    selected.set(name,path);
    path.traverse({ReferencedIdentifier(ref){
      if(ref.scope.getBinding(ref.node.name)?.scope===scope)include(ref.node.name);
    }});
  }
  exports.forEach(include);
  const declarations=[...selected.values()].sort((a,b)=>a.node.start-b.node.start).map(path=>{
    const raw=source.slice(path.node.start,path.node.end);
    return path.isVariableDeclarator()?path.parent.kind+' '+raw+';':raw;
  }).join('\n');
  const exportSource='\nmodule.exports = {'+exports.map(name=>JSON.stringify(name)+':'+name).join(',')+'};\n';
  const transformed=babel.babelTransform(declarations+exportSource,'runtime-rules.js',false,[],[]);
  if(!transformed)throw new Error('Could not generate runtime rules.');
  const code='// Browser subset of src/generated/impossible-rules.cjs; generated during build.\n'+
    transformed.code.replace(/\n\/\/# sourceMappingURL=.*$/s,'')+'\n';
  return {code,report:{fullRulesBytes:Buffer.byteLength(fullSource),runtimeRulesBytes:Buffer.byteLength(code),
    exports,removedExports:Object.keys(fullRules).filter(name=>!exports.includes(name)),
    declarations:[...selected.keys()].sort()}};
}
module.exports={usedRuleExports,buildRuntimeRules};
