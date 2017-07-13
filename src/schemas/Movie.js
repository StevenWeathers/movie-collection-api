'use strict';

const MovieModel = require('../models/Movie');

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const Movie = new GraphQLObjectType({
    name: 'Movie',
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
        name: 'MovieQuery',
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

                        MovieModel.getMovie(args._id, (err, movie) => {

                            err ? reject(err) : resolve(movie);
                        });
                    });

                    return foundMovie;
                }
            },
            movies: {
                type: new GraphQLList(Movie),
                resolve: (_, args) => {

                    const foundMovies = new Promise((resolve, reject) => {

                        MovieModel.getMovies((err, movies) => {

                            err ? reject(err) : resolve(movies);
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

                        MovieModel.createMovie(movie, (err, newMovie) => {

                            err ? reject(err) : resolve(newMovie);
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

                        MovieModel.updateMovie(_id, movie, (err, result) => {

                            err ? reject(err) : resolve(result.modifiedCount === 1 ? { _id } : {});
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

                        MovieModel.deleteMovie({
                            _id
                        }, (err, result) => {

                            err ? reject(err) : resolve(result.deletedCount === 1 ? { _id } : {});
                        });
                    });

                    return deletedMovie;
                }
            }
        })
    })
});

module.exports = MoviesSchema;
