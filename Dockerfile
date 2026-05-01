FROM node:24-alpine

WORKDIR /app

COPY server/package*.json ./server/
RUN npm ci --prefix server

COPY server ./server
COPY shared ./shared

ARG VCS_REF
LABEL org.opencontainers.image.revision=$VCS_REF

EXPOSE 3001
CMD ["npm", "run", "start", "--prefix", "server"]
