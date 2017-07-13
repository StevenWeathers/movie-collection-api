'use strict';

const Hapi = require('hapi');
const Joi = require('joi');
const PasswordSheriff = require('password-sheriff');
Joi.objectId = require('joi-objectid')(Joi);
const server = new Hapi.Server();
const JWT = require('jsonwebtoken');
const HapiAuthJWT = require('hapi-auth-jwt2');
const Bcrypt = require('bcryptjs');

const { MongoClient } = require('mongodb');
const mongoHost = process.env.mongo_host || 'db';
const mongoPort = process.env.mongo_port || '27017';
const mongoCollection = process.env.mongo_collection || 'moviecollection';
const mongoDbUrl = `mongodb://${mongoHost}:${mongoPort}/${mongoCollection}`;
const Mongoose = require('mongoose');

const createFirstUser = process.env.create_user || false;

const {
    graphql
} = require('graphql');

const MoviesSchema = require('./schemas/Movie');
const FormatsSchema = require('./schemas/Format');
const UsersSchema = require('./schemas/User');

// Joi Validation Schemas
const movieSchema = Joi.object().keys({
    title: Joi.string().required(),
    year: Joi.string().required(),
    format: Joi.string().required(),
    tmdb_id: Joi.string().required(),
    tmdb_image_url: Joi.string().required(),
    upc: Joi.string().required()
});

const formatSchema = Joi.object().keys({
    title: Joi.string().required()
});

// Create a custom Joi password validation utlizing password-sheriff
const joi = Joi.extend((originalJoi) => ({
    base: originalJoi.string(),
    name: 'password',
    language: {
        minimum: 'needs to meet the minimum requirements'
    },
    rules: [
        {
            name: 'minimum',
            validate(params, value, state, options) {

                const charsets = PasswordSheriff.charsets;
                const joiPasswordPolicy = new PasswordSheriff.PasswordPolicy({
                    length: {
                        minLength: 8
                    },
                    containsAtLeast: {
                        atLeast: 2,
                        expressions: [charsets.lowerCase, charsets.upperCase, charsets.numbers]
                    }
                });

                const passwordValidation = joiPasswordPolicy.check(value);

                if (!passwordValidation) {
                    // Generate an error, state and options need to be passed
                    return this.createError('password.minimum', { v: value }, state, options);
                }

                return value; // Everything is OK
            }
        }
    ]
}));

const userSchema = Joi.object().keys({
    email: Joi.string().email().required(),
    password: joi.password().minimum().required()
});

// JWT settings
const secretKey = process.env.jwtkey || 'everythingisawesome';
const jwtAlgorithm = process.env.jwtalgo || 'HS256';
const jwtExpires = process.env.jwtexpires || '1h';

server.connection({
    port: process.env.PORT || 8080
});

server.register(HapiAuthJWT, (err) => {

    if (!err) {
        const validate = (decoded, request, callback) => {

            console.log(decoded);

            return MongoClient.connect(mongoDbUrl, (err, db) => {

                if (!err) {
                    const collection = db.collection('users');

                    collection.findOne({ 'email': decoded.email }, (err, user) => {

                        db.close();

                        if (!err) {
                            if (user) {
                                callback(null, true); // session is valid
                            }
                            else {
                                callback(null, false); // session expired
                            }
                        }
                        else {
                            callback(null, false); // session expired
                        }
                    });
                }
                else {
                    callback(null, false);
                }
            });
        };

        server.auth.strategy('jwt', 'jwt', {
            key: secretKey,
            validateFunc: validate,
            verifyOptions: {
                algorithms: [jwtAlgorithm]
            }
        });

        server.auth.default('jwt');
    }
    else {
        throw err;
    }
});

// Route to authenticate with the API
server.route({
    path: '/auth',
    method: 'POST',
    config: {
        auth: false,
        handler: (request, reply) => {

            const { email, password } = request.payload;

            return MongoClient.connect(mongoDbUrl, (err, db) => {

                if (!err) {
                    const collection = db.collection('users');

                    collection.findOne({ email }, (err, user) => {

                        db.close();

                        if (!err) {
                            if (user !== null && Bcrypt.compareSync(password, user.password)) {
                                const token = JWT.sign({
                                    email
                                }, secretKey, {
                                    algorithm: jwtAlgorithm,
                                    expiresIn: jwtExpires
                                });

                                reply({
                                    token
                                });
                            }
                            else {
                                reply({
                                    'statusCode': 401,
                                    'error': 'Unauthorized',
                                    'message': 'Incorrect email/password combination'
                                }).code(401);
                            }
                        }
                        else {
                            reply().code(500);
                        }
                    });
                }
                else {
                    reply().code(500);
                }
            });
        },
        validate: {
            payload: userSchema
        }
    }
});

// Route to get all the users
server.route({
    method: 'GET',
    path: '/users',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'GET',
    path: '/users/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'POST',
    path: '/users',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'PUT',
    path: '/users/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
        handler: (request, reply) => {

            const userId = request.params.id;
            const user = request.payload;

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
    method: 'DELETE',
    path: '/users/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'GET',
    path: '/movies',
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
    method: 'POST',
    path: '/movies',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'GET',
    path: '/movies/{id}',
    config: {
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
    method: 'PUT',
    path: '/movies/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'DELETE',
    path: '/movies/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'GET',
    path: '/formats',
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
    method: 'POST',
    path: '/formats',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'GET',
    path: '/formats/{id}',
    config: {
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
    method: 'PUT',
    path: '/formats/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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
    method: 'DELETE',
    path: '/formats/{id}',
    config: {
        auth: false, // @TODO - remove this when Unit Tests can auth properly
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

if (!module.parent) {
    server.start((err) => {

        if (err) {
            throw err;
        }

        Mongoose.connect(mongoDbUrl);

        console.log(`Server started at ${server.info.uri}`);

    });
}

module.exports = server;
