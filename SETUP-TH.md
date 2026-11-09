# ตั้งค่า backend (ต้นแบบทดสอบ)

## ข้อจำกัด

ไฟล์ `Code.gs` เป็น Google Apps Script backend ที่ใช้ Google Sheet เป็นฐานข้อมูล ยังต้อง deploy และใส่ URL ในหน้าเว็บก่อนจึงเรียกได้ การเปิด Web App แบบสาธารณะมีความเสี่ยง และ Google Apps Script ไม่ใช่ตัวเลือกที่เหมาะสำหรับข้อมูลสุขภาพ/เลขบัตรใน production คู่มือนี้ใช้ข้อมูลสมมติเท่านั้น ห้ามใช้ผู้ป่วยจริง

## สร้างแท็บ

1. เปิดชีตเปล่าของคุณ → Extensions → Apps Script
2. วางโค้ดจาก `Code.gs` ทับไฟล์ `.gs` ให้เหลือชุดนี้ชุดเดียว แล้ว Save
3. เลือก `setupSheets` แล้วกด Run/อนุญาต
4. กลับ Sheet ตรวจแท็บ `Appointments`, `Users`, `Availability`, `Notifications`, `AuditLog`
5. บัญชีแถว Users ที่ตั้ง `SUPER_ADMIN` ให้คงไว้ได้ แต่การล็อกอินแบบรหัสผ่านใช้ `passwordHash`/`salt` เพิ่ม

## ตั้ง Super Admin เริ่มต้น

ต้องใช้ Apps Script > Project Settings > Script properties เพิ่ม `BOOTSTRAP_SECRET` เป็นค่าสุ่มยาวอย่างน้อย 32 ตัวอักษร ก่อน deploy (อย่าใส่ secret ในไฟล์หรือ GitHub)

ข้อจำกัดปัจจุบัน: ยังไม่มีหน้า bootstrap ที่เชื่อมต่อจากเว็บ และ Apps Script Web App ไม่รองรับ CORS/session แบบ production สำหรับ frontend บน GitHub Pages โดยตรง จึง **อย่าเปิด deployment สาธารณะและอย่าถือว่าล็อกอินใช้งานได้** การสร้าง hash ต้องเพิ่ม endpoint ชั่วคราวแบบจำกัดสิทธิ์หรือสร้างบัญชีผ่านสคริปต์ใน editor ก่อนใช้งานทดสอบ

## ประชาชน

ระบบตั้งใจเปลี่ยนการค้นจากเลขบัตรอย่างเดียวเป็นรหัสใบนัดสุ่ม + PIN 6 หลัก แต่ก่อนเปิดจริงต้องยืนยันว่า PIN ถูกส่งให้ผู้จองอย่างปลอดภัย และระบบเปลี่ยน PIN เมื่อหายได้โดยไม่เปิดเผยข้อมูล

## ก่อนใช้งานจริง

- ย้าย backend ไปบริการที่รองรับ authentication/session, CORS และ rate limit อย่างชัดเจน (หรือใช้ Google Identity สำหรับเจ้าหน้าที่)
- ห้ามเผยแพร่ Google Sheet; จำกัดสิทธิ์เฉพาะผู้รับผิดชอบ
- เข้ารหัส/ลดข้อมูลอ่อนไหว, กำหนด retention, audit และ incident response
- เพิ่ม test ด้วยข้อมูลสมมติ, ตรวจสิทธิ์ทุก endpoint, backup และทดสอบกู้คืน
- ห้ามใช้ Apps Script/Google Sheet ชุดนี้กับข้อมูลสุขภาพจริงจนกว่าองค์กรทบทวนและอนุมัติ
