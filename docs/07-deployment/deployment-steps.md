# الـ Deployment — Nilotic Frost ERP

## الوضع الحالي

البروتوتايب هو **Static HTML فقط** — يمكن نشره على أي hosting ثابت.

---

## خطوات نشر البروتوتايب (Static)

### على GitHub Pages
```bash
git init
git add .
git commit -m "Initial prototype"
git branch -M main
git remote add origin https://github.com/yourorg/nilotic-frost-erp.git
git push -u origin main
# في GitHub: Settings → Pages → Branch: main
```

### على Netlify / Vercel
```
1. اربط الـ repo بـ Netlify
2. Build command: (فارغ — لا يوجد build)
3. Publish directory: base_prototype
4. Deploy!
```

### على أي Host عادي (FTP)
```bash
# ارفع مجلد base_prototype/ كاملاً على الـ server
# لا يحتاج PHP أو Node
```

---

## خطوات نشر النظام الكامل (مستقبلاً)

### للـ Backend (Docker)
```dockerfile
# Dockerfile مقترح
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

### للـ Database (PostgreSQL)
```bash
# بـ Docker Compose
docker-compose up -d postgres
npm run db:migrate
npm run db:seed   # بيانات أولية
```

---

## المتطلبات للإنتاج

| المكوّن | المواصفة الدنيا |
|--------|--------------|
| Backend Server | 2 vCPU, 4GB RAM |
| Database | PostgreSQL 15+, 50GB SSD |
| Web Server | Nginx كـ reverse proxy |
| SSL | Let's Encrypt (مجاني) |
| Backups | يومية تلقائية |
