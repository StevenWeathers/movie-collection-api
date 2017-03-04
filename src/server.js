"use strict";

const Hapi = require("hapi");
const server = new Hapi.Server();
const HapiAuthJWT = require("hapi-auth-jwt");
const { graphql, GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList } = require('graphql');

const Movie = new GraphQLObjectType({
  name: 'Movie',
  fields: {
    ID: {
      type: GraphQLID
    },
    DVD_Title: {
      type: GraphQLString
    },
    Studio: {
      type: GraphQLString
    },
    Released: {
      type: GraphQLString
    },
    Status: {
      type: GraphQLString
    },
    Sound: {
      type: GraphQLString
    },
    Year: {
      type: GraphQLString
    },
    Genre: {
      type: GraphQLString
    },
    UPC: {
      type: GraphQLString
    },
    ID: {
      type: GraphQLString
    }
  }
});

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'MovieQuery',
    fields: { // fields define the root of our query
      movie: {
        type: Movie,
        args: { // arguments we accept from the query
          ID: {
            type: GraphQLID
          }
        },
        resolve: function(_, args) {

          return movie.find(movie => {
            return movie.ID === args.ID
          });
        }
      },
      movies: {
        type: new GraphQLList(Movie),
        resolve: function(_, args) {
          return movies;
        }
      }
    }
  }),
});


const secretKey = process.env.jwtkey || "everythingisawesome";
const jwtAlgorithm = process.env.jwtalgo || "HS256";

server.connection({
  port: 8080
});

server.register(HapiAuthJWT, (err) => {

  server.auth.strategy("token", "jwt", {
    key: secretKey,
    verifyOptions: {
      algorithms: [ jwtAlgorithm ],
    }
  });

});

server.route({
  path: '/auth',
  method: 'POST',
  handler: (request, reply) => {

    const { username, password } = request.payload;

    // @TODO - hook up DB query to get user by username to compare passwords

    // Honestly, this is VERY insecure. Use some salted-hashing algorithm and then compare it.
    // user.password === password
    if (password) {
      const token = jwt.sign({
        username,
        // scope: user.guid,
      }, secretKey, {
        algorithm: jwtAlgorithm,
        expiresIn: '1h'
      });

      return reply({
        token,
        // scope: user.guid,
      });
    } else {
      return reply( 'incorrect password' );
    }
  }
});

// Add the route
server.route({
  method: 'GET',
  path:'/movies',
  handler: function (request, reply) {

    // @TODO - get data from DB
    const movies = [
      {
        DVD_Title: "Doctor Strange",
        Studio: "Marvel",
        Released: "2016",
        Status: "Released",
        Sound: "Atmos",
        Year: "2016",
        Genre: "Science Fiction",
        UPC: "1337007",
        ID: "1"
      },
      {
        DVD_Title: "Star Wars Rogue One",
        Studio: "Lucus Arts",
        Released: "2016",
        Status: "Released",
        Sound: "Atmos",
        Year: "2016",
        Genre: "Science Fiction",
        UPC: "1337006",
        ID: "2"
      }
    ];

    const defaultData = `
      {
        movies {
          DVD_Title
          Studio
          Released
          Status
          Sound
          Year
          Genre
          UPC
          ID
        }
      }
    `;

    const requestedData = (request.query.query) ? request.query.query : defaultData;

    return graphql(schema, requestedData, movies).then((response) => {

      console.log(response);

      return reply(response);

    });
  }
});

server.start(err => {

  if (err) {
    throw err;
  }

  console.log(`Server started at ${ server.info.uri }`);

});
