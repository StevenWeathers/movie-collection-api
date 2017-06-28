"use strict";

const Hapi = require("hapi");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);
const server = new Hapi.Server();
const JWT = require("jsonwebtoken");
const HapiAuthJWT = require("hapi-auth-jwt2");
const bcrypt = require("bcryptjs");

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

const User = new GraphQLObjectType({
  name: "User",
  fields: {
    email: {
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

const passwordRegex = new RegExp("^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})");
const passwordErrorText = "Password doesn't meet minimum requirements";
const userSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: Joi.string().regex(passwordRegex).required().error(new Error(passwordErrorText))
});

// JWT settings
const secretKey = process.env.jwtkey || "everythingisawesome";
const jwtAlgorithm = process.env.jwtalgo || "HS256";
const jwtExpires = process.env.jwtexpires || "1h";

server.connection({
  port: 8080
});

server.register(HapiAuthJWT, (err) => {

  const validate = (decoded, request, callback) => {
    console.log(decoded);

    return MongoClient.connect(mongoDbUrl, (err, db) => {
      const collection = db.collection("users");

      return collection.findOne({ "email": decoded.email }, (err, user) => {
        db.close();

        if (user) {
          return callback(null, true); // session is valid
        } else {
          return callback(null, false); // session expired
        }
      });
    });
  };

  server.auth.strategy("jwt", "jwt", {
    key: secretKey,
    validateFunc: validate,
    verifyOptions: {
      algorithms: [ jwtAlgorithm ],
    }
  });

  server.auth.default('jwt');

});

// Route to authenticate with the API
server.route({
  path: "/auth",
  method: "POST",
  config: {
    auth: false,
    handler: (request, reply) => {

      const { email, password } = request.payload;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        return collection.findOne({ "email": email }, (err, user) => {
          db.close();

          if (user !== null && bcrypt.compareSync(password, user.password)) {
            const token = JWT.sign({
              email
            }, secretKey, {
              algorithm: jwtAlgorithm,
              expiresIn: jwtExpires
            });

            return reply({
              token
            });
          } else {
            return reply({
                "statusCode": 401,
                "error": "Unauthorized",
                "message": "Incorrect email/password combination"
            }).code(401);
          }
        });
      });
    },
    validate: {
      payload: userSchema
    }
  }
});

// Route to get all the users
server.route({
  method: "GET",
  path:"/users",
  config: {
    handler: (request, reply) => {

      const defaultData = `
        {
          users {
            email
            password
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        // @TODO - add the schema and support for users to GraphQL
        return collection.find({}, {"password": false}).toArray((err, users) => {
          db.close();

          const schema = new GraphQLSchema({
            query: new GraphQLObjectType({
              name: "UserQuery",
              fields: { // fields define the root of our query
                user: {
                  type: User,
                  args: { // arguments we accept from the query
                    _id: {
                      type: GraphQLString
                    }
                  },
                  resolve: (_, args) => {

                    return user.find(user => {
                      return user._id === args._id
                    });
                  }
                },
                users: {
                  type: new GraphQLList(User),
                  resolve: (_, args) => {

                    return users;
                  }
                }
              }
            }),
          });

          return graphql(schema, requestedData, users).then((response) => {

            return reply(response);
          });
        });
      });
    }
  }
});

// Route to Get a User by ID
server.route({
  method: "GET",
  path:"/users/{id}",
  config:{
    handler: (request, reply) => {
      const userId = request.params.id;

      const defaultData = `
        {
          users {
            email
            password
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        return collection.find({ "_id": ObjectId(userId) }, {"password": false}).toArray((err, users) => {
          db.close();

          const schema = new GraphQLSchema({
            query: new GraphQLObjectType({
              name: "UserQuery",
              fields: { // fields define the root of our query
                user: {
                  type: User,
                  args: { // arguments we accept from the query
                    _id: {
                      type: GraphQLString
                    }
                  },
                  resolve: (_, args) => {

                    return user.find(user => {
                      return user._id === args._id
                    });
                  }
                },
                users: {
                  type: new GraphQLList(User),
                  resolve: (_, args) => {

                    return users;
                  }
                }
              }
            }),
          });

          return graphql(schema, requestedData, users).then((response) => {

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

// Route to Add users(s) to manage the collection
server.route({
  method: "POST",
  path:"/users",
  config:{
    handler: (request, reply) => {
      const user = request.payload;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        return collection.findOne({ "email": user.email }, (err, foundUser) => {
          if (!foundUser) {
            return bcrypt.genSalt(10, function(err, salt) {
              return bcrypt.hash(user.password, salt, function(err, hash) {
                user.password = hash;

                return collection.insertOne(user, (err, result) => {
                  db.close();

                  delete result.ops[0].password;

                  return reply(result.ops[0]);
                });
              });
            });
          } else {
            db.close();

            return reply({
                "statusCode": 409,
                "error": "Existing User",
                "message": "User with that email already exists."
            }).code(409);
          }
        });
      });
    },
    validate: {
      payload: userSchema
    }
  }
});

// Route to Update a User
server.route({
  method: "PUT",
  path:"/users/{id}",
  config:{
    handler: (request, reply) => {
      const userId = request.params.id;
      const user = request.payload;

      if (typeof user.password !== "undefined") {
        const salt = bcrypt.genSaltSync(10);
        user.password = bcrypt.hashSync(user.password, salt);
      }

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        return collection.updateOne({ _id: ObjectId(userId) }, { $set: user }, (err, result) => {
          db.close();

          return reply(result);
        });
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      },
      payload: userSchema.optionalKeys("email","password").min(1)
    }
  }
});

// Route to Delete a User
server.route({
  method: "DELETE",
  path:"/users/{id}",
  config:{
    handler: (request, reply) => {
      const userId = request.params.id;

      return MongoClient.connect(mongoDbUrl, (err, db) => {
        const collection = db.collection("users");

        return collection.deleteOne({ _id: ObjectId(userId) }, (err, result) => {
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

// Route to get all the movies in the collection
server.route({
  method: "GET",
  path:"/movies",
  config: {
    auth: false,
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
    auth: false,
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
