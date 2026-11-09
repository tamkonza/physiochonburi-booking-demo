// Simple Chonburi physiotherapy booking web app.
// Set SPREADSHEET_ID below, then deploy as a web app (execute as you, access: anyone).
const SPREADSHEET_ID = '1XsudYWjEgZ-QKmxpBixFwC1aKsETImlIyi5JhOodEtY';
const SHEET_NAME = 'SimpleAppointments';
const HEADERS = ['id','createdAt','name','nationalId','age','phone','address','symptoms','service','date','time','pin','status','changeCount'];
const TIME_OPTIONS = ['09:00','09:30','10:00','10:30','11:00','13:00','13:30','14:00','14:30','15:00'].map(t => '<option>'+t+'</option>').join('');

function doGet() {
  ensureSheet_();
  return HtmlService.createHtmlOutput(PAGE).setTitle('จองนัดกายภาพบำบัด | เทศบาลเมืองชลบุรี').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function bookAppointment(form) {
  form = form || {};
  ['name','nationalId','age','phone','address','symptoms','service','date','time'].forEach(k => {
    if (!String(form[k] || '').trim()) throw new Error('กรุณากรอกข้อมูลให้ครบ');
  });
  if (!/^\d{13}$/.test(String(form.nationalId))) throw new Error('เลขบัตรประชาชนต้องมี 13 หลัก');
  if (!['clinic','community'].includes(form.service)) throw new Error('ประเภทบริการไม่ถูกต้อง');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date) || !/^\d{2}:\d{2}$/.test(form.time)) throw new Error('วันหรือเวลาไม่ถูกต้อง');
  const sh = ensureSheet_();
  const rows = sh.getDataRange().getValues();
  const duplicate = rows.slice(1).some(r => String(r[9]) === form.date && String(r[10]) === form.time && r[8] === form.service && r[12] === 'CONFIRMED');
  if (duplicate) throw new Error('เวลานี้มีผู้จองแล้ว กรุณาเลือกเวลาอื่น');
  const id = 'PT-' + Utilities.getUuid().replace(/-/g,'').slice(0,10).toUpperCase();
  const pin = String(Math.floor(100000 + Math.random()*900000));
  sh.appendRow([id,new Date(),safe_(form.name,120),String(form.nationalId),Number(form.age),safe_(form.phone,30),safe_(form.address,400),safe_(form.symptoms,1000),form.service,form.date,form.time,pin,'CONFIRMED',0]);
  return {id:id,pin:pin,name:safe_(form.name,120),service:form.service,date:form.date,time:form.time,status:'CONFIRMED',changeCount:0};
}

function findAppointment(id, pin) {
  const sh = ensureSheet_(), values = sh.getDataRange().getValues();
  const row = values.slice(1).find(r => String(r[0]) === String(id || '').trim().toUpperCase() && String(r[11]) === String(pin || '').trim());
  if (!row) throw new Error('รหัสนัดหรือ PIN ไม่ถูกต้อง');
  return {id:row[0],name:row[2],service:row[8],date:row[9],time:row[10],status:row[12],changeCount:Number(row[13]||0)};
}

function cancelAppointment(id, pin) {
  const sh = ensureSheet_(), values = sh.getDataRange().getValues();
  const i = values.findIndex((r,n) => n > 0 && String(r[0]) === String(id || '').trim().toUpperCase() && String(r[11]) === String(pin || '').trim());
  if (i < 1) throw new Error('รหัสนัดหรือ PIN ไม่ถูกต้อง');
  const r = values[i];
  if (r[12] !== 'CONFIRMED' || Number(r[13]||0) >= 1) throw new Error('นัดนี้ยกเลิกหรือใช้สิทธิ์จัดการไปแล้ว');
  sh.getRange(i+1,13).setValue('CANCELLED'); sh.getRange(i+1,14).setValue(1);
  return {cancelled:true};
}

function ensureSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  else if (sh.getRange(1,1).getDisplayValue() !== 'id') sh.insertRowBefore(1).getRange(1,1,1,HEADERS.length).setValues([HEADERS]);
  sh.setFrozenRows(1);
  return sh;
}
function safe_(v,n) { return String(v == null ? '' : v).trim().slice(0,n).replace(/^[=+\-@]/, "'"); }

const PAGE = `<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>จองนัดกายภาพบำบัด</title>
<style>body{font:16px system-ui,sans-serif;background:#f2f7f6;color:#173b35;margin:0;padding:20px}.box{max-width:620px;margin:20px auto;background:white;padding:24px;border-radius:18px;box-shadow:0 8px 28px #183b3518}h1{font-size:24px}label{display:block;margin:12px 0}input,select,textarea,button{box-sizing:border-box;width:100%;padding:12px;border:1px solid #ccd8d5;border-radius:9px;font:inherit}button{background:#117b68;color:#fff;border:0;margin-top:12px;cursor:pointer}section{border-top:1px solid #e1e9e7;margin-top:24px;padding-top:12px}.msg{white-space:pre-line;background:#eef7f4;padding:14px;border-radius:10px;margin-top:16px}.small{color:#60736f;font-size:14px}</style>
<div class="box"><h1>ระบบนัดหมายกายภาพบำบัด</h1><p>ศูนย์บริการสาธารณสุข เทศบาลเมืองชลบุรี</p><form id="book">
<label>ชื่อ-นามสกุล<input name="name" required></label><label>เลขประจำตัวประชาชน 13 หลัก<input name="nationalId" inputmode="numeric" maxlength="13" required></label><label>อายุ<input name="age" type="number" min="1" max="120" required></label><label>เบอร์โทรศัพท์<input name="phone" required></label><label>ที่อยู่ในเขตเทศบาล<input name="address" required></label><label>อาการเบื้องต้น<textarea name="symptoms" required></textarea></label><label>ประเภทนัด<select name="service"><option value="clinic">กายภาพที่ศูนย์บริการสาธารณสุข (OPD)</option><option value="community">กายภาพบำบัดในชุมชน</option></select></label><label>วันที่<input name="date" type="date" required></label><label>เวลา<select name="time">${TIME_OPTIONS}</select></label><button>จองนัดหมาย</button></form><div id="result"></div>
<section><h2>ตรวจสอบหรือยกเลิกนัด</h2><p class="small">ใช้รหัสนัดและ PIN ที่ได้รับหลังจอง</p><label>รหัสนัด<input id="id"></label><label>PIN<input id="pin" inputmode="numeric"></label><button id="lookup">ตรวจสอบนัด</button><button id="cancel">ยกเลิกนัด (ใช้สิทธิ์จัดการ 1 ครั้ง)</button></section></div>
<script>const $=s=>document.querySelector(s),out=$('#result');const show=x=>out.innerHTML='<div class="msg">'+x+'</div>';$('#book').onsubmit=e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.target));show('กำลังบันทึก…');google.script.run.withSuccessHandler(a=>{ $('#id').value=a.id;$('#pin').value=a.pin;show('จองสำเร็จ\\nรหัสนัด: '+a.id+'\\nPIN: '+a.pin+'\\nวันที่ '+a.date+' เวลา '+a.time+'\\nกรุณาจดรหัสและ PIN ไว้');e.target.reset()}).withFailureHandler(x=>show(x.message)).bookAppointment(f)};$('#lookup').onclick=()=>google.script.run.withSuccessHandler(a=>show('พบรายการ: '+a.name+'\\n'+a.date+' เวลา '+a.time+'\\nสถานะ: '+a.status)).withFailureHandler(x=>show(x.message)).findAppointment($('#id').value,$('#pin').value);$('#cancel').onclick=()=>{if(!confirm('ยืนยันยกเลิกนัด?'))return;google.script.run.withSuccessHandler(()=>show('ยกเลิกนัดแล้ว')).withFailureHandler(x=>show(x.message)).cancelAppointment($('#id').value,$('#pin').value)};</script></html>`;
