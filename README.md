# 🏋️ PUMP - Workout Tracker

מערכת מתקדמת למעקב אחר אימונים עם תמיכה ב-OAuth, איפוס סיסמה במייל ועוד.

## 📋 תכונות

- ✅ רישום והתחברות משתמשים
- ✅ התחברות דרך Google OAuth
- ✅ איפוס סיסמה עם שליחת מייל
- ✅ אבטחה מלאה עם JWT
- ✅ תמיכה ב-production deployment
- ✅ CORS מוגדר נכון

## 🚀 התחלה מהירה

### דרישות מוקדמות

- Node.js (v16+)
- PostgreSQL database
- חשבון Google Cloud (לOAuth - אופציונלי)
- חשבון Gmail (למיילים - אופציונלי)

### הגדרה

**1. שכפול והתקנה:**

```bash
# Clone the repository
git clone <repository-url>
cd Pump

# Install dependencies for server
cd server
npm install

# Install dependencies for client
cd ../client
npm install
```

**2. הגדרת משתני סביבה:**

העתק את הקובץ לדוגמה ועדכן את הערכים:

```bash
cd server
copy .env.example .env
```

ערוך את `server/.env` והגדר את הערכים שלך:
- `DATABASE_URL` - חיבור ל-PostgreSQL
- `JWT_SECRET` - מפתח סודי לJWT
- `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - מGoogle Console
- `EMAIL_*` - הגדרות SMTP (אופציונלי)

**3. הפעלת המערכת:**

```bash
# Terminal 1: Start server
cd server
npm run dev

# Terminal 2: Start client
cd client
npm run dev
```

גש ל-`http://localhost:5173` בדפדפן.

## 📚 מדריכים

- **[מדריך Deploy והפעלה גלובלית](./DEPLOYMENT_GUIDE.md)** - הוראות מפורטות להפעלת המערכת באינטרנט
- **[דוגמת משתני סביבה](./server/.env.example)** - כל המשתנים הנדרשים עם הסברים

## 🏗️ מבנה הפרויקט

```
Pump/
├── client/          # Frontend (React + Vite + TailwindCSS)
│   ├── src/
│   │   ├── pages/      # דפי האפליקציה
│   │   ├── services/   # קריאות API
│   │   └── App.tsx     # נקודת כניסה
│   └── .env            # משתני סביבה ללקוח
│
├── server/          # Backend (Node.js + Express + Prisma)
│   ├── src/
│   │   ├── controllers/  # לוגיקה עסקית
│   │   ├── routes/       # נתיבי API
│   │   ├── services/     # שירותים (מייל וכו')
│   │   ├── config/       # הגדרות (passport)
│   │   └── app.ts        # נקודת כניסה
│   ├── prisma/
│   │   └── schema.prisma # סכמת DB
│   └── .env              # משתני סביבה לשרת
│
└── DEPLOYMENT_GUIDE.md   # מדריך הפעלה מלא
```

## 🔧 טכנולוגיות

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool מהיר
- **TailwindCSS 4** - Styling
- **React Router** - ניווט

### Backend
- **Node.js** - Runtime
- **Express 5** - Web framework
- **Prisma 7** - ORM
- **PostgreSQL** - Database
- **Passport.js** - Authentication
- **Nodemailer** - Email sending
- **JWT** - Tokens

## 📧 הגדרת מיילים

ראה את [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-הגדרת-שליחת-מיילים-password-reset) להוראות מפורטות.

## 🌍 Deploy ל-Production

ראה את [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-הפעלה-גלובלית---גישה-מהאינטרנט) לאפשרויות deploy שונות.

## 🐛 בעיות נפוצות

ראה את [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#-פתרון-בעיות-נפוצות) לפתרונות.

## 📄 License

MIT
