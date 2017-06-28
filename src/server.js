"use strict";

const Hapi = require("hapi");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);
const server = new Hapi.Server();
const JWT = require("jsonwebtoken");
const HapiAuthJWT = require("hapi-auth-jwt2");

const {MongoClient, ObjectId} = require("mongodb");
const mongoHost = process.env.mongo_host || "db";
const mongoPort = process.env.mongo_port || "27017";
const mongoCollection = process.env.mongo_collection || "moviecollection";
const mongoDbUrl = `mongodb://${mongoHost}:${mongoPort}/${mongoCollection}`;

const { graphql, GraphQLSchema, GraphQLObjectType, GraphQLID, GraphQLString, GraphQLList } = require("graphql");

const Movie = new GraphQLObjectType({
  name: "Movie",
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
    },
    _id: {
      type: GraphQLString
    }
  }
});

// Joi Validation Schemas
const movieSchema = Joi.object().keys({
    DVD_Title: Joi.string().required(),
    Studio: Joi.string().required(),
    Released: Joi.string().required(),
    Status: Joi.string().required(),
    Sound: Joi.string().required(),
    Year: Joi.string().required(),
    Genre: Joi.string().required(),
    UPC: Joi.string().required(),
    ID: Joi.string().required()
});

const moviesSchema = Joi.array().items(movieSchema);

// JWT settings
const secretKey = process.env.jwtkey || "everythingisawesome";
const jwtAlgorithm = process.env.jwtalgo || "HS256";
const jwtExpires = process.env.jwtexpires || "1h";

server.connection({
  port: 8080
});

server.register(HapiAuthJWT, (err) => {

  // @TODO - update validate to read from a DB and validate session
  const validate = (decoded, request, callback) => {
    const session = {
      index : "time",
      type  : "session",
      id    : decoded.jti  // use SESSION ID as key for sessions
    }; // jti? >> http://self-issued.info/docs/draft-ietf-oauth-json-web-token.html#jtiDef

    // ES.READ(session, function(res){
    //   if (res.found && !res._source.ended) {
    //     return callback(null, true); // session is valid
    //   } else {
    //     return callback(null, false); // session expired
    //   }
    // });
    return callback(null, true); // session is valid
  };

  server.auth.strategy("jwt", "jwt", {
    key: secretKey,
    validateFunc: validate,
    verifyOptions: {
      algorithms: [ jwtAlgorithm ],
    }
  });

  // @todo - add auth by default, turn off for GET and Auth routes
  // server.auth.default('jwt');

});

// Route to authenticate with the API
server.route({
  path: "/auth",
  method: "POST",
  handler: (request, reply) => {

    const { username, password } = request.payload;

    // @TODO - hook up DB query to get user by username to compare passwords

    // Honestly, this is VERY insecure. Use some salted-hashing algorithm and then compare it.
    // user.password === password
    if (password) {
      const token = JWT.sign({
        username,
        // scope: user.guid,
      }, secretKey, {
        algorithm: jwtAlgorithm,
        expiresIn: jwtExpires
      });

      return reply({
        token,
        // scope: user.guid,
      });
    } else {
      return reply( "incorrect password" );
    }
  }
});

// Route to get all the movies in the collection
server.route({
  method: "GET",
  path:"/movies",
  handler: (request, reply) => {

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
          _id
        }
      }
    `;

    const requestedData = (request.query.query) ? request.query.query : defaultData;

    return MongoClient.connect(mongoDbUrl, (err, db) => {
      const collection = db.collection("movies");

      // temporary hack to insert dummy movies for development, to be removed completely later
      // const movies = [
      //   {
      //     DVD_Title: "Doctor Strange",
      //     Studio: "Marvel",
      //     Released: "2016",
      //     Status: "Released",
      //     Sound: "Atmos",
      //     Year: "2016",
      //     Genre: "Science Fiction",
      //     UPC: "1337007",
      //     ID: "1"
      //   },
      //   {
      //     DVD_Title: "Star Wars Rogue One",
      //     Studio: "Lucus Arts",
      //     Released: "2016",
      //     Status: "Released",
      //     Sound: "Atmos",
      //     Year: "2016",
      //     Genre: "Science Fiction",
      //     UPC: "1337006",
      //     ID: "2"
      //   }
      // ];
      // collection.insertMany(movies, (err, result) => {
      //   console.log("Inserted 3 documents into the document collection");
      // });

      return collection.find({}).toArray((err, movies) => {
        db.close();

        const schema = new GraphQLSchema({
          query: new GraphQLObjectType({
            name: "MovieQuery",
            fields: { // fields define the root of our query
              movie: {
                type: Movie,
                args: { // arguments we accept from the query
                  ID: {
                    type: GraphQLID
                  }
                },
                resolve: (_, args) => {

                  return movie.find(movie => {
                    return movie.ID === args.ID
                  });
                }
              },
              movies: {
                type: new GraphQLList(Movie),
                resolve: (_, args) => {

                  return movies;
                }
              }
            }
          }),
        });

        return graphql(schema, requestedData, movies).then((response) => {

          return reply(response);
        });
      });
    });
  }
});

// Route to Add movie(s) to the collection
server.route({
  method: "POST",
  path:"/movies",
  config:{
    handler: (request, reply) => {
      const movies = request.payload.movies;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("movies");

        return collection.insertMany(movies, (err, result) => {
          db.close();

          return reply(result.ops);
        });
      });
    },
    validate: {
        payload: {
          movies: moviesSchema
        }
    }
  }
});

// Route to Get a movie by ID in the collection
server.route({
  method: "GET",
  path:"/movies/{id}",
  config:{
    handler: (request, reply) => {
      const movieId = request.params.id;

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
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("movies");

        return collection.find({ _id: ObjectId(movieId) }).toArray((err, movies) => {
          db.close();

          const schema = new GraphQLSchema({
            query: new GraphQLObjectType({
              name: "MovieQuery",
              fields: { // fields define the root of our query
                movie: {
                  type: Movie,
                  args: { // arguments we accept from the query
                    ID: {
                      type: GraphQLID
                    }
                  },
                  resolve: (_, args) => {

                    return movie.find(movie => {
                      return movie.ID === args.ID
                    });
                  }
                },
                movies: {
                  type: new GraphQLList(Movie),
                  resolve: (_, args) => {

                    return movies;
                  }
                }
              }
            }),
          });

          return graphql(schema, requestedData, movies).then((response) => {

            return reply(response);
          });
        });
      });
    },
    validate: {
        params: {
          id: Joi.objectId()
        }
    }
  }
});

// Route to Update a movie in the collection
server.route({
  method: "PUT",
  path:"/movies/{id}",
  config:{
    handler: (request, reply) => {
      const movieId = request.params.id;
      const movie = request.payload;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("movies");

        return collection.updateOne({ _id: ObjectId(movieId) }, { $set: movie }, (err, result) => {
          db.close();

          return reply(result);
        });
      });
    },
    validate: {
        params: {
          id: Joi.objectId()
        },
        payload: movieSchema
    }
  }
});

// Route to Delete a movie from the collection
server.route({
  method: "DELETE",
  path:"/movies/{id}",
  config:{
    handler: (request, reply) => {
      const movieId = request.params.id;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("movies");

        return collection.deleteOne({ _id: ObjectId(movieId) }, (err, result) => {
          db.close();

          return reply(result);
        });
      });
    },
    validate: {
        params: {
          id: Joi.objectId()
        }
    }
  }
});

server.start(err => {

  if (err) {
    throw err;
  }

  console.log(`Server started at ${ server.info.uri }`);

});
