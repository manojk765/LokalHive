# 1. Use official Node.js image as the base
FROM node:18-alpine AS builder

# 2. Set working directory
WORKDIR /app

# 3. Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# 4. Copy the rest of your app
COPY . .

# 5. Build the Next.js app
RUN npm run build

# 6. Production image, copy built assets and install only production deps
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# If you use .env files, copy them here
COPY .env .env

# Copy only necessary files for running the app
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/next-env.d.ts ./next-env.d.ts
COPY --from=builder /app/tailwind.config.ts ./tailwind.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs

# 7. Expose port and start the app
EXPOSE 3000
CMD ["npm", "start"]