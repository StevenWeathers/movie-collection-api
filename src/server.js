"use strict";

const Hapi = require("hapi");
const Joi = require("joi");
Joi.objectId = require('joi-objectid')(Joi);
const server = new Hapi.Server();
const JWT = require("jsonwebtoken");
const HapiAuthJWT = require("hapi-auth-jwt2");
const bcrypt = require("bcryptjs");
const slugify = require("slugify")

const {MongoClient, ObjectId} = require("mongodb");
const mongoHost = process.env.mongo_host || "db";
const mongoPort = process.env.mongo_port || "27017";
const mongoCollection = process.env.mongo_collection || "moviecollection";
const mongoDbUrl = `mongodb://${mongoHost}:${mongoPort}/${mongoCollection}`;
const createFirstUser = process.env.create_user || false;

const {
  graphql,
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLInputObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull
} = require("graphql");

const Movie = new GraphQLObjectType({
  name: "Movie",
  fields: {
    _id: {
      type: GraphQLString
    },
    title: {
      type: GraphQLString
    },
    slug: {
      type: GraphQLString
    },
    year: {
      type: GraphQLString
    },
    format: {
      type: GraphQLString
    },
    tmdb_id: {
      type: GraphQLString
    },
    tmdb_image_url: {
      type: GraphQLString
    },
    upc: {
      type: GraphQLString
    }
  }
});

const MovieInputType = new GraphQLInputObjectType({
  name: 'MovieInput',
  fields: () => ({
    title: {
      type: new GraphQLNonNull(GraphQLString)
    },
    year: {
      type: new GraphQLNonNull(GraphQLString)
    },
    format: {
      type: new GraphQLNonNull(GraphQLString)
    },
    tmdb_id: {
      type: new GraphQLNonNull(GraphQLString)
    },
    tmdb_image_url: {
      type: new GraphQLNonNull(GraphQLString)
    },
    upc: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
});

const MoviesSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "MovieQuery",
    fields: { // fields define the root of our query
      movie: {
        type: Movie,
        args: { // arguments we accept from the query
          _id: {
            type: GraphQLString
          }
        },
        resolve: (_, args) => {

          const foundMovie = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("movies");

              return collection.findOne({
                _id: ObjectId(args._id)
              }, (err, movie) => {
                db.close();

                err ? reject(err) : resolve(movie);
              });
            });
          });

          return foundMovie;
        }
      },
      movies: {
        type: new GraphQLList(Movie),
        resolve: (_, args) => {
          const foundMovies = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("movies");

              return collection.find({}).toArray((err, movies) => {
                db.close();

                err ? reject(err) : resolve(movies);
              });
            });
          });

          return foundMovies;
        }
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'MovieMutation',
    description: 'Manage the movie collection',
    fields: () => ({
      addMovie: {
        type: Movie,
        description: 'Add a movie to the collection.',
        args: {
          movie: {
            type: MovieInputType
          }
        },
        resolve: (value, { movie }) => {
          const createdMovie = new Promise((resolve, reject) => {
            movie.slug = slugify(`${movie.year} ${movie.title}`).toLowerCase();

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("movies");

              return collection.insertOne(movie, (err, result) => {
                collection.createIndex( { "slug": 1 }, { unique: true } );
                db.close();

                err ? reject(err) : resolve(result.ops[0]);
              });
            });
          });

          return createdMovie;
        }
      },
      updateMovie: {
        type: Movie,
        description: 'Update a movie in the collection.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          },
          movie: {
            type: MovieInputType
          }
        },
        resolve: (value, { _id, movie }) => {
          const updatedMovie = new Promise((resolve, reject) => {
            movie.slug = slugify(`${movie.year} ${movie.title}`).toLowerCase();

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("movies");

              return collection.updateOne({
                _id: ObjectId(_id)
              }, {
                $set: movie
              }, (err, result) => {
                db.close();

                err ? reject(err) : resolve(result.modifiedCount === 1 ? { "_id": _id } : {});
              });
            });
          });

          return updatedMovie;
        }
      },
      deleteMovie: {
        type: Movie,
        description: 'Delete a movie with _id from the collection.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (value, { _id }) => {

          const deletedMovie = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("movies");

              return collection.deleteOne({
                _id: ObjectId(_id)
              }, (err, result) => {
                db.close();

                err ? reject(err) : resolve(result.deletedCount === 1 ? { "_id": _id } : {});
              });
            });
          });

          return deletedMovie;
        }
      }
    })
  }),
});

const Format = new GraphQLObjectType({
  name: "MovieFormat",
  fields: {
    _id: {
      type: GraphQLString
    },
    title: {
      type: GraphQLString
    },
    slug: {
      type: GraphQLString
    }
  }
});

const FormatInputType = new GraphQLInputObjectType({
  name: 'FormatInput',
  fields: () => ({
    title: {
      type: new GraphQLNonNull(GraphQLString)
    }
  })
});

const FormatsSchema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: "FormatQuery",
    fields: { // fields define the root of our query
      format: {
        type: Format,
        args: { // arguments we accept from the query
          _id: {
            type: GraphQLString
          }
        },
        resolve: (_, args) => {

          const foundFormat = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("formats");

              return collection.findOne({
                _id: ObjectId(args._id)
              }, (err, format) => {
                db.close();

                err ? reject(err) : resolve(format);
              });
            });
          });

          return foundFormat;
        }
      },
      formats: {
        type: new GraphQLList(Format),
        resolve: (_, args) => {
          const foundFormats = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("formats");

              return collection.find({}).toArray((err, formats) => {
                db.close();

                err ? reject(err) : resolve(formats);
              });
            });
          });

          return foundFormats;
        }
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'FormatsMutation',
    description: 'Manage the movie formats of the collection',
    fields: () => ({
      addFormat: {
        type: Format,
        description: 'Add a movie format to the collection.',
        args: {
          format: {
            type: FormatInputType
          }
        },
        resolve: (value, { format }) => {
          const createdFormat = new Promise((resolve, reject) => {
            format.slug = slugify(format.title).toLowerCase();

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("formats");

              return collection.insertOne(format, (err, result) => {
                collection.createIndex( { "slug": 1 }, { unique: true } );
                db.close();

                err ? reject(err) : resolve(result.ops[0]);
              });
            });
          });

          return createdFormat;
        }
      },
      updateFormat: {
        type: Format,
        description: 'Update a movie format in the collection.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          },
          format: {
            type: FormatInputType
          }
        },
        resolve: (value, { _id, format }) => {
          const updatedFormat = new Promise((resolve, reject) => {
            format.slug = slugify(format.title).toLowerCase();

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("formats");

              return collection.updateOne({
                _id: ObjectId(_id)
              }, {
                $set: format
              }, (err, result) => {
                db.close();

                err ? reject(err) : resolve(result.modifiedCount === 1 ? { "_id": _id } : {});
              });
            });
          });

          return updatedFormat;
        }
      },
      deleteFormat: {
        type: Format,
        description: 'Delete a movie format with _id from the collection.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (value, { _id }) => {

          const deletedFormat = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("formats");

              return collection.deleteOne({
                _id: ObjectId(_id)
              }, (err, result) => {
                db.close();

                err ? reject(err) : resolve(result.deletedCount === 1 ? { "_id": _id } : {});
              });
            });
          });

          return deletedFormat;
        }
      }
    })
  }),
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

const UserInputType = new GraphQLInputObjectType({
  name: 'UserInput',
  fields: () => ({
    email: {
      type: new GraphQLNonNull(GraphQLString)
    },
    password: {
      type: new GraphQLNonNull(GraphQLString)
    },
  })
});

const UsersSchema = new GraphQLSchema({
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

          const foundUser = new Promise((resolve, reject) => {

              return MongoClient.connect(mongoDbUrl, (err, db) => {
                const collection = db.collection("users");

                return collection.findOne({
                  _id: ObjectId(args._id)
                }, {
                  "password": false
                }, (err, user) => {
                  db.close();

                  err ? reject(err) : resolve(user);
                });
              });
          });

          return foundUser;
        }
      },
      users: {
        type: new GraphQLList(User),
        resolve: (_, args) => {

          const foundUsers = new Promise((resolve, reject) => {

              return MongoClient.connect(mongoDbUrl, (err, db) => {
                const collection = db.collection("users");

                return collection.find({}, {
                  "password": false
                }).toArray((err, users) => {
                  db.close();

                  err ? reject(err) : resolve(users);
                });
              });
          });

          return foundUsers;
        }
      }
    }
  }),
  mutation: new GraphQLObjectType({
    name: 'UserMutation',
    description: 'Manage the users that manage the collection',
    fields: () => ({
      addUser: {
        type: User,
        description: 'Add a user.',
        args: {
          user: {
            type: UserInputType
          }
        },
        resolve: (value, { user }) => {
          const createdUser = new Promise((resolve, reject) => {

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("users");

              return bcrypt.genSalt(10, function(err, salt) {

                return bcrypt.hash(user.password, salt, function(err, hash) {
                  user.password = hash;

                  return collection.insertOne(user, (err, result) => {
                    collection.createIndex( { "email": 1 }, { unique: true } );
                    db.close();

                    if (!err) {
                      delete result.ops[0].password;
                      resolve(result.ops[0]);
                    } else {
                      reject(err);
                    }
                  });
                });
              });
            });
          });

          return createdUser;
        }
      },
      updateUser: {
        type: User,
        description: 'Update a user.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          },
          user: {
            type: UserInputType
          }
        },
        resolve: (value, { _id, user }) => {
          const updatedUser = new Promise((resolve, reject) => {
            const salt = bcrypt.genSaltSync(10);
            user.password = bcrypt.hashSync(user.password, salt);

            return MongoClient.connect(mongoDbUrl, (err, db) => {
              const collection = db.collection("users");

              return collection.updateOne({
                _id: ObjectId(_id)
              }, {
                $set: user
              }, (err, result) => {
                db.close();

                err ? reject(err) : resolve(result.modifiedCount === 1 ? { "_id": _id } : {});
              });
            });
          });

          return updatedUser;
        }
      },
      deleteUser: {
        type: Movie,
        description: 'Delete a user.',
        args: {
          _id: {
            type: new GraphQLNonNull(GraphQLString)
          }
        },
        resolve: (value, { _id }) => {

          const deletedUser = new Promise((resolve, reject) => {

              return MongoClient.connect(mongoDbUrl, (err, db) => {
                const collection = db.collection("users");

                return collection.deleteOne({
                  _id: ObjectId(_id)
                }, (err, result) => {
                  db.close();

                  err ? reject(err) : resolve(result.deletedCount === 1 ? { "_id": _id } : {});
                });
              });
          });

          return deletedUser;
        }
      }
    })
  }),
});

// Joi Validation Schemas
const movieSchema = Joi.object().keys({
    title: Joi.string().required(),
    year: Joi.string().required(),
    format: Joi.string().required(),
    tmdb_id: Joi.string().required(),
    tmdb_image_url: Joi.string().required(),
    upc: Joi.string().required()
});

const moviesSchema = Joi.array().items(movieSchema);

const formatSchema = Joi.object().keys({
    title: Joi.string().required()
});

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
            _id
            email
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(UsersSchema, requestedData).then((response) => {

        return reply(response);
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
          user(_id: "${userId}") {
            _id
            email
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(UsersSchema, requestedData).then((response) => {

        return reply(response);
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

      const defaultData = `
        mutation UserMutation {
          addUser(user: {
            email: "${user.email}"
            password: "${user.password}"
          }) {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(UsersSchema, requestedData).then((response) => {

        return reply(response);
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
      const salt = bcrypt.genSaltSync(10);
      user.password = bcrypt.hashSync(user.password, salt);

      const defaultData = `
        mutation UserMutation {
          updateUser(_id: "${userId}", user: {
            email: "${user.email}"
            password: "${user.password}"
          }) {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(UsersSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      },
      payload: userSchema
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

      const defaultData = `
        mutation UserMutation {
          deleteUser(_id: "${userId}") {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(UsersSchema, requestedData).then((response) => {

        return reply(response);
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
            _id
            title
            slug
            year
            format
            tmdb_id
            tmdb_image_url
            upc
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(MoviesSchema, requestedData).then((response) => {

        return reply(response);
      });
    }
  }
});

// Route to Add a movie to the collection
server.route({
  method: "POST",
  path:"/movies",
  config:{
    handler: (request, reply) => {
      const movie = request.payload;

      const defaultData = `
        mutation MovieMutation {
          addMovie(movie: {
            title: "${movie.title}"
            year: "${movie.year}"
            format: "${movie.format}"
            tmdb_id: "${movie.tmdb_id}"
            tmdb_image_url: "${movie.tmdb_image_url}"
            upc: "${movie.upc}"
          }) {
            _id
            title
            slug
            year
            format
            tmdb_id
            tmdb_image_url
            upc
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(MoviesSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      payload: movieSchema
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
          movie(_id: "${movieId}") {
            _id
            title
            slug
            year
            format
            tmdb_id
            tmdb_image_url
            upc
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(MoviesSchema, requestedData).then((response) => {

        return reply(response);
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

      const defaultData = `
        mutation MovieMutation {
          updateMovie(_id: "${movieId}", movie: {
            title: "${movie.title}"
            year: "${movie.year}"
            format: "${movie.format}"
            tmdb_id: "${movie.tmdb_id}"
            tmdb_image_url: "${movie.tmdb_image_url}"
            upc: "${movie.upc}"
          }) {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(MoviesSchema, requestedData).then((response) => {

        return reply(response);
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

      const defaultData = `
        mutation MovieMutation {
          deleteMovie(_id: "${movieId}") {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(MoviesSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      }
    }
  }
});

// Route to get all the formats in the collection
server.route({
  method: "GET",
  path:"/formats",
  config: {
    auth: false,
    handler: (request, reply) => {

      const defaultData = `
        {
          formats {
            _id
            title
            slug
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(FormatsSchema, requestedData).then((response) => {

        return reply(response);
      });
    }
  }
});

// Route to Add movie format(s) to the collection
server.route({
  method: "POST",
  path:"/formats",
  config:{
    handler: (request, reply) => {
      const format = request.payload;

      const defaultData = `
        mutation FormatsMutation {
          addFormat(format: {
            title: "${format.title}"
          }) {
            _id
            title
            slug
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(FormatsSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      payload: formatSchema
    }
  }
});

// Route to Get a movie formats by ID in the collection
server.route({
  method: "GET",
  path:"/formats/{id}",
  config:{
    auth: false,
    handler: (request, reply) => {
      const formatId = request.params.id;

      const defaultData = `
        {
          format(_id: "${formatId}") {
            _id
            title
            slug
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(FormatsSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      }
    }
  }
});

// Route to Update a movie format in the collection
server.route({
  method: "PUT",
  path:"/formats/{id}",
  config:{
    handler: (request, reply) => {
      const formatId = request.params.id;
      const format = request.payload;

      const defaultData = `
        mutation FormatsMutation {
          updateFormat(_id: "${formatId}", format: {
            title: "${format.title}"
          }) {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(FormatsSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      },
      payload: formatSchema
    }
  }
});

// Route to Delete a movie format from the collection
server.route({
  method: "DELETE",
  path:"/formats/{id}",
  config:{
    handler: (request, reply) => {
      const formatId = request.params.id;

      const defaultData = `
        mutation FormatsMutation {
          deleteFormat(_id: "${formatId}") {
            _id
          }
        }
      `;

      const requestedData = (request.query.query) ? request.query.query : defaultData;

      return graphql(FormatsSchema, requestedData).then((response) => {

        return reply(response);
      });
    },
    validate: {
      params: {
        id: Joi.objectId()
      }
    }
  }
});

if (createFirstUser) {
  const firstUser = `
    mutation UserMutation {
      addUser(user: {
        email: "${process.env.create_user_email}"
        password: "${process.env.create_user_password}"
      }) {
        _id
      }
    }
  `;

  graphql(UsersSchema, firstUser).then((response) => {

    return console.log(response);
  });
}

server.start(err => {

  if (err) {
    throw err;
  }

  console.log(`Server started at ${ server.info.uri }`);

});
