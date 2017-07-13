'use strict';

const Mongoose = require('mongoose');

const Movie = Mongoose.model('Movie', {
    title: String,
    slug: String,
    year: String,
    format: String,
    tmdb_id: String,
    tmdb_image_url: String,
    upc: String
});

const movie = {
    getMovies: (cb) => {

        const query = Movie.find({});

        query.exec((err, movies) => {

            err ? cb(err) : cb(null, movies);
        });
    },
    getMovie: (_id, cb) => {

        Movie.findOne({
            _id
        }, (err, movies) => {

            err ? cb(err) : cb(null, movies);
        });
    }
};

module.exports = movie;
