FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Accept VITE variables during build if needed
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Default port
ENV PORT=3005
EXPOSE $PORT

CMD ["sh", "-c", "npm run dev -- --port $PORT --host 0.0.0.0"]
