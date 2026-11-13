# Đóng gói ứng dụng Smart CRM L2 (Node.js). Build: docker compose up -d --build
FROM node:20-alpine
WORKDIR /app

# 1. Chép tệp khoá trước: chỉ cài lại thư viện khi package-lock.json đổi (tận dụng cache)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2. Mã nguồn, giao diện, migration, dữ liệu mẫu và bộ kiểm thử (để chạy `docker compose exec app npm test`)
COPY src ./src
COPY public ./public
COPY scripts ./scripts
COPY migrations ./migrations
COPY seeds ./seeds
COPY tests ./tests

# 3. Không chạy bằng root
USER node
EXPOSE 3000

# Khi khởi động: dựng bảng và nạp dữ liệu mẫu (chạy lại nhiều lần vẫn an toàn), rồi chạy máy chủ.
CMD ["sh", "-c", "npm run setup && exec node src/server.js"]
