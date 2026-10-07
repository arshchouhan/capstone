# Plant care API

The Express backend uses Mongoose models, controllers, and routes for plants, scans and photos, care schedules, recovery observations, light readings, treatment plans, calculators and formulations, community posts and comments, experts and appointments, products and carts, notifications, preferences, and cached weather.

Copy `.env.example` to `.env` and configure MongoDB and authentication secrets. Run `npm install` and `npm start` in this folder. The frontend proxies `/api` to port 5000 during development; set `VITE_API_URL` for a separate deployment.

All feature routes require the existing sign-in cookie or Bearer token. Plant resources are scoped to the authenticated owner. Product and expert creation require an admin. Uploaded images are size/type checked and saved privately under `uploads/`; preserve this directory in deployment. The API returns `{ success, data }` or `{ success: false, message }`.

`npm test` checks recurrence, calculations, schemas, ownership, and authentication. `npm run seed:demo` adds repeatable demo records for arshchouhan246@gmail.com, preserving an existing account password. A newly created account's password is printed once. `npm run verify:demo` checks the saved account through authenticated APIs. Seeded scan scores and findings are illustrative. The current scan provider is a demo implementation in `services/scanService.js`; connect an inference provider there for live analysis. Appointments and carts are saved records; payment, video sessions and external notifications are not implemented.

## Local camera

Take photo offers a phone QR code and a laptop webcam. Run the backend and frontend normally. Put the phone and laptop on the same Wi-Fi, scan the QR code, then tap Take photo on the phone. The phone uses its built-in camera and sends the photo directly to the laptop; choose Use photo to attach it. No tunnel or external service is needed. Ordinary LAN HTTP supports taking and uploading photos; phone live streaming requires a secure browser context and is not available over LAN HTTP. The laptop webcam provides live capture on localhost.

The isolated phone gateway listens on port 5001. Allow Node on your private network if Windows Firewall prompts. The laptop Wi-Fi address is detected automatically; optionally set PHONE_CAMERA_HOST when several network adapters are active. The gateway exposes no account APIs. Pairing links expire, accept one phone, and photos remain in temporary memory until attached to a scan. Closing the dialog clears the session.
