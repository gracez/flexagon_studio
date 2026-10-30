const DB_NAME='flexagon-studio',STORE='recovery';
function openDatabase(){
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE,{keyPath:'id'});
  request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  request.onblocked=()=>reject(new Error('Local recovery storage is blocked by another tab.'));
 });
}
function readCopies(db){return new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE,'readonly'),request=tx.objectStore(STORE).getAll();
 tx.oncomplete=()=>resolve(request.result);tx.onerror=tx.onabort=()=>reject(tx.error||request.error);
});}
function writeCopy(db,project){return new Promise((resolve,reject)=>{
 const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE),request=store.get('latest');
 const timestamp=Date.now();
 request.onsuccess=()=>{if(request.result)store.put({...request.result,id:'previous'});store.put({id:'latest',timestamp,project});};
 tx.oncomplete=()=>resolve(timestamp);tx.onerror=tx.onabort=()=>reject(tx.error||request.error||new Error('Could not save local recovery.'));
});}
function clearCopies(db){return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error);});}

export function createAutosave({capture,isBusy,chooseRecovery,onStatus,onReady,delay=2000}){
 let db,ready=false,revision=0,savedRevision=0,downloadedRevision=0,warningRevision=0,timer=null,running=null,hasCopy=false,disabled=false,recoveryPending=false;
 const status=(state,details={})=>onStatus(state,details);
 function queue(ms=delay){clearTimeout(timer);if(!disabled)timer=setTimeout(()=>{void flush();},ms);}
 function markChanged({warn=true}={}){
  // Navigation alone should not create an empty recovery project.
  if(!warn&&!revision&&!hasCopy)return;
  revision++;if(warn)warningRevision=revision;queue();
 }
 async function flush(){
  clearTimeout(timer);
  if(disabled||!ready||recoveryPending||revision===savedRevision)return false;
  if(running){queue(250);return running;}
  if(isBusy()){queue(250);return false;}
  const capturedRevision=revision;
  running=(async()=>{
   status('saving');
   try{
    const project=await capture(),timestamp=await writeCopy(db,project);
    savedRevision=capturedRevision;hasCopy=true;
    if(revision===savedRevision)status('saved',{timestamp});else{status('pending');queue();}
    return true;
   }catch(error){status('error',{error});return false;}
   finally{running=null;}
  })();
  return running;
 }
 async function initialize(){
  try{
   db=await openDatabase();db.onversionchange=()=>{db.close();disabled=true;status('error',{error:new Error('Recovery database changed. Reload to reconnect.')});};
   const copies=await readCopies(db),latest=copies.find(c=>c.id==='latest'),previous=copies.find(c=>c.id==='previous');
   if(latest||previous){
    const choice=await chooseRecovery({latest,previous});
    if(choice.action==='pending'){recoveryPending=true;hasCopy=true;}
    else if(choice.action==='discard')await clearCopies(db);
    else{hasCopy=true;status('recovered',{timestamp:choice.record.timestamp});if(choice.record.id==='previous')markChanged({warn:false});}
   }
  }catch(error){disabled=true;status('error',{error});}
  finally{ready=true;onReady();if(revision>savedRevision)queue();}
 }
 void initialize();
 return {markChanged,flush,
  continueCurrent(){recoveryPending=false;if(revision>savedRevision)queue();},
  async acceptRecovery(record){clearTimeout(timer);if(running)await running;clearTimeout(timer);revision=savedRevision=downloadedRevision=warningRevision=0;recoveryPending=false;hasCopy=true;status('recovered',{timestamp:record.timestamp});markChanged({warn:false});},
  async copies(){return db?readCopies(db):[];},
  async clearRecovery(){clearTimeout(timer);if(running)await running;if(db)await clearCopies(db);revision=savedRevision=downloadedRevision=warningRevision=0;recoveryPending=false;hasCopy=false;},
  noteDownloaded(){downloadedRevision=revision;},
  hasUnsavedChanges(){return warningRevision>Math.max(savedRevision,downloadedRevision);},
  get unavailable(){return disabled;},get ready(){return ready;},get hasCopy(){return hasCopy;},
 };
}
