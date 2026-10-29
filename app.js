/* Porcícola El Olivo — PWA local-first. Datos en IndexedDB; no se transmiten a ningún servidor. */
const DB_NAME = "elOlivoPorcinaDB", DB_VERSION = 4;
const STORES = ["animals","repro","health","finance","reminders","feeders","feedings","pens"];
let db, currentType = null, editingId = null;
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(Number(n||0));
const today = () => new Date().toISOString().slice(0,10);
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)+Math.random().toString(36).slice(2));
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const d=req.result; for(const s of STORES) if(!d.objectStoreNames.contains(s)) d.createObjectStore(s,{keyPath:"id"});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
function all(store){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readonly"),r=tx.objectStore(store).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error);});}
function put(store,obj){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).put(obj);tx.oncomplete=()=>resolve(obj);tx.onerror=()=>reject(tx.error);});}
function remove(store,id){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite");tx.objectStore(store).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function replaceAll(store,items){return new Promise((resolve,reject)=>{const tx=db.transaction(store,"readwrite"),os=tx.objectStore(store);os.clear();items.forEach(x=>os.put(x));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.remove("hidden");setTimeout(()=>t.classList.add("hidden"),2600);}
function safe(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function field(name,label,type="text",opts={}){return {name,label,type,...opts};}
const PEN_DEFS = [
 {id:"timbo-gestacion",name:"Timbo gestación",barn:"Nave 1"},
 {id:"timbo-macho",name:"Timbo macho reproductor",barn:"Nave 1"},
 {id:"timbo-lactancia",name:"Timbo lactancia",barn:"Nave 1"},
 {id:"precebo-1",name:"Precebo 1",barn:"Nave 1"},
 {id:"precebo-2",name:"Precebo 2",barn:"Nave 1"},
 {id:"precebo-3",name:"Precebo 3",barn:"Nave 1"},
 {id:"charca-1",name:"Charca 1",barn:"Nave 1"},
 {id:"charca-2",name:"Charca 2",barn:"Nave 1"},
 ...Array.from({length:4},(_,i)=>({id:`n2-c${i+1}`,name:`Nave 2 · Corral ${i+1}`,barn:"Nave 2"})),
 ...Array.from({length:12},(_,i)=>({id:`n3-c${i+1}`,name:`Nave 3 · Corral ${i+1}`,barn:"Nave 3"}))
];
function penLabel(id){return PEN_DEFS.find(p=>p.id===id)?.name || id || "Sin ubicación";}
function birthDateFromAge(ageDays, referenceDate=today()){const d=new Date(referenceDate+"T12:00:00");d.setDate(d.getDate()-Number(ageDays||0));return d.toISOString().slice(0,10);}
const schemas={
 intake:{title:"ingreso de animales por lote",eyebrow:"INGRESO MASIVO",fields:[
  field("category","Tipo de animal","select",{required:true,options:["Engorde","Cerda de cría","Macho reproductor"]}),
  field("totalCount","Cantidad total (para cría/reproductores)","number",{min:1,step:"1"}),
  field("maleCount","Machos de engorde","number",{min:0,step:"1",default:"0"}),
  field("femaleCount","Hembras de engorde","number",{min:0,step:"1",default:"0"}),
  field("otherSex","Sexo (para cría/reproductores)","select",{options:["Hembra","Macho","Sin determinar"]}),
  field("ageDays","Edad actual en días","number",{required:true,min:0,step:"1"}),
  field("lot","Nombre/código del lote","text",{required:true,placeholder:"Ej. ENG-2026-01"}),
  field("penId","Corral o área de destino","select",{required:true,options:PEN_DEFS.map(p=>p.id)}),
  field("weight","Peso actual promedio (kg, opcional)","number",{min:0,step:"0.1"}),
  field("source","Origen/proveedor","text"),field("notes","Notas del ingreso","textarea",{full:true})
 ]},
 animals:{title:"animal",eyebrow:"INVENTARIO",fields:[
  field("tag","ID / Arete","text",{required:true,placeholder:"Ej. OL-0001"}),field("name","Nombre (opcional)","text"),
  field("category","Categoría","select",{required:true,options:["Engorde","Cerda de cría","Macho reproductor","Lechón","Reemplazo","Otro"]}),
  field("sex","Sexo","select",{options:["Hembra","Macho","Sin determinar"]}),field("birthDate","Fecha de nacimiento","date"),
  field("lot","Lote / grupo","text",{placeholder:"Ej. ENG-2026-01"}),field("penId","Ubicación actual","select",{required:true,options:PEN_DEFS.map(p=>p.id)}),field("ageDays","Edad actual (días)","number",{min:0,step:"1"}),field("weight","Peso actual (kg)","number",{min:0,step:"0.1"}),
  field("status","Estado","select",{options:["Activo","En tratamiento","Vendido","Fallecido","Descartado"]}),
  field("source","Origen / proveedor","text"),
  field("castration","Inmunocastración","select",{options:["No aplica / sin registrar","Pendiente de evaluar","Primera dosis registrada","Segunda dosis registrada","Completado / verificado con veterinario"]}),
  field("castrationDate1","Fecha 1.ª dosis","date"),field("castrationDate2","Fecha 2.ª dosis","date"),field("castrationProduct","Producto de inmunocastración","text",{placeholder:"Marca exacta según etiqueta"}),field("castrationNextDate","Próxima aplicación según etiqueta veterinaria","date"),
  field("notes","Notas","textarea",{full:true})
 ]},
 repro:{title:"registro reproductivo",eyebrow:"REPRODUCCIÓN",fields:[
  field("kind","Tipo de registro","select",{required:true,options:["Montaje","Inseminación","Gestación","Parto","Destete"]}),
  field("sowTag","ID / arete de la cerda","text",{required:true}),field("boarTag","ID del verraco / semen","text"),
  field("date","Fecha del evento","date",{required:true,default:today()}),field("dueDate","Fecha probable de parto","date"),
  field("bornAlive","Nacidos vivos","number",{min:0,step:"1"}),field("bornDead","Nacidos muertos","number",{min:0,step:"1"}),
  field("weaned","Destetados","number",{min:0,step:"1"}),field("litterId","ID de camada / lote","text"),
  field("lastHeatDate","Último celo observado","date"),field("serviceDate","Fecha de monta / inseminación efectiva","date"),
  field("pregnancyStatus","Estado de gestación","select",{options:["Pendiente de confirmar","Preñada confirmada","No preñada / repitió celo","Parto realizado"]}),
  field("heatReturnRisk","Riesgo de repetir celo","select",{options:["Sin evaluar","Bajo / seguimiento normal","Requiere vigilancia","Celo repetido observado"]}),
  field("notes","Observaciones","textarea",{full:true})
 ]},
 health:{title:"registro de salud o alimentación",eyebrow:"MANEJO DIARIO",fields:[
  field("kind","Tipo","select",{required:true,options:["Vacuna","Tratamiento","Enfermedad / síntoma","Pesaje","Alimentación","Otro"]}),
  field("date","Fecha","date",{required:true,default:today()}),field("animalTag","ID / arete o lote","text",{required:true,placeholder:"Un animal o un lote"}),
  field("product","Producto / alimento","text"),field("quantity","Cantidad","number",{min:0,step:"0.1"}),
  field("unit","Unidad","select",{options:["kg","g","ml","dosis","bultos","unidades"]}),field("nextDate","Próxima fecha / control","date"),
  field("cost","Costo (COP)","number",{min:0,step:"1"}),field("notes","Detalle, dosis indicada o síntomas","textarea",{full:true})
 ]},
 finance:{title:"movimiento financiero",eyebrow:"FINANZAS",fields:[
  field("kind","Tipo","select",{required:true,options:["Ingreso","Gasto"]}),field("category","Categoría","select",{required:true,options:["Venta de animales","Venta de lechones","Alimento","Medicamentos","Veterinario","Reproducción","Mano de obra","Servicios","Equipos","Transporte","Otro"]}),
  field("date","Fecha","date",{required:true,default:today()}),field("amount","Valor (COP)","number",{required:true,min:0,step:"1"}),
  field("concept","Concepto","text",{required:true}),field("thirdParty","Cliente / proveedor","text"),
  field("quantity","Cantidad (opcional)","number",{min:0,step:"0.1"}),field("notes","Notas / referencia","textarea",{full:true})
 ]},
 reminders:{title:"recordatorio",eyebrow:"ALERTAS",fields:[
  field("title","Actividad","text",{required:true,placeholder:"Ej. Vacunación lote 3"}),field("date","Fecha programada","date",{required:true,default:today()}),
  field("animalTag","Animal / lote (opcional)","text"),field("priority","Prioridad","select",{options:["Normal","Alta","Urgente"]}),
  field("notes","Detalle","textarea",{full:true})
 ]},
 feeders:{title:"comedero",eyebrow:"ALIMENTO",fields:[
  field("name","Nombre / código","text",{required:true,placeholder:"Ej. N2-C1-COM1"}),field("barn","Nave","select",{required:true,options:["Nave 1","Nave 2","Nave 3"]}),
  field("pen","Corral / área","text",{required:true,placeholder:"Ej. N2-C1"}),field("capacityKg","Capacidad útil del comedero (kg)","number",{required:true,min:1,step:"1"}),
  field("pigs","Número de cerdos que alimenta","number",{required:true,min:1,step:"1"}),field("stage","Etapa","select",{options:["Precebo / lechón","Levante","Engorde","Cerdas gestantes","Cerdas lactantes","Reproductores","Mixto"]}),
  field("sex","Sexo del grupo","select",{options:["Mixto","Machos","Hembras"]}),field("kgPerPigDay","Consumo estimado kg/cerdo/día","number",{required:true,min:0.01,step:"0.01"}),
  field("adjustment","Factor de ajuste ambiental (1.00 = sin ajuste)","number",{required:true,min:0.5,step:"0.05",default:"1.00"}),
  field("lastFilled","Última fecha de llenado","date",{default:today()}),field("currentKg","Alimento disponible actualmente (kg)","number",{min:0,step:"0.1"}),
  field("notes","Notas","textarea",{full:true})
 ]},
 feedings:{title:"suministro de alimento",eyebrow:"REGISTRO DE SUMINISTRO",fields:[
  field("feederId","Comedero","select",{required:true,options:[]}),field("date","Fecha y hora/fecha de suministro","date",{required:true,default:today()}),
  field("bags","Bultos añadidos (40 kg cada uno)","number",{required:true,min:0,step:"0.25"}),field("kgAdded","Kilogramos añadidos (si se conoce)","number",{min:0,step:"0.1"}),
  field("remainingKg","Alimento estimado restante después de llenar (kg)","number",{min:0,step:"0.1"}),field("notes","Observaciones","textarea",{full:true})
 ]},
 pens:{title:"capacidad del corral",eyebrow:"CONFIGURACIÓN DE CORRALES",fields:[
  field("name","Nombre del corral/área","text",{required:true}),
  field("capacity","Capacidad máxima (cerdos)","number",{required:true,min:0,step:"1"}),
  field("notes","Notas","textarea",{full:true})
 ]}
};
function fieldHtml(f,val=""){const id="f_"+f.name;let control="";
 if(f.type==="select"){let options=f.options||[];if(f.name==="penId"){control=`<select id="${id}" name="${f.name}" ${f.required?"required":""}>${PEN_DEFS.map(o=>`<option value="${safe(o.id)}" ${String(val)===String(o.id)?"selected":""}>${safe(o.name)}</option>`).join("")}</select>`;}else if(f.name==="feederId"){options=(window._feederOptions||[]).map(x=>({value:x.id,label:x.name+" ("+x.pen+")"}));control=`<select id="${id}" name="${f.name}" ${f.required?"required":""}>${options.map(o=>`<option value="${safe(o.value)}" ${String(val)===String(o.value)?"selected":""}>${safe(o.label)}</option>`).join("")}</select>`;}else control=`<select id="${id}" name="${f.name}" ${f.required?"required":""}>${options.map(o=>`<option value="${safe(o)}" ${String(val)===String(o)?"selected":""}>${safe(f.name==="penId"?penLabel(o):o)}</option>`).join("")}</select>`;}
 else if(f.type==="textarea")control=`<textarea id="${id}" name="${f.name}" ${f.required?"required":""} placeholder="${safe(f.placeholder||"")}">${safe(val)}</textarea>`;
 else control=`<input id="${id}" name="${f.name}" type="${f.type}" value="${safe(val || f.default || "")}" ${f.required?"required":""} ${f.min!==undefined?`min="${f.min}"`:""} ${f.step?`step="${f.step}"`:""} placeholder="${safe(f.placeholder||"")}">`;
 return `<div class="field ${f.full?"full":""}"><label for="${id}">${safe(f.label)}${f.required?" *":""}</label>${control}</div>`;}
async function openForm(type,item=null){if(type==="feedings"){window._feederOptions=await all("feeders");if(!window._feederOptions.length){toast("Primero configura un comedero.");return;}}currentType=type;editingId=item?.id||null;const schema=schemas[type];$("formEyebrow").textContent=schema.eyebrow;$("formTitle").textContent=(item?"Editar ":"Nuevo ")+schema.title;$("formError").textContent="";$("formFields").innerHTML=schema.fields.map(f=>{let value=item?.[f.name]??"";if(type==="animals"&&f.name==="ageDays"&&item?.birthDate){value=Math.max(0,Math.floor((new Date(today()+"T12:00:00")-new Date(item.birthDate+"T12:00:00"))/86400000));}return fieldHtml(f,value);}).join("");$("recordDialog").showModal();}
function closeForm(){$("recordDialog").close();currentType=null;editingId=null;}
$("closeDialog").onclick=closeForm;$("cancelForm").onclick=closeForm;
$("recordForm").addEventListener("submit",async e=>{e.preventDefault();if(!currentType)return;const form=new FormData(e.currentTarget),obj={id:editingId||uid(),updatedAt:new Date().toISOString(),createdAt:editingId?undefined:new Date().toISOString()};for(const [k,v] of form.entries()){const schema=schemas[currentType].fields.find(f=>f.name===k);obj[k]=schema?.type==="number"?(v===""?0:Number(v)):v.trim();}
 if(currentType==="intake"){
   const existing=await all("animals");
   const isFattening=obj.category==="Engorde";
   const maleCount=isFattening?Number(obj.maleCount||0):(obj.category==="Macho reproductor"?Number(obj.totalCount||0):0);
   const femaleCount=isFattening?Number(obj.femaleCount||0):(obj.category==="Cerda de cría"?Number(obj.totalCount||0):0);
   const total=isFattening?maleCount+femaleCount:Number(obj.totalCount||0);
   if(total<1){$("formError").textContent=isFattening?"Indica al menos un macho o una hembra.":"La cantidad total debe ser al menos 1.";return;}
   if(!isFattening && !Number.isInteger(total)){$("formError").textContent="La cantidad debe ser un número entero.";return;}
   if(isFattening && (!Number.isInteger(maleCount)||!Number.isInteger(femaleCount))){$("formError").textContent="Las cantidades de machos y hembras deben ser números enteros.";return;}
   const pens=await all("pens"),pen=pens.find(p=>p.id===obj.penId);
   const occupied=existing.filter(a=>a.penId===obj.penId&&!["Vendido","Fallecido","Descartado"].includes(a.status)).length;
   if(pen && Number(pen.capacity)>0 && occupied+total>Number(pen.capacity)){$("formError").textContent=`El área ${pen.name} tiene ${occupied}/${pen.capacity} ocupados. No caben ${total} animales nuevos.`;return;}
   const prefix=isFattening?"ENG":obj.category==="Cerda de cría"?"CRIA":"MACHO";
   let made=0;
   const makeAnimal=async(sex,idx)=>{let n=existing.length+made+1;let tag=`${prefix}-${today().replaceAll("-","")}-${String(n).padStart(4,"0")}`;while(existing.some(a=>a.tag===tag)||(await all("animals")).some(a=>a.tag===tag))tag=tag+"X";
     const birthDate=birthDateFromAge(obj.ageDays);
     await put("animals",{id:uid(),tag,name:"",category:obj.category,sex,birthDate,ageDays:Number(obj.ageDays),lot:obj.lot,penId:obj.penId,weight:Number(obj.weight||0),status:"Activo",source:obj.source||"",notes:obj.notes||"",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),intakeGroup:obj.lot});
     made++;
   };
   if(isFattening){for(let i=0;i<maleCount;i++)await makeAnimal("Macho",i);for(let i=0;i<femaleCount;i++)await makeAnimal("Hembra",i);}
   else {const fixedSex=obj.category==="Macho reproductor"?"Macho":obj.category==="Cerda de cría"?"Hembra":(obj.otherSex||"Sin determinar");for(let i=0;i<total;i++)await makeAnimal(fixedSex,i);}
   closeForm();await refreshAll();toast(`Ingreso registrado: ${made} animales individuales en el lote ${obj.lot}.`);return;
 }
 if(currentType==="animals"){const animals=await all("animals");if(animals.some(a=>a.tag.toLowerCase()===String(obj.tag).toLowerCase()&&a.id!==editingId)){$("formError").textContent="Ese ID / arete ya existe. Usa un identificador único.";return;}}
 if(editingId){const existing=(await all(currentType)).find(x=>x.id===editingId);obj.createdAt=existing?.createdAt||obj.updatedAt;if(existing){obj={...existing,...obj};}}
 if(currentType==="animals" && obj.ageDays!==undefined && obj.ageDays!=="" && Number(obj.ageDays)>=0)obj.birthDate=birthDateFromAge(Number(obj.ageDays));
 if(currentType==="feeders"){obj.currentKg=Number(obj.currentKg||obj.capacityKg||0);obj.adjustment=Number(obj.adjustment||1);}
 // Automatic reproductive calendar: 18–24 day heat-return window and ~114-day gestation.
 if(currentType==="repro"){
   const serviceDate=obj.serviceDate || ((["Montaje","Inseminación"].includes(obj.kind)) ? obj.date : "");
   if(serviceDate){
     obj.serviceDate=serviceDate;
     if(!obj.dueDate && !["No preñada / repitió celo","Parto realizado"].includes(obj.pregnancyStatus)) obj.dueDate=addDaysISO(serviceDate,114);
     obj.heatCheckStart=addDaysISO(serviceDate,18);
     obj.heatCheckEnd=addDaysISO(serviceDate,24);
     obj.automaticCalendar=true;
   }
 }
 const savedType=currentType;await put(currentType,obj);
 if(savedType==="repro"){
   // Remove old automatic reproductive reminders tied to this record, then rebuild based on current status.
   const allReminders=await all("reminders");
   for(const rem of allReminders.filter(r=>r.sourceRecordId===obj.id && r.autoGenerated)) await remove("reminders",rem.id);
   const serviceDate=obj.serviceDate || ((["Montaje","Inseminación"].includes(obj.kind)) ? obj.date : "");
   if(serviceDate && !["No preñada / repitió celo","Parto realizado"].includes(obj.pregnancyStatus)){
     const returnStart=addDaysISO(serviceDate,18),returnEnd=addDaysISO(serviceDate,24);
     await put("reminders",{id:uid(),title:`Revisar retorno a celo: cerda ${obj.sowTag}`,date:returnStart,animalTag:obj.sowTag,priority:"Alta",notes:`Ventana orientativa de retorno a celo: ${returnStart} a ${returnEnd}. Observar signos y registrar resultado.`,done:false,autoGenerated:true,sourceRecordId:obj.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
   }
   if(serviceDate && obj.pregnancyStatus==="Preñada confirmada" && obj.dueDate){
     await put("reminders",{id:uid(),title:`Parto estimado: cerda ${obj.sowTag}`,date:obj.dueDate,animalTag:obj.sowTag,priority:"Alta",notes:`Fecha estimada calculada desde el servicio (${serviceDate}) a 114 días. Vigilar y confirmar con el personal responsable.`,done:false,autoGenerated:true,sourceRecordId:obj.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
   } else if(serviceDate && !["No preñada / repitió celo","Parto realizado"].includes(obj.pregnancyStatus) && obj.dueDate){
     await put("reminders",{id:uid(),title:`Confirmar gestación / parto estimado: cerda ${obj.sowTag}`,date:obj.dueDate,animalTag:obj.sowTag,priority:"Normal",notes:`Fecha estimada de parto (${obj.dueDate}) basada en 114 días desde el servicio. Confirma gestación; si no está preñada, registra retorno a celo.`,done:false,autoGenerated:true,sourceRecordId:obj.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
   }
 }

 // Alertas sanitarias: solo se generan a partir de una fecha explícitamente registrada.
 if(["animals","health"].includes(savedType)){
   const allReminders=await all("reminders");
   for(const rem of allReminders.filter(r=>r.sourceRecordId===obj.id && r.autoGenerated && ["inmunocastracion","salud-control"].includes(r.autoKind))) await remove("reminders",rem.id);
   if(savedType==="animals" && obj.castrationNextDate && !["Vendido","Fallecido","Descartado"].includes(obj.status)){
     await put("reminders",{id:uid(),title:`Revisar inmunocastración: ${obj.tag}`,date:obj.castrationNextDate,animalTag:obj.tag,priority:"Alta",notes:`Seguimiento según la etiqueta del producto y el plan veterinario. Producto registrado: ${obj.castrationProduct||"no especificado"}. La fecha fue indicada por el responsable; verificar antes de aplicar.`,done:false,autoGenerated:true,autoKind:"inmunocastracion",sourceRecordId:obj.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
   }
   if(savedType==="health" && obj.nextDate){
     await put("reminders",{id:uid(),title:`Control sanitario: ${obj.animalTag}`,date:obj.nextDate,animalTag:obj.animalTag,priority:"Normal",notes:`Seguimiento derivado del registro de ${obj.kind||"salud"}. ${obj.product?"Producto: "+obj.product+". ":""}Verificar indicaciones veterinarias antes de actuar.`,done:false,autoGenerated:true,autoKind:"salud-control",sourceRecordId:obj.id,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
   }
 }
 if(savedType==="feedings"){const feeder=(await all("feeders")).find(x=>x.id===obj.feederId);if(feeder){const added=Number(obj.kgAdded||Number(obj.bags||0)*40);feeder.currentKg=Number(obj.remainingKg||0)+added;feeder.lastFilled=obj.date;feeder.updatedAt=new Date().toISOString();await put("feeders",feeder);}}
 closeForm();await refreshAll();toast("Registro guardado correctamente.");});
async function editRecord(store,id){const item=(await all(store)).find(x=>x.id===id);if(item)openForm(store,item);}
async function deleteRecord(store,id){if(!confirm("¿Seguro que deseas eliminar este registro?"))return;await remove(store,id);await refreshAll();toast("Registro eliminado.");}
function card(title,meta,detail,actions="",tag=""){return `<article class="record-card"><div><h3>${safe(title)} ${tag?`<span class="tag">${safe(tag)}</span>`:""}</h3><p>${safe(meta)}</p>${detail?`<p>${safe(detail)}</p>`:""}</div><div class="record-actions">${actions}</div></article>`;}
function actions(store,id,extra=""){return `${extra}<button class="mini-btn" data-edit="${store}" data-id="${id}">Editar</button><button class="mini-btn" data-delete="${store}" data-id="${id}">Eliminar</button>`;}
function filterText(items,query,fields){const q=(query||"").trim().toLowerCase();return q?items.filter(x=>fields.some(f=>String(x[f]??"").toLowerCase().includes(q))):items;}
async function renderAnimals(){
 let xs=await all("animals");
 xs.sort((a,b)=>String(a.tag).localeCompare(String(b.tag)));
 xs=filterText(xs,$("animalSearch").value,["tag","name","lot","penId","category"]);
 const cat=$("animalFilter").value;if(cat)xs=xs.filter(x=>x.category===cat);
 $("animalsBody").innerHTML=xs.map(a=>{
  const age=a.birthDate ? Math.max(0,Math.floor((new Date(today()+"T12:00:00")-new Date(a.birthDate+"T12:00:00"))/86400000)) :
   (a.ageDays!==undefined && a.ageDays!==null && a.ageDays!=="" ? Number(a.ageDays) : null);
  return `<tr><td><b>${safe(a.tag)}</b>${a.name?`<br><small>${safe(a.name)}</small>`:""}</td><td>${safe(a.category)}</td><td>${age===null?"—":`${age} días`}</td><td>${safe(a.lot||"—")}</td><td>${safe(penLabel(a.penId))}</td><td>${safe(a.sex||"—")}</td><td>${a.weight?`${safe(a.weight)} kg`:"—"}</td><td><span class="tag ${["Fallecido","Vendido","Descartado"].includes(a.status)?"red":a.status==="En tratamiento"?"warn":""}">${safe(a.status||"Activo")}</span></td><td><div class="row-actions"><button class="mini-btn" data-edit="animals" data-id="${a.id}">Editar</button><button class="mini-btn" data-delete="animals" data-id="${a.id}">×</button></div></td></tr>`;
 }).join("");
 $("animalEmpty").classList.toggle("hidden",xs.length>0);
 $("animalsBody").closest(".table-wrap").classList.toggle("hidden",xs.length===0);
}
async function renderGeneric(store,containerId,searchId,filterId,searchFields,titleFn,metaFn,detailFn,filterField=null){let xs=await all(store);xs.sort((a,b)=>String(b.date||b.updatedAt||"").localeCompare(String(a.date||a.updatedAt||"")));if(searchId)xs=filterText(xs,$(searchId).value,searchFields);if(filterId&&$(filterId).value)xs=xs.filter(x=>filterField?x[filterField]===$(filterId).value:x.kind===$(filterId).value);const el=$(containerId);el.classList.toggle("empty",xs.length===0);el.innerHTML=xs.length?xs.map(x=>card(titleFn(x),metaFn(x),detailFn(x),actions(store,x.id),x.date||"")).join(""):"No hay registros que coincidan con la búsqueda.";}
async function renderReminders(){let xs=await all("reminders");xs.sort((a,b)=>String(a.date).localeCompare(String(b.date)));const filter=$("reminderFilter").value;if(filter==="pending")xs=xs.filter(x=>!x.done);if(filter==="done")xs=xs.filter(x=>x.done);$("reminderList").classList.toggle("empty",xs.length===0);$("reminderList").innerHTML=xs.length?xs.map(x=>card(x.title,`${x.date||"Sin fecha"} · ${x.animalTag||"Sin animal/lote"}`,x.notes,`${x.done?"":`<button class="mini-btn" data-done="${x.id}">Completar</button>`}${actions("reminders",x.id)}`,x.done?"Completado":(x.priority||"Normal"))).join(""):"No hay recordatorios para mostrar.";}
async function refreshDashboard(){const [animals,repro,reminders,finance]=await Promise.all([all("animals"),all("repro"),all("reminders"),all("finance")]);$("statAnimals").textContent=animals.filter(a=>!["Fallecido","Vendido","Descartado"].includes(a.status)).length.toLocaleString("es-CO");$("statPreg").textContent=repro.filter(x=>x.kind==="Gestación").length.toLocaleString("es-CO");$("statAlerts").textContent=reminders.filter(x=>!x.done).length.toLocaleString("es-CO");const inc=finance.filter(x=>x.kind==="Ingreso").reduce((s,x)=>s+Number(x.amount||0),0),exp=finance.filter(x=>x.kind==="Gasto").reduce((s,x)=>s+Number(x.amount||0),0);$("statBalance").textContent=money(inc-exp);const upcoming=reminders.filter(x=>!x.done).sort((a,b)=>String(a.date).localeCompare(String(b.date))).slice(0,5);$("upcomingList").classList.toggle("empty",!upcoming.length);$("upcomingList").innerHTML=upcoming.length?upcoming.map(x=>`<div class="record-card"><div><h3>${safe(x.title)}</h3><p>${safe(x.date)} · ${safe(x.animalTag||"Sin animal/lote")}</p></div><span class="tag ${x.date<today()?"red":x.priority==="Urgente"?"warn":""}">${x.date<today()?"Vencido":safe(x.priority||"Normal")}</span></div>`).join(""):"Todavía no hay recordatorios pendientes.";const recent=[];for(const s of STORES){for(const x of await all(s))recent.push({...x,_store:s});}recent.sort((a,b)=>String(b.updatedAt||b.createdAt||"").localeCompare(String(a.updatedAt||a.createdAt||"")));$("recentList").classList.toggle("empty",!recent.length);$("recentList").innerHTML=recent.length?recent.slice(0,6).map(x=>`<div class="record-card"><div><h3>${safe(x.tag||x.title||x.concept||x.sowTag||x.animalTag||x.kind||"Registro")}</h3><p>${safe(({animals:"Inventario",repro:"Reproducción",health:"Salud y alimentación",finance:"Finanzas",reminders:"Recordatorio"})[x._store])} · ${safe(x.date||x.updatedAt?.slice(0,10)||"")}</p></div><span class="tag">${safe(x._store)}</span></div>`).join(""):"Aún no hay actividad.";}
async function renderFinance(){const xs=await all("finance");const inc=xs.filter(x=>x.kind==="Ingreso").reduce((s,x)=>s+Number(x.amount||0),0),exp=xs.filter(x=>x.kind==="Gasto").reduce((s,x)=>s+Number(x.amount||0),0);$("sumIncome").textContent=money(inc);$("sumExpense").textContent=money(exp);$("sumNet").textContent=money(inc-exp);await renderGeneric("finance","financeList","financeSearch","financeFilter",["concept","category","thirdParty","notes"],x=>`${x.concept} · ${money(x.amount)}`,x=>`${x.kind} · ${x.category} · ${x.date}`,x=>x.thirdParty?`Tercero: ${x.thirdParty}`:x.notes||"",null);}

async function renderFeeders(){
 const feeders=await all("feeders"),animals=await all("animals");window._feederOptions=feeders;
 const totalDaily=feeders.reduce((s,f)=>s+Number(f.pigs||0)*Number(f.kgPerPigDay||0)*Number(f.adjustment||1),0);
 $("feedDaily").textContent=totalDaily.toFixed(1)+" kg";$("feedBags").textContent=(totalDaily/40).toFixed(2);$("feederCount").textContent=feeders.length;
 const el=$("feederList");el.classList.toggle("empty",!feeders.length);
 el.innerHTML=feeders.length?feeders.map(f=>{const daily=Number(f.pigs||0)*Number(f.kgPerPigDay||0)*Number(f.adjustment||1);const stock=Number(f.currentKg||0);const days=daily>0?stock/daily:0;const bagsDay=daily/40;return card(f.name,`${f.barn} · ${f.pen} · ${f.pigs} cerdos · ${f.stage||"Etapa sin indicar"}`,`Capacidad ${f.capacityKg} kg · Disponible ${stock.toFixed(1)} kg · Consumo estimado ${daily.toFixed(1)} kg/día · ${bagsDay.toFixed(2)} bultos/día · El alimento actual duraría aprox. ${days.toFixed(1)} días · Factor ${Number(f.adjustment||1).toFixed(2)}`,actions("feeders",f.id),f.sex||"Mixto");}).join(""):"No hay comederos configurados.";
 const feedings=await all("feedings");feedings.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 $("feedingList").classList.toggle("empty",!feedings.length);$("feedingList").innerHTML=feedings.length?feedings.map(x=>{const f=feeders.find(z=>z.id===x.feederId);return card(f?.name||"Comedero eliminado",`${x.date} · ${x.bags||0} bultos = ${(Number(x.kgAdded)||Number(x.bags||0)*40).toFixed(1)} kg`,x.notes||`Restante anotado: ${x.remainingKg||0} kg`,actions("feedings",x.id),"Suministro");}).join(""):"Aún no hay suministros registrados.";
}
async function renderPenOccupancy(){
 const animals=(await all("animals")).filter(a=>!["Vendido","Fallecido","Descartado"].includes(a.status));
 const pens=await all("pens");const counts={};animals.forEach(a=>{if(a.penId)counts[a.penId]=(counts[a.penId]||0)+1;});
 const warnings=[];
 const manager=$("penManagement");
 if(manager){manager.innerHTML=pens.map(p=>{const n=counts[p.id]||0,cap=Number(p.capacity||0),over=cap>0&&n>cap;return `<div class="pen-manage-row"><div class="pen-manage-name"><b>${safe(p.name)}</b><small>${safe(p.barn||"")}</small></div><div class="pen-manage-count"><b>${n}${cap>0?"/"+cap:""}</b><small>ocupados${cap>0?` · ${Math.max(0,cap-n)} disponibles`:" · capacidad sin definir"}</small></div><button class="mini-btn" data-edit="pens" data-id="${p.id}">Capacidad</button>${over?'<span class="tag red">Sobre capacidad</span>':""}</div>`;}).join("");}
 for(const p of pens){const n=counts[p.id]||0,cap=Number(p.capacity||0);if(cap>0&&n>cap)warnings.push(`${p.name}: ${n}/${cap}, supera capacidad.`);}
 for(let i=1;i<=4;i++){const e=document.querySelector(`[data-pen="n2c${i}"]`);if(e){const p=pens.find(p=>p.id===`n2-c${i}`);e.textContent=`${counts[`n2-c${i}`]||0}/${p?.capacity||50} registrados`;}}
 for(let i=1;i<=12;i++){const e=document.querySelector(`[data-pen="n3c${i}"]`);if(e){const p=pens.find(p=>p.id===`n3-c${i}`);e.textContent=`${counts[`n3-c${i}`]||0}/${p?.capacity||40} registrados`;}}
 $("penWarnings").classList.toggle("empty",!warnings.length);
 $("penWarnings").innerHTML=warnings.length?warnings.map(s=>`<p class="negative">${safe(s)}</p>`).join(""):"No hay corrales por encima de la capacidad configurada.";
}

function addDaysISO(iso,days){if(!iso)return "";const d=new Date(iso+"T12:00:00");if(Number.isNaN(d.getTime()))return "";d.setDate(d.getDate()+days);return d.toISOString().slice(0,10);}
function daysUntil(iso){if(!iso)return null;const a=new Date(today()+"T12:00:00"),b=new Date(iso+"T12:00:00");return Math.round((b-a)/86400000);}
function reproMeta(x){
 const bits=[];if(x.date)bits.push(x.date);if(x.serviceDate)bits.push("Servicio: "+x.serviceDate);
 const service=x.serviceDate||(x.kind==="Gestación"?x.date:"");
 const due=x.dueDate||(service?addDaysISO(service,114):"");
 if(due){const d=daysUntil(due);bits.push("Parto estimado: "+due+(d===null?"":d<0?` · ${Math.abs(d)} días después de la fecha estimada`:` · faltan ${d} días`));}
 if(service){bits.push("Vigilancia automática de retorno a celo: "+addDaysISO(service,18)+" a "+addDaysISO(service,24));}
 if(x.pregnancyStatus)bits.push("Estado: "+x.pregnancyStatus);
 if(x.lastHeatDate)bits.push("Último celo: "+x.lastHeatDate);
 if(x.heatReturnRisk&&x.heatReturnRisk!=="Sin evaluar")bits.push("Seguimiento de celo: "+x.heatReturnRisk);
 return bits.join(" · ");
}
async function refreshAll(){await Promise.all([renderAnimals(),renderGeneric("repro","reproList","reproSearch","reproFilter",["sowTag","boarTag","litterId","notes"],x=>`${x.kind} · Cerda ${x.sowTag}`,x=>reproMeta(x),x=>[`Nacidos vivos: ${x.bornAlive||0}`,`Muertos: ${x.bornDead||0}`,`Destetados: ${x.weaned||0}`,x.notes].filter(Boolean).join(" · ")),renderGeneric("health","healthList","healthSearch","healthFilter",["animalTag","kind","product","notes"],x=>`${x.kind} · ${x.animalTag}`,x=>`${x.date||""}${x.product?" · "+x.product:""}`,x=>[x.quantity?`${x.quantity} ${x.unit||""}`:"",x.cost?`Costo ${money(x.cost)}`:"",x.nextDate?`Próximo control: ${x.nextDate}`:"",x.notes].filter(Boolean).join(" · ")),renderFinance(),renderReminders(),renderFeeders(),renderPenOccupancy(),renderPenOverview(),refreshDashboard()]);}

async function renderPenOverview(){
 const pens=await all("pens"),animals=await all("animals");
 const el=$("penOverview");if(!el)return;
 const orderedPens=PEN_DEFS.map(def=>pens.find(p=>p.id===def.id)||({...def,capacity:0}));el.innerHTML=orderedPens.map(p=>{const active=animals.filter(a=>a.penId===p.id&&!["Vendido","Fallecido","Descartado"].includes(a.status));const males=active.filter(a=>a.sex==="Macho").length,females=active.filter(a=>a.sex==="Hembra").length;const capacity=Number(p.capacity||0),pct=capacity?Math.min(100,active.length/capacity*100):0;return `<article class="pen-overview-card"><div class="pen-overview-head"><div><h3>${safe(p.name)}</h3><small>${safe(p.barn)}</small></div><span class="tag">${active.length}${capacity?` / ${capacity}`:" registrados"}</span></div><div class="capacity-bar"><span style="width:${pct}%"></span></div><div class="pen-overview-foot"><span>♂ ${males} · ♀ ${females}</span><span>${capacity?`${Math.max(0,capacity-active.length)} plazas libres`:"Capacidad sin configurar"}</span></div><button class="mini-btn" data-capacity="${p.id}">Editar capacidad</button></article>`;}).join("");
}
async function configurePens(){
 let pens=await all("pens");
 if(!pens.length){pens=PEN_DEFS.map(p=>({...p,capacity:0}));for(const p of pens)await put("pens",p);}
 const text=pens.map(p=>`${p.name}: ${p.capacity||0}`).join("\n");
 const input=prompt("Configura la capacidad máxima actual de cada área. Escribe una capacidad por línea en el orden mostrado:\n"+text+"\n\nPara cambiarla, introduce solo el número de capacidad para el área seleccionada desde el botón de cada tarjeta.");
 if(input===null)return;
 toast("Para cambiar una capacidad, usa el botón Editar capacidad de cada área.");
}
document.addEventListener("click",async e=>{
 const cap=e.target.closest("[data-capacity]");if(!cap)return;
 let pens=await all("pens");if(!pens.length){pens=PEN_DEFS.map(p=>({...p,capacity:0}));for(const p of pens)await put("pens",p);}
 const pen=pens.find(p=>p.id===cap.dataset.capacity);if(!pen)return;
 const value=prompt(`Capacidad máxima real para ${pen.name} (número de animales):`,String(pen.capacity||""));
 if(value===null)return;const n=Number(value);if(!Number.isInteger(n)||n<0){alert("Escribe un número entero igual o mayor que cero.");return;}
 pen.capacity=n;pen.updatedAt=new Date().toISOString();await put("pens",pen);await renderPenOverview();toast("Capacidad actualizada.");
});
$("editPensBtn")?.addEventListener("click",async()=>{let pens=await all("pens");if(!pens.length){for(const p of PEN_DEFS){const defaultCapacity=p.id.startsWith("n2-c")?50:(p.id.startsWith("n3-c")?40:0);await put("pens",{...p,capacity:defaultCapacity,notes:""});}}await renderPenOverview();toast("Edita cada capacidad desde su tarjeta.");});
function showPage(name){document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+name).classList.remove("hidden");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.page===name));}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>{showPage(b.dataset.go);}));
$("newAnimalBtn").onclick=()=>openForm("animals");$("newIntakeBtn").onclick=()=>openForm("intake");$("newReproBtn").onclick=()=>openForm("repro");$("newHealthBtn").onclick=()=>openForm("health");$("newFinanceBtn").onclick=()=>openForm("finance");$("newReminderBtn").onclick=()=>openForm("reminders");$("newFeederBtn").onclick=()=>openForm("feeders");$("newFeedingBtn").onclick=()=>openForm("feedings");
["animalSearch","animalFilter","reproSearch","reproFilter","healthSearch","healthFilter","financeSearch","financeFilter","reminderFilter"].forEach(id=>$(id).addEventListener("input",refreshAll));
document.addEventListener("click",async e=>{const edit=e.target.closest("[data-edit]");if(edit){await editRecord(edit.dataset.edit,edit.dataset.id);return;}const del=e.target.closest("[data-delete]");if(del){await deleteRecord(del.dataset.delete,del.dataset.id);return;}const done=e.target.closest("[data-done]");if(done){const item=(await all("reminders")).find(x=>x.id===done.dataset.done);if(item){item.done=true;item.completedAt=new Date().toISOString();await put("reminders",item);await refreshAll();toast("Recordatorio completado.");}}});
function download(name,content,type){const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
async function exportJSON(){const data={app:"Porcícola El Olivo",schemaVersion:1,exportedAt:new Date().toISOString(),stores:{}};for(const s of STORES)data.stores[s]=await all(s);download(`el-olivo-copia-${today()}.json`,JSON.stringify(data,null,2),"application/json");}
$("exportBtn").onclick=exportJSON;$("backupBtn").onclick=exportJSON;
$("exportCsvBtn").onclick=async()=>{const xs=await all("animals"),cols=["tag","name","category","sex","birthDate","lot","weight","status","source","notes"],csv=[cols.join(","),...xs.map(x=>cols.map(c=>`"${String(x[c]??"").replace(/"/g,'""')}"`).join(","))].join("\r\n");download(`inventario-el-olivo-${today()}.csv`,"\ufeff"+csv,"text/csv;charset=utf-8");};
$("importFile").addEventListener("change",async e=>{const file=e.target.files[0];if(!file)return;try{const data=JSON.parse(await file.text());if(!data.stores||!STORES.every(s=>Array.isArray(data.stores[s])))throw new Error("El archivo no tiene el formato esperado.");if(!confirm("Esto reemplazará todos los registros locales actuales. ¿Continuar?"))return;for(const s of STORES)await replaceAll(s,data.stores[s]);await refreshAll();$("importStatus").textContent="Copia restaurada correctamente.";toast("Copia restaurada.");}catch(err){$("importStatus").textContent="No se pudo importar: "+err.message;}finally{e.target.value="";}});
$("clearBtn").onclick=async()=>{if(!confirm("¿Borrar permanentemente todos los registros locales de este navegador? Primero descarga una copia si necesitas conservarlos."))return;if(!confirm("Confirmación final: se borrarán animales, reproducción, salud, finanzas y recordatorios."))return;for(const s of STORES)await replaceAll(s,[]);await refreshAll();toast("Datos locales borrados.");};
(async()=>{try{db=await openDB();if(!(await all("pens")).length){for(const p of PEN_DEFS){const defaultCapacity=p.id.startsWith("n2-c")?50:(p.id.startsWith("n3-c")?40:0);await put("pens",{...p,capacity:defaultCapacity,notes:""});}}await refreshAll();if("serviceWorker"in navigator && location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});}catch(err){alert("No se pudo iniciar la base de datos local. Prueba en Safari actualizado o abre la app desde un sitio HTTPS. Detalle: "+err.message);}})();