FROM node:22-alpine AS build
WORKDIR /app

RUN npm install --global pnpm@10.32.1

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
# Supply Vite settings with: docker build --secret id=vite_env,src=.env -t kariyer-basvuru-web .
RUN --mount=type=secret,id=vite_env,target=/app/.env pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
