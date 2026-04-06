# Accuva Wealth — Deployment Guide

## Deploy to Vercel in 5 Minutes

### Step 1 — Create a GitHub Account
Go to https://github.com and sign up (free).

### Step 2 — Create a New Repository
1. Click the **+** button top right → **New repository**
2. Name it: `accuva-wealth`
3. Set it to **Private**
4. Click **Create repository**

### Step 3 — Upload Your Files
1. Click **uploading an existing file**
2. Drag and drop ALL files from this folder into GitHub
3. Make sure the folder structure looks like this:
```
accuva-wealth/
├── pages/
│   ├── index.jsx
│   ├── _app.jsx
│   └── _document.jsx
├── styles/
│   └── globals.css
├── package.json
├── next.config.js
└── README.md
```
4. Click **Commit changes**

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com and sign up with your GitHub account
2. Click **Add New Project**
3. Select your `accuva-wealth` repository
4. Vercel will auto-detect it as a Next.js project
5. Click **Deploy**
6. Wait ~60 seconds ✅

### Step 5 — Your Site is Live!
Vercel gives you a URL like:
`https://accuva-wealth.vercel.app`

You can set a custom domain in Vercel → Project Settings → Domains.

---

## How Users Access It
When someone visits your site, they'll see the Accuva Wealth login screen and enter their own Groq API key (free at https://console.groq.com).

---

## Updating Your Site
Whenever you want to make changes:
1. Edit the files
2. Upload to GitHub (it will ask you to replace existing files — say yes)
3. Vercel automatically redeploys within 60 seconds

---

Built with Next.js · Powered by Groq · Accuva Wealth v2.0
