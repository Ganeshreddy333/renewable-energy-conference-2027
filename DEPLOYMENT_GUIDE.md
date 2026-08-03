# 🚀 Deployment Guide - Production Ready

This guide will help you deploy your conference application using the following stack:
- **Domain**: Hostinger
- **Frontend**: Vercel (Free)
- **Backend**: Render (Free)
- **Database**: MySQL (Free/local or managed)
- **Images**: Cloudinary (Free)
- **Emails**: Resend (Free)

---

## 📋 Pre-Deployment Checklist

- [ ] Node.js 18+ installed locally
- [ ] All services accounts created (Render or Hostinger, Vercel or Hostinger, Cloudinary, Resend, Hostinger)
- [ ] Environment variables prepared
- [ ] Database migrations tested locally
- [ ] Code committed to Git repository

---

## 🔧 Step 1: Setup External Services

### 1.1 MySQL Database

1. Set up a MySQL database using a local server, Docker, or a managed provider
2. Create a database for the app, for example `conference_db`
3. Copy the connection string in MySQL format
4. Format: `mysql://user:password@host:3306/conference_db`
5. Store this safely - you'll need it for environment variables

**Important**:
- Use a dedicated user with access only to the app database
- Keep the database credentials secured in environment variables
- Consider connection pooling for production if using a managed MySQL service

### 1.2 Cloudinary (Image Storage)

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Go to **Dashboard** → copy:
   - Cloud Name
   - API Key
   - API Secret (keep this private!)
3. Store these in environment variables

### 1.3 Resend (Email Service)

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** and create a new key
3. Add your domain to verified senders (use Hostinger domain)
4. Copy the API key to environment variables

**Free tier**: 100 emails/day

### 1.4 Hostinger Domain Setup

1. If you don't have a domain, purchase from [hostinger.com](https://hostinger.com)
2. Ensure you can manage DNS records
3. You'll configure DNS records pointing to Vercel and Render later

---

## 🗄️ Step 2: Setup Backend on Render

### 2.1 Prepare Backend

```bash
cd backend

# Install dependencies
npm install

# Build the project
npm run build

# Test locally (with .env file)
npm run dev
```

### 2.2 Deploy to Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `conference-api`
   - **Environment**: `Node`
   - **Region**: `Oregon` (free tier)
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### 2.3 Set Environment Variables on Render

In Render dashboard for your service, go to **Environment**:

```
NODE_ENV=production
API_PORT=3001
DATABASE_URL=mysql://user:password@host:3306/conference_db
JWT_SECRET=your-super-secret-key-generate-one
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RESEND_API_KEY=re_xxxxxxxxxxxxx
EMAIL_FROM=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=secure-password
ADMIN_FIRST_NAME=Admin
ADMIN_LAST_NAME=User
```

### 2.4 Run Database Migrations on Render

After deployment:

1. Go to your Render service dashboard
2. Click **Shell** tab
3. Run:
```bash
npm run migrate:deploy
npm run seed:admin
```

**Note**: Free tier on Render auto-sleeps after 15 minutes of inactivity. Consider upgrading for production.

---

## 🎨 Step 3: Deploy Frontend on Vercel

### 3.1 Prepare Frontend

```bash
cd frontend

# Install dependencies
npm install

# Build locally to test
npm run build

# Test production build
npm start
```

### 3.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click **New Project**
3. Select your repository
4. Configure:
   - **Project Name**: `conference-frontend`
   - **Framework**: Next.js (auto-detected)

### 3.3 Set Environment Variables on Vercel

In Vercel project settings, go to **Environment Variables**:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.example.com
NEXT_PUBLIC_APP_NAME=Conference
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_PAYMENT_TEST_PROVIDER=stripe
```

### 3.4 Deploy

- Vercel auto-deploys on push to your main branch
- Or manually trigger from dashboard

---

## 🌐 Step 4: Configure Domain on Hostinger

### 4.1 Setup DNS Records

In Hostinger DNS Management:

**For Frontend (Vercel):**
- Type: `CNAME`
- Name: `yourdomain.com` (or `www`)
- Value: `cname.vercel-dns.com.`

**For Backend (Render):**
- Type: `CNAME`
- Name: `api` (creates api.yourdomain.com)
- Value: Your Render service domain

Check Vercel and Render docs for exact CNAME values.

### 4.2 Update Environment Variables

After domain setup is complete:

**Backend (Render)**:
```
FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com
```

**Frontend (Vercel)**:
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

Redeploy both services after updating.

---

## ✅ Step 5: Verify Everything Works

### 5.1 Backend Health Check

```bash
curl https://api.yourdomain.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-06-06T10:30:00.000Z"}
```

### 5.2 Frontend Access

Visit `https://yourdomain.com` in your browser

### 5.3 Test Authentication

1. Try registering a new user
2. Check email delivery (check Resend logs)
3. Login with the new account

### 5.4 Test Image Upload

1. Try uploading a profile picture
2. Verify it appears correctly
3. Check Cloudinary dashboard for uploaded images

---

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to a random 32+ character string
- [ ] Change `ADMIN_PASSWORD` to a secure password
- [ ] Enable HTTPS everywhere (Vercel and Hostinger)
- [ ] Setup CORS correctly (only allow your domain)
- [ ] Rotate API keys regularly
- [ ] Never commit `.env` files to Git
- [ ] Use `.env.example` for reference only
- [ ] Setup database backups for MySQL (daily automated backup)

---

## 📊 Monitoring & Maintenance

### Monitor Your Services

- **Hostinger**: App, database, and uptime monitoring
- **Backend API**: Logs, health checks, and request monitoring
- **MySQL**: Database query metrics and backups
- **Cloudinary**: Storage usage and request logs
- **Resend**: Email delivery logs and metrics

### Scaling Considerations

**When to upgrade from free tier:**

| Service | Limit | Action |
|---------|-------|--------|
| Render | 15-min auto-sleep | Upgrade to Hobby ($7/month) |
| MySQL | local or managed | ✅ |
| Vercel | 100GB bandwidth/month | Usually won't hit |
| Cloudinary | 25GB storage | Upgrade plan |
| Resend | 100 emails/day | Upgrade plan |

---

## 🆘 Troubleshooting

### Issue: Backend not connecting to database
```
- Check DATABASE_URL format
- Verify MySQL service is running
- Test connection locally first
- Check backend logs and health endpoint
```

### Issue: CORS errors
```
- Verify FRONTEND_URL on Render matches your domain
- Check browser console for exact error
- Ensure protocol (https://) is included
```

### Issue: Emails not sending
```
- Verify RESEND_API_KEY is correct
- Check EMAIL_FROM matches verified sender
- Check Resend dashboard for delivery logs
- Verify email template HTML is valid
```

### Issue: Images not uploading
```
- Verify CLOUDINARY_* env vars are correct
- Check file size limits
- Verify CORS settings in Cloudinary
- Check backend logs for error details
```

### Issue: Render service keeps sleeping
```
- This is normal on free tier
- Upgrade to paid plan to remove auto-sleep
- Or: Add external pinger service (UptimeRobot is free)
```

---

## 📚 Useful Links

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Resend Documentation](https://resend.com/docs)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 🎉 Congratulations!

Your application is now live! 

**Next Steps:**
1. Monitor the services for the first week
2. Gather user feedback
3. Scale services as needed
4. Setup automated backups
5. Plan for future enhancements

Good luck with your conference! 🚀
