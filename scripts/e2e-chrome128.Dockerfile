FROM ubuntu:24.04

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
  ca-certificates curl unzip socat libgtk-3-0t64 libnss3 libasound2t64 libgbm1 libxss1
RUN curl -fsSL https://storage.googleapis.com/chrome-for-testing-public/128.0.6613.137/linux64/chrome-linux64.zip -o /tmp/chrome.zip \
  && unzip -q /tmp/chrome.zip -d /opt \
  && unlink /tmp/chrome.zip
