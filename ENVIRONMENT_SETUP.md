# Environment Variables Setup - PUMP Application

## הגדרת משתני סביבה לכל הסביבות

מדריך זה מסביר איך להגדיר נכון את משתני הסביבה עבור:
- 💻 **Local Development** (פיתוח מקומי)
- ☁️ **Azure App Service** (Backend Production)
- 🚀 **Vercel** (Frontend Production)

---

## 📋 סקירת משתני סביבה

### Backend (Server) Environment Variables

| משתנה | תיאור | נדרש? | דוגמה |
|-------|-------|-------|-------|
| `DATABASE_URL` | חיבור למסד נתונים PostgreSQL | ✅ חובה | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `PORT` | פורט שהשרת יקשיב עליו | אופציונלי | `5000` (default) |
| `JWT_SECRET` | מפתח סודי ל-JWT tokens | ✅ חובה | `super_secret_jwt_key_change_this` |
| `SERVER_URL` | כתובת השרת (לOAuth callbacks) | ✅ חובה | `https://pump-server.azurewebsites.net` |
| `CLIENT_URL` | כתובת הלקוח (לCORS ו-redirects) | ✅ חובה | `https://pump.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ חובה לOAuth | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret | ✅ חובה לOAuth | `GOCSPX-abc123...` |
| `EMAIL_HOST` | SMTP server למיילים | אופציונלי | `smtp.gmail.com` |
| `EMAIL_PORT` | SMTP port | אופציונלי | `587` |
| `EMAIL_USER` | כתובת מייל לשליחה | אופציונלי | `your.email@gmail.com` |
| `EMAIL_PASSWORD` | App Password של Gmail | אופציונלי | `abcd efgh ijkl mnop` |

---

### Frontend (Client) Environment Variables

| משתנה | תיאור | נדרש? | דוגמה |
|-------|-------|-------|-------|
| `VITE_API_URL` | כתובת ה-Backend API | ✅ חובה | `https://pump-server.azurewebsites.net` |

---

## 💻 Local Development Setup

### Backend (.env file)

**מיקום:** `server/.env`

```env
# Database - Azure PostgreSQL
DATABASE_URL="postgresql://pump:YourPassword@pump-db-server.postgres.database.azure.com:5432/postgres?sslmode=require"

# Server Configuration
PORT=5000
JWT_SECRET="super_secret_jwt_key_change_this"

# URLs - Local Development
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:5000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your_secret_here

# Email (Optional - אם לא מוגדר, הטוקן יודפס לקונסול)
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your.email@gmail.com
# EMAIL_PASSWORD=your_app_password_here
```

> **חשוב:** הקובץ `.env` לא יועלה ל-Git (נמצא ב-`.gitignore`)

---

### Frontend (.env file)

**מיקום:** `client/.env`

```env
# API URL - Local Development
VITE_API_URL=http://localhost:5000
```

---

## ☁️ Azure App Service (Backend Production)

### איך להגדיר משתני סביבה ב-Azure

**שלב 1: גש ל-Azure Portal**
1. היכנס ל-https://portal.azure.com
2. עבור ל-**App Services**
3. בחר את ה-App Service שלך (לדוגמה: `pump-server`)

**שלב 2: פתח Configuration**
1. בתפריט צד שמאל, לחץ על **Settings** → **Configuration**
2. לחץ על הכרטיסייה **Application settings**

**שלב 3: הוסף/ערוך משתנים**

לחץ על **+ New application setting** והוסף את כל המשתנים הבאים:

```
Name: DATABASE_URL
Value: postgresql://pump:YourPassword@pump-db-server.postgres.database.azure.com:5432/postgres?sslmode=require

Name: JWT_SECRET
Value: super_secret_jwt_key_change_this

Name: SERVER_URL
Value: https://pump-server.azurewebsites.net

Name: CLIENT_URL
Value: https://pump.vercel.app

Name: GOOGLE_CLIENT_ID
Value: your_client_id_here.apps.googleusercontent.com

Name: GOOGLE_CLIENT_SECRET
Value: GOCSPX-your_secret_here

# אופציונלי - למיילים
Name: EMAIL_HOST
Value: smtp.gmail.com

Name: EMAIL_PORT
Value: 587

Name: EMAIL_USER
Value: your.email@gmail.com

Name: EMAIL_PASSWORD
Value: abcd efgh ijkl mnop
```

**שלב 4: שמור והפעל מחדש**
1. לחץ על **Save** למעלה
2. לחץ על **Continue** באזהרה
3. **אופציונלי אבל מומלץ:** לחץ על **Restart** כדי להפעיל מחדש את האפליקציה

---

### וידוא שההגדרות נכונות

**דרך 1: דרך ה-Portal**
- עבור ל-Configuration → Application settings
- וודא שכל המשתנים מופיעים ברשימה

**דרך 2: דרך Console**
1. עבור ל-Advanced Tools (Kudu): **Development Tools** → **Advanced Tools** → **Go**
2. לחץ על **Debug console** → **CMD**
3. הרץ: `printenv | grep -E "DATABASE_URL|JWT_SECRET|SERVER_URL|CLIENT_URL|GOOGLE"`

---

## 🚀 Vercel (Frontend Production)

### איך להגדיר משתני סביבה ב-Vercel

**שלב 1: גש ל-Vercel Dashboard**
1. היכנס ל-https://vercel.com
2. עבור ל-**Projects**
3. בחר את הפרויקט שלך (לדוגמה: `pump` או `pump-client`)

**שלב 2: פתח Settings**
1. לחץ על **Settings** בתפריט העליון
2. עבור ל-**Environment Variables** בתפריט צד שמאל

**שלב 3: הוסף משתנה**

לחץ על **Add** והוסף:

```
Name: VITE_API_URL
Value: https://pump-server.azurewebsites.net
```

> **חשוב:** ודא שאין `/` בסוף ה-URL!

**בחר Environments:**
- ✅ Production
- ✅ Preview
- ✅ Development

**שלב 4: Redeploy**
1. Vercel יציע לך לעשות Redeploy - לחץ **Redeploy**
2. אם לא, עבור ל-**Deployments** ובחר **Redeploy** בהפצה האחרונה

---

### וידוא שההגדרות נכונות

**דרך 1: דרך ה-Dashboard**
- עבור ל-Settings → Environment Variables
- וודא ש-`VITE_API_URL` מוגדר נכון

**דרך 2: בדיקה רצה**
1. פתח את האתר שלך ב-Production: `https://your-app.vercel.app`
2. פתח Developer Tools (F12)
3. עבור ל-**Console**
4. הרץ: `console.log(import.meta.env.VITE_API_URL)`
5. צריך להדפיס: `https://pump-server.azurewebsites.net`

---

## 🔍 פתרון בעיות

### הבעיה: "Cannot connect to database"

**סיבה אפשרית:** `DATABASE_URL` לא נכון או חסר

**פתרון:**
1. וודא ש-`DATABASE_URL` מוגדר ב-Azure App Service
2. ודא שהחיבור כולל `?sslmode=require` בסוף
3. וודא שהסיסמה נכונה
4. בדוק שה-PostgreSQL server ב-Azure מאפשר חיבורים

**איך לבדוק:**
```bash
# בקונסול של Kudu (Azure)
echo $DATABASE_URL
```

---

### הבעיה: CORS Error - "No 'Access-Control-Allow-Origin'"

**סיבה אפשרית:** `CLIENT_URL` ב-Backend לא תואם לכתובת האמיתית של הלקוח

**פתרון:**
1. וודא ש-`CLIENT_URL` ב-Azure App Service = הכתובת המדויקת של Vercel
2. ודא שאין `/` בסוף ה-URL
3. Restart את ה-App Service

**דוגמה נכונה:**
```
CLIENT_URL=https://pump.vercel.app   ✅
CLIENT_URL=https://pump.vercel.app/  ❌ (יש / בסוף)
```

---

### הבעיה: Google OAuth Error 400 (redirect_uri_mismatch)

**סיבה אפשרית:** `SERVER_URL` לא תואם ל-callback URI ב-Google Console

**פתרון:**
1. וודא ש-`SERVER_URL` ב-Azure = הכתובת המדויקת של Azure App Service
2. גש ל-Google Cloud Console והוסף: `https://[SERVER_URL]/api/auth/google/callback`
3. **ראה**: `GOOGLE_OAUTH_SETUP.md` להנחיות מפורטות

---

### הבעיה: Frontend לא מתחבר ל-Backend

**סיבה אפשרית:** `VITE_API_URL` לא נכון ב-Vercel

**פתרון:**
1. וודא ש-`VITE_API_URL` ב-Vercel = הכתובת של Azure App Service
2. Redeploy את Vercel
3. בדוק ב-Console (F12) אם יש שגיאות Network

---

### הבעיה: Email לא נשלח (Password Reset)

**סיבה אפשרית:** משתני Email חסרים או לא נכונים

**פתרון:**
1. וודא שהשתמשת ב-**App Password** ולא בסיסמה הרגילה של Gmail
2. וודא ש-2-Step Verification מופעל בחשבון Google
3. בדוק את הקונסול - אם Email לא מוגדר, הטוקן יודפס שם

**איך ליצור App Password:**
https://myaccount.google.com/apppasswords

---

## ✅ Checklist מהיר

### ✅ Local Development
- [ ] `server/.env` קיים ומכיל את כל המשתנים
- [ ] `client/.env` קיים ומכיל `VITE_API_URL=http://localhost:5000`
- [ ] `DATABASE_URL` תקין (מצביע למסד נתונים Azure)
- [ ] `GOOGLE_CLIENT_ID` ו-`GOOGLE_CLIENT_SECRET` מוגדרים

### ✅ Azure App Service (Backend)
- [ ] `DATABASE_URL` מוגדר
- [ ] `JWT_SECRET` מוגדר
- [ ] `SERVER_URL` = הכתובת של Azure App Service
- [ ] `CLIENT_URL` = הכתובת של Vercel
- [ ] `GOOGLE_CLIENT_ID` מוגדר
- [ ] `GOOGLE_CLIENT_SECRET` מוגדר
- [ ] (אופציונלי) משתני Email מוגדרים
- [ ] App Service הופעל מחדש אחרי שינויים

### ✅ Vercel (Frontend)
- [ ] `VITE_API_URL` = הכתובת של Azure App Service
- [ ] נעשה Redeploy אחרי הוספת המשתנה

### ✅ Google Cloud Console
- [ ] Authorized redirect URIs כולל `https://[SERVER_URL]/api/auth/google/callback`
- [ ] Authorized JavaScript origins כולל את כתובת Vercel

---

## 📞 עזרה נוספת

אם משהו לא עובד:

1. **בדוק את הלוגים:**
   - **Azure:** App Service → Monitoring → Log stream
   - **Vercel:** Project → Deployments → [בחר deployment] → Runtime Logs

2. **בדוק את הבדיקות הבריאות:**
   - Backend: `https://[SERVER_URL]/api/health/db`
   - Frontend: פתח F12 → Console, חפש שגיאות

3. **השווה עם הדוגמאות** במסמך הזה - וודא שהפורמט זהה

---

## 🎯 סיכום

| סביבה | קובץ/מיקום | משתנים חשובים |
|-------|-----------|--------------|
| **Local Backend** | `server/.env` | `SERVER_URL`, `CLIENT_URL`, `DATABASE_URL`, `GOOGLE_*` |
| **Local Frontend** | `client/.env` | `VITE_API_URL` |
| **Azure (Backend)** | Portal → Configuration | `SERVER_URL`, `CLIENT_URL`, `DATABASE_URL`, `GOOGLE_*` |
| **Vercel (Frontend)** | Dashboard → Settings | `VITE_API_URL` |

**זכור:** אחרי כל שינוי ב-Azure, עשה **Restart**. אחרי שינוי ב-Vercel, עשה **Redeploy**!
