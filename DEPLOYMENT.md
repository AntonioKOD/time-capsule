# Production Deployment Guide

## 🚀 Production Checklist

### 1. Environment Setup

1. **Copy environment template:**
   ```bash
   cp env.production.example .env.local
   ```

2. **Fill in production values:**
   - Set `NODE_ENV=production`
   - Update `NEXT_PUBLIC_APP_URL` to your domain
   - Use production MongoDB connection string
   - Add production Stripe keys (live keys)
   - Configure email service (Resend/AWS SES)
   - Set secure secrets for Payload CMS

### 2. Database Configuration

1. **MongoDB Atlas Production Setup:**
   - Create production cluster
   - Configure IP whitelist for your server
   - Set up database user with appropriate permissions
   - Enable backup and monitoring

2. **Database Migration:**
   ```bash
   # Ensure your production database is set up
   npm run build:production
   ```

### 3. Security Configuration

1. **Environment Variables:**
   - Use strong, unique secrets for all keys
   - Never commit production secrets to version control
   - Use environment variable management (Vercel, Railway, etc.)

2. **HTTPS Setup:**
   - Ensure SSL certificate is configured
   - Update `NEXT_PUBLIC_APP_URL` to use https://

### 4. Performance Optimizations

1. **Build Optimization:**
   ```bash
   npm run build:production
   npm run start:production
   ```

2. **CDN Setup (Optional):**
   - Configure CDN for static assets
   - Update `NEXT_PUBLIC_CDN_URL` if using CDN

### 5. Monitoring & Analytics

1. **Error Monitoring:**
   - Set up Sentry for error tracking
   - Configure `SENTRY_DSN` in environment

2. **Analytics:**
   - Add Google Analytics ID
   - Set up performance monitoring

## 🌐 Deployment Platforms

### Vercel (Recommended)

1. **Connect Repository:**
   ```bash
   npm install -g vercel
   vercel
   ```

2. **Environment Variables:**
   - Add all production environment variables in Vercel dashboard
   - Ensure `NODE_ENV=production` is set

3. **Domain Configuration:**
   - Add custom domain in Vercel
   - Update `NEXT_PUBLIC_APP_URL`

### Railway

1. **Deploy:**
   ```bash
   npm install -g @railway/cli
   railway login
   railway deploy
   ```

2. **Environment Variables:**
   - Set variables in Railway dashboard
   - Configure custom domain

### Docker Deployment

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   RUN npm run build:production
   EXPOSE 3000
   CMD ["npm", "run", "start:production"]
   ```

2. **Build and Run:**
   ```bash
   docker build -t time-capsule .
   docker run -p 3000:3000 --env-file .env.local time-capsule
   ```

## 🔧 Post-Deployment

### 1. Health Checks

- [ ] Homepage loads correctly
- [ ] Gallery displays capsules
- [ ] Create capsule form works
- [ ] Payment processing works
- [ ] Email delivery works
- [ ] Admin panel accessible

### 2. Performance Testing

```bash
# Test build performance
npm run analyze

# Check bundle size
npm run build:production
```

### 3. SEO Verification

- [ ] Meta tags are correct
- [ ] Structured data is valid
- [ ] Sitemap is accessible
- [ ] Robots.txt is configured

### 4. Security Testing

- [ ] HTTPS is enforced
- [ ] Security headers are set
- [ ] No sensitive data in client bundle
- [ ] API endpoints are secured

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Check MongoDB connection string
   - Verify IP whitelist settings
   - Ensure database user permissions

2. **Stripe Payment Issues:**
   - Verify webhook endpoint is accessible
   - Check webhook secret matches
   - Ensure live keys are used in production

3. **Email Delivery Problems:**
   - Verify Resend API key
   - Check FROM_EMAIL domain verification
   - Test email templates

4. **Build Failures:**
   - Check TypeScript errors: `npm run type-check`
   - Verify all dependencies are installed
   - Check for missing environment variables

### Performance Issues

1. **Slow Loading:**
   - Enable compression in hosting platform
   - Optimize images and assets
   - Check database query performance

2. **High Memory Usage:**
   - Monitor MongoDB connection pooling
   - Check for memory leaks in components
   - Optimize bundle size

## 📊 Monitoring

### Key Metrics to Track

- **Performance:**
  - Page load times
  - API response times
  - Database query performance

- **Business:**
  - Capsule creation rate
  - Payment success rate
  - User engagement

- **Technical:**
  - Error rates
  - Uptime
  - Resource usage

### Recommended Tools

- **Error Tracking:** Sentry
- **Performance:** Vercel Analytics, Google PageSpeed
- **Uptime:** UptimeRobot
- **Database:** MongoDB Atlas monitoring

## 🔄 Maintenance

### Regular Tasks

1. **Weekly:**
   - Check error logs
   - Monitor performance metrics
   - Review security alerts

2. **Monthly:**
   - Update dependencies
   - Review database performance
   - Check backup integrity

3. **Quarterly:**
   - Security audit
   - Performance optimization
   - Feature usage analysis

### Backup Strategy

1. **Database Backups:**
   - MongoDB Atlas automatic backups
   - Test restore procedures

2. **Code Backups:**
   - Git repository with multiple remotes
   - Tagged releases for rollback

## 📞 Support

For deployment issues:
1. Check this guide first
2. Review error logs
3. Check environment variables
4. Test in development environment
5. Contact support if needed

---

**Remember:** Always test in a staging environment before deploying to production! 