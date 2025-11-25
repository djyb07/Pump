# Google OAuth Setup Guide - PUMP Application

## תיקון שגיאת Error 400: redirect_uri_mismatch

המדריך הזה יעזור לך לתקן את בעיית ההתחברות עם Google.

## 🔍 מהי הבעיה?

Google OAuth דורש שה-URL שאליו הוא מפנה משתמשים אחרי התחברות (callback URL) יהיה **רשום במדויק** ב-Google Cloud Console.

הקוד שלך נכון, אבל **ההגדרות ב-Google Cloud Console לא מעודכנות** עם כתובות ה-Production.

## 📋 מה שאתה צריך לפני שמתחילים

**מידע שאתה צריך:**
1. ✅ כתובת ה-Azure App Service שלך (Backend)
   - לדוגמה: `https://pump-server.azurewebsites.net`
   - איפה למצוא: Azure Portal → App Services → בחר את האפליקציה → URL בראש העמוד
   
2. ✅ כתובת ה-Vercel שלך (Frontend)
   - לדוגמה: `https://pump.vercel.app`
   - איפה למצוא: Vercel Dashboard → Your Project → Domains

3. ✅ גישה ל-Google Cloud Console
   - https://console.cloud.google.com/

---

## 🔧 שלב 1: מצא את ה-OAuth Credentials ב-Google Cloud Console

### 1.1 היכנס ל-Google Cloud Console
1. גש ל-https://console.cloud.google.com/
2. בחר את הפרויקט שלך (PUMP)

### 1.2 נווט ל-Credentials
1. בתפריט צד שמאל, לחץ על **"APIs & Services"**
2. לחץ על **"Credentials"**
3. תחת "OAuth 2.0 Client IDs", תמצא את ה-Client ID שלך
4. **לחץ על שם ה-Client ID** כדי לערוך אותו

---

## ✏️ שלב 2: עדכן את ה-Redirect URIs

בדף העריכה של ה-OAuth Client, תראה שני חלקים חשובים:

### 2.1 Authorized JavaScript origins

**מה זה:**  אלו הדומיינים שמהם האפליקציה שלך יכולה להפעיל את Google OAuth.

> [!NOTE]
> **האם זה חובה?**
> 
> ל-**server-side OAuth flow** (מה שהקוד שלך משתמש בו) - זה **לא חובה** ל-localhost!
> 
> Google נותן חריגה ל-`localhost`, ולכן זה עבד בלי זה בפיתוח מקומי.
> 
> **אבל:** מומלץ מאוד להוסיף את זה ל-**Production** (Vercel)!

**הוסף את הכתובות הבאות:**
```
http://localhost:5173          (אופציונלי - לפיתוח מקומי)
https://[YOUR-VERCEL-URL]      (חובה - ל-Production!)
```

**דוגמה קונקרטית:**
```
http://localhost:5173
https://pump.vercel.app
```

> **הערה:** החלף `[YOUR-VERCEL-URL]` עם הכתובת האמיתית שלך מ-Vercel!

---

### 2.2 Authorized redirect URIs

**מה זה:** אלו ה-URLs שאליהם Google יכול להפנות משתמשים **אחרי** שהם מתחברים.

**הוסף את הכתובות הבאות:**
```
http://localhost:5000/api/auth/google/callback
https://[YOUR-AZURE-URL]/api/auth/google/callback
```

**דוגמה קונקרטית:**
```
http://localhost:5000/api/auth/google/callback
https://pump-server.azurewebsites.net/api/auth/google/callback
```

> **חשוב מאוד:** ה-URL חייב להיות **בדיוק** כמו שהשרת שלך משתמש בו!
> 
> **בדוק:** ה-URL מסתיים ב-`/api/auth/google/callback` (ללא `/` בסוף!)

---

### 2.3 שמור את השינויים

1. גלול למטה ולחץ על כפתור **"SAVE"**
2. חכה מספר שניות - השינויים יכנסו לתוקף מיד

---

## ✅ שלב 3: וודא שמשתני הסביבה נכונים

### 3.1 Azure App Service (Backend)

**איפה:** Azure Portal → Your App Service → Settings → **Configuration** → Application settings

**ודא שהמשתנים הבאים קיימים ונכונים:**

| שם המשתנה | ערך לדוגמה | הסבר |
|-----------|-----------|------|
| `SERVER_URL` | `https://pump-server.azurewebsites.net` | ה-URL של ה-Backend שלך (ללא `/` בסוף) |
| `CLIENT_URL` | `https://pump.vercel.app` | ה-URL של ה-Frontend שלך |
| `GOOGLE_CLIENT_ID` | `123456...apps.googleusercontent.com` | ה-Client ID מ-Google Console |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | ה-Client Secret מ-Google Console |
| `DATABASE_URL` | `postgresql://...` | חיבור למסד נתונים |
| `JWT_SECRET` | `super_secret_key...` | מפתח לטוקנים |

> **אם שינית משהו:** לחץ "Save" ואז **"Restart"** את ה-App Service!

---

### 3.2 Vercel (Frontend)

**איפה:** Vercel Dashboard → Your Project → Settings → **Environment Variables**

**ודא שהמשתנה הבא קיים:**

| שם המשתנה | ערך לדוגמה | הסבר |
|-----------|-----------|------|
| `VITE_API_URL` | `https://pump-server.azurewebsites.net` | ה-URL של ה-Backend שלך |

> **אם שינית משהו:** Vercel יעשה Redeploy אוטומטי. חכה שההפצה תסתיים.

---

## 🧪 שלב 4: בדוק שהכל עובד

### 4.1 בדיקה Production

1. **פתח את הדפדפן** וגש לכתובת ה-Vercel שלך (לדוגמה: `https://pump.vercel.app`)
2. לחץ על **"Login"** או **"Sign in with Google"**
3. **צפוי:** אתה אמור להגיע לעמוד ההתחברות של Google
4. **התחבר** עם חשבון Google שלך
5. **צפוי:** אתה אמור לחזור לאפליקציה עם התחברות מוצלחת!

### 4.2 אם עדיין יש שגיאה

**אם אתה רואה Error 400: redirect_uri_mismatch:**

1. **בדוק את ה-URL המדויק בשגיאה** - Google מראה לך מה ה-redirect URI שניסה להשתמש
2. **השווה** עם מה שרשמת ב-Google Console
3. **ודא שאין הבדלים:**
   - אין רווחים
   - אותיות גדולות/קטנות זהות
   - יש/אין `/` בסוף
   - `http` vs `https`
   
**דוגמה לבעיה נפוצה:**
```
❌ שגוי: https://pump-server.azurewebsites.net/api/auth/google/callback/
✅ נכון:  https://pump-server.azurewebsites.net/api/auth/google/callback
```
(שים לב ל-`/` מיותר בסוף!)

---

## 🔍 איתור תקלות נוספות

### Google OAuth לא פותח חלון
**בעיה:** כפתור "Sign in with Google" לא עושה כלום

**פתרון:**
1. פתח Developer Tools (F12)
2. לך ל-Console
3. חפש שגיאות CORS או Network
4. ודא ש-`VITE_API_URL` ב-Vercel נכון

---

### אחרי Login עם Google חוזר לעמוד Login
**בעיה:** מתחבר עם Google בהצלחה, אבל לא נשאר מחובר

**פתרון:**
1. בדוק שה-JWT Token נשמר ב-localStorage (Dev Tools → Application → Local Storage)
2. ודא ש-`CLIENT_URL` ב-Azure App Service תואם לכתובת הנכונה
3. בדוק שאין שגיאות CORS בקונסול

---

### התחברות רגילה (Email/Password) עובדת, אבל Google לא
**זה בדיוק הסימן** שזו בעיית הגדרות Google OAuth - עקוב אחרי המדריך שוב בקפידה!

---

## 📸 תמונות להמחשה

### איפה למצוא Credentials ב-Google Cloud Console

```
Google Cloud Console
└── APIs & Services
    └── Credentials
        └── OAuth 2.0 Client IDs
            └── [שם ה-Client ID שלך] ← לחץ כאן
```

### מסך ה-Credentials צריך להיראות כך:

**Authorized JavaScript origins:**
```
http://localhost:5173
https://pump.vercel.app
```

**Authorized redirect URIs:**
```
http://localhost:5000/api/auth/google/callback
https://pump-server.azurewebsites.net/api/auth/google/callback
```

---

## ❓ שאלות נפוצות

### ש: כמה זמן לוקח לשינויים להיכנס לתוקף?
**ת:** שינויים ב-Google Cloud Console נכנסים לתוקף **מיידית** (תוך מספר שניות).

### ש: למה בעבר לא הייתי צריך להגדיר JavaScript origins ל-localhost?
**ת:** שאלה מצוינת! יש כמה סיבות:

**1. Server-Side OAuth Flow**
הקוד שלך משתמש ב-**server-side OAuth** (דרך Passport.js):
```
User → Your Frontend (localhost:5173)
          ↓
     Your Backend (localhost:5000/api/auth/google)
          ↓
     Google OAuth
          ↓
     Callback to Backend (localhost:5000/api/auth/google/callback)
          ↓
     Redirect to Frontend with token
```

בזרימה הזו, **הדפדפן לא מדבר ישירות עם Google** - רק השרת שלך!

לכן "Authorized JavaScript origins" לא נדרש, כי **אין JavaScript בדפדפן שעושה קריאות ל-Google APIs**.

**2. Google נותן חריגה ל-localhost**
Google מאפשר ל-`localhost` לעבוד גם בלי הגדרה מפורשת של JavaScript origins.

**3. מתי זה כן נדרש?**
- ✅ **Client-Side OAuth** - כאשר משתמשים ב-Google Sign-In JavaScript library ישירות בדפדפן
- ✅ **Production** - למרות שלא חובה, זה **best practice** להוסיף את זה גם ל-server-side flow

**לסיכום:**
- ל-**localhost + server-side OAuth** → לא חובה
- ל-**Production (Vercel) + server-side OAuth** → מומלץ מאוד!
- ל-**Client-side OAuth** (שימוש ב-gapi/gsi) → חובה תמיד!

### ש: האם אני צריך Client ID נפרד ל-Development ול-Production?
**ת:** לא! אותו Client ID יכול לשמש את שני הסביבות - פשוט הוסף את כל ה-redirect URIs.

### ש: מה אם אני משתמש ב-ngrok לפיתוח?
**ת:** 
- כל פעם ש-ngrok מתחיל, הוא נותן URL חדש (בגרסה החינמית)
- תצטרך לעדכן את Google Console בכל פעם
- מומלץ להשאיר את `localhost` בהגדרות לפיתוח רגיל

### ש: איך אני יודע מה ה-CLIENT_ID וה-CLIENT_SECRET שלי?
**ת:** 
1. ב-Google Cloud Console → Credentials
2. לחץ על ה-Client ID שלך
3. תראה את ה-Client ID בראש העמוד
4. Client Secret נמצא באותו מקום (לחץ על עין 👁️ כדי לראות אותו)

---

## 📞 נזקקים לעזרה?

אם עדיין יש בעיות:

1. **תמונת מסך של השגיאה** - כולל ה-URL המלא שגוגל מראה
2. **העתק את ההגדרות** מ-Google Console (Authorized redirect URIs)
3. **העתק את משתני הסביבה** מ-Azure ו-Vercel (ללא secrets!)
4. **בדוק את הקונסול** בדפדפן (F12 → Console) - שתף שגיאות אם יש

---

## ✅ סיכום מהיר

1. ✅ גש ל-Google Cloud Console
2. ✅ עבור ל-APIs & Services → Credentials
3. ✅ ערוך את ה-OAuth 2.0 Client ID
4. ✅ הוסף redirect URI: `https://[AZURE-URL]/api/auth/google/callback`
5. ✅ הוסף JavaScript origin: `https://[VERCEL-URL]`
6. ✅ שמור
7. ✅ ודא משתני סביבה באקס Azure ו-Vercel
8. ✅ נסה שוב!

**זה אמור לתקן את הבעיה! 🎉**
