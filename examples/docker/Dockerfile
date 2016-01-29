FROM node:4

EXPOSE 8080

# Install app dependencies
COPY package.json /src/package.json
RUN cd /src; npm install

# Bundle app source
COPY . /src

# Run frock
ENV FROCK_UNSAFE_DISABLE_CONNECTION_FILTERING true
ENV FROCK_NO_WATCH true
WORKDIR /src
CMD ["npm", "start"]
