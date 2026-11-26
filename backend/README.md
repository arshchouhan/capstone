# Plant care API

The Express backend uses Mongoose models, controllers, and routes for plants, scans and photos, care schedules, recovery observations, light readings, treatment plans, calculators and formulations, community posts and comments, experts and appointments, products and carts, notifications, preferences, and cached weather.

## Local plant diagnosis

Run `npm run ai:download` once from `backend` to download and verify the publicly released [AgriSmart ONNX models](https://github.com/Vatsal2008/AgriSmart-AI/tree/main/models). `npm start` then runs inference locally on the CPU. Photos stay on the backend and no inference API key is required. India v1 covers 59 crops and 387 crop-condition classes. Core v2 is available for a second opinion when India v1 is uncertain. The health score is the share of model support for healthy classes within the predicted crop.

To use the previous Python service, set `AI_MODEL_PROVIDER=team-resnet` and start it with `npm run ai:start`. Set `AI_MODEL_PROVIDER=demo` for sample results.

Copy `.env.example` to `.env` and configure MongoDB and authentication secrets. Run `npm install` and `npm start` in this folder. The frontend proxies `/api` to port 5000 during development; set `VITE_API_URL` for a separate deployment.

All feature routes require the existing sign-in cookie or Bearer token. Plant resources are scoped to the authenticated owner. Product and expert creation require an admin. Uploaded images are size/type checked and saved privately under `uploads/`; preserve this directory in deployment. The API returns `{ success, data }` or `{ success: false, message }`.

`npm test` checks recurrence, calculations, schemas, ownership, and authentication. `npm run seed:demo` adds repeatable demo records for arshchouhan246@gmail.com, preserving an existing account password. A newly created account's password is printed once. `npm run verify:demo` checks the saved account through authenticated APIs. Seeded plant photos come from the local PlantDoc test split in the Python repo. The seed runs each selected photo through the local AgriSmart scan service and saves its actual result. Run `node scripts/refreshDemoPlantScans.js` to refresh the original seeded plant records for the demo account. Set `AI_MODEL_PROVIDER=local` for free local inference; the Transformers.js models download once and run on the backend without a token or hosted inference credits. Set `AI_MODEL_PROVIDER=huggingface` only when using a Hugging Face account with hosted inference credits. The local model uses ImageNet labels and maps them into the website scan result shape with confidence, health status, findings, and care requirements. Scan workspace conversations are saved per scan and use the free local `Xenova/flan-t5-small` chat model by default; the first question downloads that model. For faster local chat, install Ollama, pull a model, and set `OLLAMA_ENABLED=true`. Uploaded photos stay on the backend in local mode. Appointments and carts are saved records; payment, video sessions and external notifications are not implemented.

## Local camera

Take photo offers a phone QR code and a laptop webcam. Run the backend and frontend normally. Put the phone and laptop on the same Wi-Fi, scan the QR code, then tap Take photo on the phone. The phone uses its built-in camera and sends the photo directly to the laptop; choose Use photo to attach it. No tunnel or external service is needed. Ordinary LAN HTTP supports taking and uploading photos; phone live streaming requires a secure browser context and is not available over LAN HTTP. The laptop webcam provides live capture on localhost.

The isolated phone gateway listens on port 5001. Allow Node on your private network if Windows Firewall prompts. The laptop Wi-Fi address is detected automatically; optionally set PHONE_CAMERA_HOST when several network adapters are active. The gateway exposes no account APIs. Pairing links expire, accept one phone, and photos remain in temporary memory until attached to a scan. Closing the dialog clears the session.

## Plant location and satellite inspection

Registration and Plant info accept device coordinates or manual latitude and longitude. Device location requires browser permission and HTTPS or localhost. The OpenStreetMap view starts at a world overview and pins the plant once coordinates are saved. The Satellite layer requests Esri World Imagery for the saved coordinates.

NDVI and red-edge chlorophyll (NDRE) previews use public Sentinel-2 Level-2A imagery from Earth Search by default. The backend reads the cloud mask and the four spectral bands for an area approximately 320 m wide, centered on the plant, and reports the imagery date and unmasked coverage. It searches the last 30 days for usable imagery. To use Copernicus Data Space when available, add its Sentinel Hub OAuth client as `CDSE_CLIENT_ID` and `CDSE_CLIENT_SECRET` in `backend/.env`. The backend falls back to Earth Search if Copernicus is unavailable or returns no usable pixels.

Run `npm run seed:plant-info` to populate crop guides and labeled example observations for the existing demo plants. This can run independently of the AI scan seed.

## Google Calendar and Meet

Both portals offer Connect Google in Experts (grower) and My Connections (doctor). Doctors create meetings from upcoming booked consultations; the grower sees the same saved Meet link. Scheduling sends a Calendar invitation to the grower's connected Google address, or their registered email. Gmail inbox access is not requested. Cancellation removes the Google event before marking the local appointment cancelled. If Google access was revoked, reconnect the organizer first.

Setup in your own Google Cloud project:
1. Enable Google Calendar API.
2. Configure Google Auth Platform branding, audience and consent; while testing, add the doctor and grower Google accounts as test users.
3. Create an OAuth client of type Web application with authorized redirect URI `http://localhost:5173/api/google/callback` (must exactly match the server setting). Vite proxies this local callback to the backend.
4. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI, GOOGLE_FRONTEND_ORIGIN and GOOGLE_TOKEN_KEY in backend/.env. Generate a 32-byte hex encryption key using the command in .env.example. Keep that key stable and private; losing it requires reconnecting accounts.
5. Restart backend, sign into each portal and select Connect Google. The doctor must have an Expert profile linked via its user field (automatic for doctor registration).

Production requires your deployed HTTPS callback and frontend origin, a persistent secure session store, and the Google consent/verification requirements applicable to your audience. Each account must consent; no Cloud Console access is needed by end users. Refresh tokens are encrypted using AES-256-GCM and never returned to the browser. Credentials are not included in source. Google Calendar connection and live meeting creation cannot be verified without configured OAuth credentials and consent.
