FROM ubuntu:22.04 as base
RUN apt-get update
RUN apt-get -y install software-properties-common
RUN add-apt-repository ppa:ubuntu-toolchain-r/test
RUN apt-get update
RUN apt-get -y upgrade libstdc++6

FROM base as nodeinstaller
RUN apt install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install -y nodejs
RUN npm install -g yarn

FROM nodeinstaller as setup
COPY . .
RUN yarn install

FROM setup as builder
RUN yarn workspace @lbc/dualsense build

FROM builder as runner
WORKDIR /app
COPY --from=builder /packages/controllers/dualsense/dist/src .

#CMD ["ls", "-l"]
CMD ["node", "index.js"]