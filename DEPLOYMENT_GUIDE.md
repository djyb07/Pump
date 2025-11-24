# מדריך הפעלת מערכת PUMP

## 🚀 הפעלה מקומית (Development)

### דרישות מוקדמות
- Node.js מותקן
- PostgreSQL database (Azure)
- משתני סביבה מוגדרים בקבצי `.env`

### שלב 1: הפעלת השרת (Backend)

```bash
cd server
npm install
npm run dev
```

השרת ירוץ על `http://localhost:5000`

### שלב 2: הפעלת הלקוח (Frontend)

פתח טרמינל חדש:

```bash
cd client
npm install
npm run dev
```

הלקוח ירוץ על `http://localhost:5173`

### שלב 3: גישה למערכת

פתח דפדפן וגש ל: `http://localhost:5173`

---

## 🌍 הפעלה גלובלית - גישה מהאינטרנט

יש שתי אפשרויות להפעיל את המערכת כך שתהיה נגישה מהאינטרנט:

### אפשרות 1: שימוש ב-ngrok (מומלץ לפיתוח ובדיקות)

**ngrok** יוצר tunnel מאובטח שמאפשר גישה לשרת מקומי דרך האינטרנט.

#### התקנה:
1. גש ל-https://ngrok.com/download
2. הורד והתקן את ngrok
3. הירשם לחשבון (חינם)
4. חבר את החשבון: `ngrok authtoken YOUR_TOKEN`

#### הפעלה:

**להפעלת השרת:**
```bash
# בטרמינל 1: הפעל את השרת
cd server
npm run dev

# בטרמינל 2: חשוף את השרת דרך ngrok
ngrok http 5000
```

ngrok ייתן לך URL ציבורי, לדוגמה:
```
https://abc123.ngrok.io
```

**להפעלת הלקוח:**
```bash
# בטרמינל 3: הפעל את הלקוח
cd client
npm run dev

# בטרמינל 4: חשוף את הלקוח דרך ngrok
ngrok http 5173
```

#### עדכון משתני סביבה:

עדכן את `server/.env`:
```env
SERVER_URL=https://abc123.ngrok.io
CLIENT_URL=https://xyz456.ngrok.io
```

עדכן את `client/.env`:
```env
VITE_API_URL=https://abc123.ngrok.io
```

#### עדכון Google OAuth:
1. גש ל-[Google Cloud Console](https://console.cloud.google.com/)
2. לך ל-APIs & Services → Credentials
3. בחר את ה-OAuth 2.0 Client ID שלך
4. הוסף ל-"Authorized redirect URIs":
   ```
   https://abc123.ngrok.io/api/auth/google/callback
   ```

**שים לב:** ה-URL של ngrok משתנה כל פעם שאתה מפעיל אותו (בגרסה החינמית). צריך לעדכן את ההגדרות בכל הפעלה.

---

### אפשרות 2: Deploy ל-Production (מומלץ לשימוש אמיתי)

לשימוש קבוע ומתמשך, מומלץ להעלות את המערכת לשירות hosting:

#### שירותי Hosting מומלצים:

**לשרת (Backend):**
- **Railway.app** - קל להעלאה, תמיכה ב-PostgreSQL
- **Render.com** - רובוט חינמי, תמיכה ב-Node.js
- **Azure App Service** - מומלץ כי יש לך כבר DB ב-Azure
- **Heroku** - לא חינמי יותר, אבל פשוט

**ללקוח (Frontend):**
- **Vercel** - אידיאלי ל-React + Vite (חינמי)
- **Netlify** - דומה ל-Vercel (חינמי)
- **Azure Static Web Apps** - אם אתה רוצה הכל ב-Azure

#### שלבים כלליים ל-Deploy:

**1. הכן את הקוד:**
```bash
# יצירת repository ב-GitHub (אם אין)
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

**2. Deploy השרת (דוגמה ב-Railway):**
1. גש ל-https://railway.app
2. התחבר עם GitHub
3. New Project → Deploy from GitHub repo
4. בחר את ה-repository שלך
5. בחר את תיקיית `server`
6. הגדר את משתני הסביבה (Environment Variables):
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `CLIENT_URL` (כתובת הלקוח ב-production)
   - `SERVER_URL` (הכתובת שRailway נותן לך)
   - אופציונלי: `EMAIL_*` למיילים

Railway ייתן לך URL כמו: `https://pump-production.up.railway.app`

**3. Deploy הלקוח (דוגמה ב-Vercel):**
1. גש ל-https://vercel.com
2. Import Project → GitHub repository
3. בחר את תיקיית `client` כ-Root Directory
4. הגדר Environment Variable:
   - `VITE_API_URL=https://pump-production.up.railway.app`
5. Deploy!

Vercel ייתן לך URL כמו: `https://pump.vercel.app`

**4. עדכן משתני סביבה:**

בשרת (Railway):
```env
CLIENT_URL=https://pump.vercel.app
SERVER_URL=https://pump-production.up.railway.app
```

בלקוח (Vercel):
```env
VITE_API_URL=https://pump-production.up.railway.app
```

**5. עדכן Google OAuth:**
הוסף את ה-redirect URI החדש:
```
https://pump-production.up.railway.app/api/auth/google/callback
```

---

## 📧 הגדרת שליחת מיילים (Password Reset)

כרגע, קישורי איפוס סיסמה מודפסים לקונסול. כדי לשלוח מיילים אמיתיים:

### שימוש ב-Gmail:

**1. הפעל 2-Step Verification:**
- גש ל-https://myaccount.google.com/security
- הפעל "2-Step Verification"

**2. צור App Password:**
- גש ל-https://myaccount.google.com/apppasswords
- בחר "Mail" ו-"Windows Computer" (או אחר)
- Google ייתן לך סיסמה באורך 16 תווים

**3. הוסף ל-`.env` בשרת:**
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

**4. הפעל מחדש את השרת**

עכשיו כשמשתמש מבקש איפוס סיסמה, הוא יקבל מייל עם קישור!

### שימוש בשירותי מייל אחרים:

- **SendGrid** - חינמי עד 100 מיילים ביום
- **Mailgun** - חינמי עד 5,000 מיילים בחודש
- **AWS SES** - זול מאוד, דורש אימות

---

## ✅ בדיקה שהמערכת עובדת

### בדיקה מקומית:

1. **רישום:**
   - גש ל-`/register`
   - צור משתמש חדש
   - בדוק שהמשתמש נשמר ב-DB

2. **התחברות:**
   - התחבר עם המשתמש שיצרת
   - בדוק שמתקבל token

3. **איפוס סיסמה:**
   - גש ל-`/forgot-password`
   - הזן את המייל שלך
   - אם הגדרת מייל - בדוק שהמייל הגיע
   - אם לא - העתק את הקישור מהקונסול
   - אפס את הסיסמה
   - התחבר עם הסיסמה החדשה

4. **Google OAuth:**
   - לחץ על "Sign in with Google"
   - אשר את ההרשאות
   - בדוק שאתה מועבר חזרה ומתחבר

### בדיקה גלובלית (ngrok/production):

1. שתף את ה-URL עם חבר
2. בקש ממנו לנסות להירשם/להתחבר
3. בדוק שהכל עובד ממחשב אחר

---

## 🐛 פתרון בעיות נפוצות

### Google OAuth לא עובד:
- ✅ ודא ש-`SERVER_URL` ב-.env תואם ל-redirect URI בGoogle Console
- ✅ ודא ש-`GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET` נכונים
- ✅ בדוק שה-callbackURL בקונסול זהה ל-`SERVER_URL/api/auth/google/callback`

### מיילים לא נשלחים:
- ✅ ודא שהגדרת App Password (לא הסיסמה הרגילה!)
- ✅ בדוק את הקונסול - המערכת תדפיס errors אם יש
- ✅ ודא ש-2-Step Verification מופעל בחשבון Google

### CORS errors:
- ✅ ודא ש-`CLIENT_URL` ב-server/.env תואם לכתובת שממנה אתה ניגש
- ✅ אם אתה משתמש ב-ngrok, עדכן את ה-URL בכל הפעלה

### לא יכול לגשת מרשת חיצונית:
- ✅ ודא שהשרת מאזין על `0.0.0.0` (זה כבר מוגדר)
- ✅ אם ברשת ביתית - פתח port forwarding בנתב
- ✅ מומלץ להשתמש ב-ngrok במקום

---

## 📝 סיכום מהיר

**פיתוח מקומי:**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev

# גש ל-http://localhost:5173
```

**חשיפה לאינטרנט (ngrok):**
```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
ngrok http 5000

# Terminal 3
cd client && npm run dev

# Terminal 4
ngrok http 5173

# עדכן .env files עם ה-URLs של ngrok
# עדכן Google Console redirect URI
```

**Production:**
1. העלה לGitHub
2. Deploy שרת לRailway/Render
3. Deploy לקוח לVercel/Netlify
4. הגדר משתני סביבה
5. עדכן Google OAuth redirect URI
