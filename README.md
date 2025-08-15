# IMGD Mobile

## Prerequisites
- Node 18+
- Expo CLI: `npm i -g expo`
- Android Studio (emulator) or a real device with Expo Go

## Setup
1. `cp .env.example .env` and set `API_BASE_URL` to your Spring backend origin.
2. `npm i`
3. `npm run start`
4. Press `a` for Android (or scan QR with Expo Go).

## Notes
- Refresh flow assumes `POST /auth/refresh` returns `{ accessToken, refreshToken? }`.
- If your backend uses HttpOnly cookie named `refreshTokenForKnock`, keep `withCredentials: true` and allow CORS for the app origin.
- For social login (Kakao/Google) via backend OAuth controller, add an in-app browser or deep-link redirect to capture tokens on success.
```

---

## 🔌 CORS & Cookies Checklist (Spring + Mobile)
- CORS: allow the Expo dev URL (e.g., `http://192.168.x.x:8081`) and the production app scheme/origin.
- Set `SameSite=None; Secure` for refresh cookies (already used in your backend).
- For Android emulator calling host machine: use `10.0.2.2` if developing without a reverse proxy.

---

## 🔁 (Optional) OAuth via In-App Browser / Deep Link
- Use `expo-auth-session` or open your backend OAuth URL (e.g., `/oauth2/authorization/google`) in a web view.
- Configure redirect to `imgd://oauth/callback` then parse code/token and exchange with backend.

---

### Where you likely need to align with your backend now
1. **Endpoint paths**: `/group/addGroupUser`, `/file/makeGroupDir`, `/file/makeFile`, `/file/upload`, `/auth/*` → adjust to exact controller mappings.
2. **Multipart field names** for uploads (e.g., `@RequestPart("file")`).
3. **Auth payload & response** shapes (login, refresh, logout).
4. **CORS origins** and `withCredentials` behavior.

> Drop your exact endpoint paths/DTOs and I’ll patch this skeleton to 100% match.
