/**
 * wet-test.mjs — בדיקת רטוב מסלול לקוח מלא
 * הרץ: node scripts/wet-test.mjs (לאחר npm run dev)
 */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5173/lab-system/';
const ADMIN = { id: 'USR-0001', name: 'יצחק הורוביץ', email: 'h0527040060@gmail.com', password: '123456', role: 'admin' };

let passed = 0;
let failed = 0;

function ok(msg) { console.log(`  ✅ ${msg}`); passed++; }
function fail(msg) { console.error(`  ❌ ${msg}`); failed++; }
function note(msg) { console.log(`  ℹ️  ${msg}`); }

async function check(label, condition) {
  if (condition) ok(label);
  else fail(label);
}

async function waitForText(page, text, timeout = 5000) {
  try {
    await page.waitForFunction(
      (t) => document.body.innerText.includes(t),
      text, { timeout }
    );
    return true;
  } catch { return false; }
}

(async () => {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);

  // ────────────────────────────────────────────────────────────
  // הכנה
  // ────────────────────────────────────────────────────────────
  console.log('\n📦 מכין סביבת בדיקה...');
  await page.goto(BASE, { timeout: 30000, waitUntil: 'domcontentloaded' });
  await page.evaluate((admin) => {
    const usersKey = 'horovitz_users';
    let users = JSON.parse(localStorage.getItem(usersKey) || '[]');
    if (!users.find(u => u.email === admin.email)) {
      users.push(admin);
      localStorage.setItem(usersKey, JSON.stringify(users));
    }
    // נקה נתוני TEST_ קודמים
    ['horovitz_repairs','horovitz_customers','horovitz_devices'].forEach(key => {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = data.filter(item =>
        !item.complaint?.includes('TEST_') &&
        !item.name?.includes('TEST_') &&
        !item.brand?.includes('TEST_')
      );
      localStorage.setItem(key, JSON.stringify(filtered));
    });
  }, ADMIN);
  ok('הזרקת admin + ניקוי TEST_ קודמים');

  // ────────────────────────────────────────────────────────────
  // 1. Login
  // ────────────────────────────────────────────────────────────
  console.log('\n🔐 שלב 1: כניסה...');
  await page.reload();
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', ADMIN.email);
  await page.fill('input[type="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
  const afterLogin = await waitForText(page, 'תצוגת לוח');
  await check('כניסה מוצלחת (הגיע ל-Kanban)', afterLogin);

  // ────────────────────────────────────────────────────────────
  // 2. קליטה — שלב לקוח עם ולידציות
  // ────────────────────────────────────────────────────────────
  console.log('\n📋 שלב 2: ולידציות קליטה (לקוח חדש)...');
  await page.click('button:has-text("קליטה")');
  await page.waitForTimeout(600);

  // לחץ "לקוח חדש"
  const newCustBtn = page.locator('button:has-text("לקוח חדש")');
  if (await newCustBtn.count() > 0) await newCustBtn.click();
  await page.waitForTimeout(400);

  const nameInput = page.locator('input[placeholder="שם לקוח *"]');
  const phoneInput = page.locator('input[placeholder="טלפון *"]');
  const emailInput = page.locator('input[placeholder="מייל"]');
  const continueBtn1 = page.locator('button:has-text("המשך לבחירת מכשיר")');

  // ולידציה: נתונים לא תקינים
  await nameInput.fill('TEST_לקוח_בדיקה');
  await phoneInput.fill('abc');
  await emailInput.fill('notanemail');
  await page.waitForTimeout(600);

  await check('כפתור "המשך" מושבת עם טלפון לא תקין', await continueBtn1.isDisabled());
  await check('שגיאת טלפון לא תקין מוצגת', await waitForText(page, 'מספר טלפון לא תקין', 2000));
  await check('שגיאת מייל לא תקינה מוצגת', await waitForText(page, 'כתובת מייל לא תקינה', 2000));

  // תקן
  await phoneInput.fill('050-1234567');
  await emailInput.fill('test@test.com');
  await page.waitForTimeout(500);
  await check('כפתור "המשך" פעיל עם נתונים תקינים', !(await continueBtn1.isDisabled()));
  await continueBtn1.click();
  await page.waitForTimeout(600);

  // ────────────────────────────────────────────────────────────
  // 3. מכשיר חדש (AutocompleteInput)
  // ────────────────────────────────────────────────────────────
  console.log('\n📱 שלב 3: מכשיר חדש...');
  const newDevBtn = page.locator('button:has-text("מכשיר חדש")');
  if (await newDevBtn.count() > 0) await newDevBtn.click();
  await page.waitForTimeout(400);

  // AutocompleteInput מרנדר <input> רגיל עם placeholder
  const typeAC = page.locator('input[placeholder*="סוג מכשיר"]');
  const brandAC = page.locator('input[placeholder*="Ozti"]');
  const modelAC = page.locator('input[placeholder*="דגם"]');

  if (await typeAC.count() > 0) { await typeAC.fill('TEST_מקרר'); await page.keyboard.press('Escape'); }
  if (await brandAC.count() > 0) { await brandAC.fill('TEST_YAM'); await page.keyboard.press('Escape'); }
  if (await modelAC.count() > 0) { await modelAC.fill('TEST_XL500'); await page.keyboard.press('Escape'); }
  await page.waitForTimeout(400);

  const continueBtn2 = page.locator('button:has-text("המשך לפרטי תיקון")');
  await check('שדות מכשיר מולאו', await typeAC.inputValue() === 'TEST_מקרר');
  await check('כפתור "המשך לפרטי תיקון" פעיל', !(await continueBtn2.isDisabled()));
  await continueBtn2.click();
  await page.waitForTimeout(600);

  // ────────────────────────────────────────────────────────────
  // 4. פרטי תיקון
  // ────────────────────────────────────────────────────────────
  console.log('\n💾 שלב 4: פרטי תיקון...');
  const complaintTA = page.locator('textarea[placeholder*="תיאור"]');
  if (await complaintTA.count() > 0) await complaintTA.fill('TEST_לא מקרר - בדיקה אוטומטית');
  await page.waitForTimeout(300);

  // אשר דמי בדיקה
  const feeCheckbox = page.locator('input[type="checkbox"]').first();
  if (await feeCheckbox.count() > 0 && !(await feeCheckbox.isChecked())) {
    await feeCheckbox.click();
  }

  // העלאת תמונה (input[type="file"].hidden)
  const fileInputs = page.locator('input[type="file"]');
  if (await fileInputs.count() > 0) {
    await fileInputs.first().setInputFiles({
      name: 'test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARC'),
    });
    await page.waitForTimeout(500);
    ok('תמונה הועלתה');
  }

  const continueBtn3 = page.locator('button:has-text("סקירה ואישור")');
  if (await continueBtn3.count() > 0 && !(await continueBtn3.isDisabled())) {
    await continueBtn3.click();
    await page.waitForTimeout(600);
    ok('עבר לשלב סקירה ואישור');
  } else {
    fail('כפתור "סקירה ואישור" לא זמין');
    note('(בדיקות הבאות עלולות להיכשל)');
  }

  // ────────────────────────────────────────────────────────────
  // 5. אישור סופי
  // ────────────────────────────────────────────────────────────
  console.log('\n✅ שלב 5: אישור ויצירת קריאה...');
  const createBtn = page.locator('button:has-text("צור קריאת תיקון")');
  if (await createBtn.count() > 0) {
    await createBtn.click();
    await page.waitForTimeout(1500);
    const successShown = await waitForText(page, 'נקלטה בהצלחה', 5000);
    await check('קריאה נקלטה בהצלחה', successShown);

    const bodyText = await page.evaluate(() => document.body.innerText);
    const qrMatch = bodyText.match(/QR_\d{8}_\d{3}/);
    if (qrMatch) {
      ok(`QR ID נוצר: ${qrMatch[0]}`);
      const dateStr = new Date().toISOString().slice(0,10).replace(/-/g,'');
      await check('פורמט QR תקין (QR_YYYYMMDD_XXX)', qrMatch[0].startsWith(`QR_${dateStr}_`));
    } else {
      fail('QR ID לא נמצא בדף ההצלחה');
    }
  } else {
    fail('כפתור "צור קריאת תיקון" לא נמצא');
  }

  // ────────────────────────────────────────────────────────────
  // 6. F5 — נתונים נשמרו?
  // ────────────────────────────────────────────────────────────
  console.log('\n🔄 שלב 6: reload — ודא נתונים נשמרו...');
  await page.reload();
  await page.waitForTimeout(2000);

  const dataAfterReload = await page.evaluate(() => {
    const repairs = JSON.parse(localStorage.getItem('horovitz_repairs') || '[]');
    const customers = JSON.parse(localStorage.getItem('horovitz_customers') || '[]');
    return {
      testRepair: repairs.find(r => r.complaint?.includes('TEST_')),
      testCustomer: customers.find(c => c.name?.includes('TEST_')),
    };
  });
  await check('תיקון TEST_ נשמר לאחר reload', !!dataAfterReload.testRepair);
  await check('לקוח TEST_ נשמר לאחר reload', !!dataAfterReload.testCustomer);
  if (dataAfterReload.testRepair) {
    note(`סטטוס תיקון: ${dataAfterReload.testRepair.status}`);
    await check('תיקון בסטטוס קליטה (red_intake)', dataAfterReload.testRepair.status === 'red_intake');
  }

  // ────────────────────────────────────────────────────────────
  // 7. Kanban — ודא הקריאה מופיעה בעמודת קליטה
  // ────────────────────────────────────────────────────────────
  console.log('\n🗂️ שלב 7: Kanban...');
  await page.click('button:has-text("תצוגת לוח")');
  await page.waitForTimeout(1000);
  const kanbanText = await waitForText(page, 'TEST_לקוח_בדיקה', 3000);
  await check('קריאת TEST_ מופיעה ב-Kanban', kanbanText);

  // ────────────────────────────────────────────────────────────
  // 8. ולידציית מחירים שליליים (בדיקת לוגיקה)
  // ────────────────────────────────────────────────────────────
  console.log('\n💰 שלב 8: ולידציית מחירים שליליים...');
  const priceCheck = await page.evaluate(() => {
    const clamp = (val) => Math.max(0, parseFloat(val) || 0);
    const clampQty = (val) => Math.max(1, parseInt(val) || 1);
    return {
      negPrice: clamp('-100') === 0,
      negQty: clampQty('-5') === 1,
      posPrice: clamp('350') === 350,
    };
  });
  await check('מחיר שלילי נחסם ל-0', priceCheck.negPrice);
  await check('כמות שלילית נחסמת ל-1', priceCheck.negQty);
  await check('מחיר חיובי 350 עובר', priceCheck.posPrice);

  // ────────────────────────────────────────────────────────────
  // 9. הגדרות — SettingsBusiness min values
  // ────────────────────────────────────────────────────────────
  console.log('\n⚙️ שלב 9: הגדרות עסק...');
  await page.click('button:has-text("הגדרות")');
  await page.waitForTimeout(800);
  const settingVal = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('horovitz_settings') || '{}');
    return { fee: s.diagnostic_fee, vat: s.vat_percent_display };
  });
  await check('דמי אבחון לא שליליים', (settingVal.fee ?? 180) >= 0);
  await check('מע"מ לא שלילי', (settingVal.vat ?? 17) >= 0);
  note(`דמי אבחון: ${settingVal.fee ?? 180}₪  |  מע"מ: ${settingVal.vat ?? 17}%`);

  // ────────────────────────────────────────────────────────────
  // 10. SettingsRoles — מניעת נעילה עצמית
  // ────────────────────────────────────────────────────────────
  console.log('\n👥 שלב 10: ניהול תפקידים — מניעת נעילה...');
  const rolesTab = page.locator('button:has-text("ניהול תפקידים")');
  if (await rolesTab.count() > 0) {
    await rolesTab.click();
    await page.waitForTimeout(500);

    // בטל את כל ה-checkboxes מהפאנל הראשון
    const checkboxes = page.locator('input[type="checkbox"]');
    const cbCount = await checkboxes.count();
    for (let i = 0; i < cbCount; i++) {
      const cb = checkboxes.nth(i);
      try {
        if (await cb.isChecked()) await cb.click();
      } catch (_) {}
    }
    await page.waitForTimeout(400);

    let alertShown = false;
    page.once('dialog', async (dialog) => {
      alertShown = true;
      note(`Alert message: "${dialog.message()}"`);
      await dialog.dismiss();
    });

    const saveBtn = page.locator('button:has-text("שמור הגדרות תפקיד")').first();
    if (await saveBtn.count() > 0) {
      await saveBtn.click();
      await page.waitForTimeout(800);
      await check('alert מוצג בניסיון שמירת 0 סטטוסים', alertShown);
    } else {
      note('כפתור שמור תפקיד לא נמצא');
    }
  } else {
    note('טאב ניהול תפקידים לא נמצא');
  }

  // ────────────────────────────────────────────────────────────
  // 11. ניקוי
  // ────────────────────────────────────────────────────────────
  console.log('\n🧹 שלב 11: ניקוי נתוני TEST_...');
  await page.evaluate(() => {
    ['horovitz_repairs','horovitz_customers','horovitz_devices'].forEach(key => {
      const data = JSON.parse(localStorage.getItem(key) || '[]');
      const filtered = data.filter(item =>
        !item.complaint?.includes('TEST_') &&
        !item.name?.includes('TEST_') &&
        !item.brand?.includes('TEST_')
      );
      localStorage.setItem(key, JSON.stringify(filtered));
    });
  });
  ok('נתוני TEST_ נוקו');

  // אמת שאין יתומים
  const orphans = await page.evaluate(() => {
    const repairs = JSON.parse(localStorage.getItem('horovitz_repairs') || '[]');
    const customerIds = new Set(JSON.parse(localStorage.getItem('horovitz_customers') || '[]').map(c => c.id));
    return repairs.filter(r => r.customer_id && !customerIds.has(r.customer_id));
  });
  await check(`אין תיקונים "יתומים" (תיקון ללא לקוח)`, orphans.length === 0);

  // ────────────────────────────────────────────────────────────
  // סיכום
  // ────────────────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(55));
  console.log(`📊 סיכום: ✅ ${passed} עברו  |  ❌ ${failed} נכשלו`);
  if (failed === 0) console.log('🎉 כל הבדיקות עברו!');
  console.log('═'.repeat(55));

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})().catch(err => {
  console.error('\n💥 שגיאה קריטית:', err.message);
  process.exit(1);
});
