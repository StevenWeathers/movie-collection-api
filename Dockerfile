FROM node:6

EXPOSE 3000

COPY ./ /usr/src/movie-collection-api

RUN cd /usr/src/movie-collection-api; npm install

CMD [ "node", "/usr/src/movie-collection-api/src/server.js" ]