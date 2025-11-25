# Debug Guide - Google OAuth Flow

## בואו נבדוק בדיוק מה קורה

אני צריך שתעזור לי להבין בדיוק איפה השגיאה מתרחשת.

### שאלות חשובות:

**1. מה קורה כשאתה לוחץ "Sign in with Google"?**

בבקשה עקוב אחרי השלבים האלה **בדיוק** וספר לי מה קורה:

#### שלב 1: פתח Developer Tools
- לחץ F12 בדפדפן
- עבור לכרטיסייה **Network**
- וודא שהאפשרות "Preserve log" מסומנת ✅

#### שלב 2: לחץ "Sign in with Google"

#### שלב 3: עקוב אחרי ה-Requests

**ספר לי:**

**א. האם הגעת לעמוד Google OAuth?**
- ✅ כן - ראיתי את עמוד ההתחברות של Google
- ❌ לא - מיד קיבלתי שגיאת "אתר מסוכן"

**ב. אם הגעת לGoogle, מה קרה אחרי שהתחברת?**
- ✅ חזרתי לאתר שלי
- ❌ קיבלתי שגיאת "אתר מסוכן"
- ❌ קיבלתי Error 400 redirect_uri_mismatch

**ג. ב-Network tab, מה אתה רואה?**
צור screenshot של ה-Network tab ושלח לי

---

## בינתיים, בואו נבדוק את השרת

### האם השרת ב-Azure בכלל עובד?

**פתח דפדפן חדש וגש ל:**
```
https://pump-server-ghhkkhhggb7dfaegx.israelcentral-01.azurewebsites.net/
```

**מה אתה רואה?**
- ✅ "PUMP API is running" 
- ❌ Error 404 / 500
- ❌ "אתר מסוכן"

---

### בדיקת health check

**גש ל:**
```
https://pump-server-ghhkkhhggb7dfaegx.israelcentral-01.azurewebsites.net/api/health/db
```

**מה אתה רואה?**
- ✅ JSON עם "status": "success"
- ❌ שגיאה

---

## בדיקת Google OAuth endpoint

**גש ישירות ל:**
```
https://pump-server-ghhkkhhggb7dfaegx.israelcentral-01.azurewebsites.net/api/auth/google
```

**מה קורה?**
- ✅ מפנה אותי ל-Google OAuth
- ❌ "אתר מסוכן"
- ❌ Error 404
- ❌ משהו אחר

---

## בדיקת הלוגים באAzure

אם אתה יכול, בדוק את הלוגים:

1. Azure Portal → App Service
2. Monitoring → **Log stream**
3. נסה שוב "Sign in with Google"
4. **צור screenshot של הלוגים** - זה יראה לנו מה השרת רואה

---

## בינתיים - האם זו בעיית SSL?

שגיאת "אתר מסוכן" יכולה להיות בגלל:

**1. Azure App Service משתמש ב-HTTP במקום HTTPS**

בדוק ב-Azure Portal:
- App Service → Configuration → **General settings**
- וודא ש-**HTTPS Only** מופעל ✅

**2. Mixed Content (HTTP + HTTPS)**

זה קורה אם:
- Frontend (HTTPS) → Backend (HTTP) ❌
- או להפך

---

## אפשרות: הבעיה היא ב-Vercel, לא באAzure

**נסה את זה:**

במקום לגשת דרך Vercel (`https://pump-client.vercel.app`), נסה לגשת ישירות ל:

```
https://pump-server-ghhkkhhggb7dfaegx.israelcentral-01.azurewebsites.net/api/auth/google
```

**אם זה עובד** - הבעיה היא ב-CLIENT_URL או ב-Vercel configuration!

---

## תשובות שאני צריך ממך:

1. ✅ מה אתה רואה כשניגש ל-`https://pump-server-...azurewebsites.net/`?
2. ✅ מה קורה כשניגש ישירות ל-`https://pump-server-.../api/auth/google`?
3. ✅ האם "HTTPS Only" מופעל באAzure?
4. ✅ screenshots של Network tab כשאתה מנסה להתחבר עם Google
5. ✅ (אופציונלי) screenshots של לוגים באAzure

**אחרי שתענה, אני אוכל לאבחן בדיוק איפה הבעיה!** 🔍
