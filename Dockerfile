FROM node:20-bookworm-slim

WORKDIR /app

# Install FFmpeg, Python, pip, certificates, and curl
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    python3-pip \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install latest yt-dlp
RUN pip3 install --break-system-packages -U "yt-dlp[default]"

# Install production dependencies
COPY package*.json ./

RUN npm ci --omit=dev

# Copy project files
COPY . .

# Create temporary downloads folder
RUN mkdir -p downloads

ENV NODE_ENV=production
ENV PORT=3030
ENV FFMPEG_PATH=ffmpeg
ENV YTDLP_PATH=yt-dlp

EXPOSE 3030

CMD ["npm", "start"]