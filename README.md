
<<<<<<< HEAD
=======
Gicomm (digital commission) is the most interactive AI for creating digital products and providing assistance. 
This artificial intelligence consistently operates under the auspices of Gicont (Digital Control), a company owned by Zarvis.

# Gicomm AI v2

Vanilla HTML/CSS/JS foundation for the next Gicomm AI build.

Included:
- Clean hero landing page before login
- Real Google OAuth through Supabase Auth
- Persistent Supabase session
- Account menu + settings window
- System / White / Black theme
- Theme persistence
- Image-only attachment picker: PNG/JPG/JPEG/WEBP/GIF
- Image preview + remove
- 4000-character composer limit
- Speech-to-text into the textbox
- Manual text-to-speech: Play / Pause / Resume / Replay
- Responsive desktop/mobile layout
- Keyboard shortcuts
- Basic UI bug-proofing and event handling
- Vercel-ready static deployment

## 1. Configure Supabase

Open `js/config.js`.

Replace:

`PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`

with your Supabase Project URL.

Replace:

`PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE`

with your Supabase publishable key.

Do NOT put a `service_role` key in this file.

## 2. Supabase Auth

Google provider must be enabled in Supabase.

For Google OAuth, Supabase's Google setup requires the application's production origin and the Supabase callback URL to be configured in the Google OAuth client.

For the deployed site, add the Vercel URL as the application's origin and use the callback URL shown by your Supabase Google provider settings.

Also configure Supabase Authentication URL settings:
- Site URL: your Vercel production URL
- Redirect URLs: your Vercel production URL

For local testing, add the exact localhost URL you are using.

## 3. Local testing

Because OAuth and browser APIs behave better over HTTP than opening the file directly, run a local server.

If Python is installed:

`python -m http.server 5500`

Then open:

`http://localhost:5500`

Do not use `file:///.../index.html`.

## 4. Vercel

Recommended:
1. Create a GitHub repository.
2. Upload this project.
3. Import the repository into Vercel.
4. Deploy.
5. Copy the resulting `https://....vercel.app` URL.
6. Add that exact origin to Google OAuth.
7. Add the exact production URL to Supabase Auth URL configuration.

No build command is required for this static project.

## 5. Important

The AI response is intentionally a frontend demo in this version. The actual AI API is NOT connected yet.

Next backend phase:
- Supabase database
- profiles
- conversations
- messages
- Row Level Security
- AI API/server-side proxy
- streaming responses
- real chat history
- secure image storage
>>>>>>> 1cd910a (git mode)
