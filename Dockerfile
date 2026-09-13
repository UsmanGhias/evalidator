FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm install --production 2>/dev/null || true
EXPOSE 3000
CMD ["node", "--version"]
