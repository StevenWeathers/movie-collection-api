'use strict';

const Slugify = require('slugify');
const Mongoose = require('mongoose');

const schema = new Mongoose.Schema({
    title: String,
    slug: String,
    year: String,
    format: String,
    tmdb_id: String,
    tmdb_image_url: String,
    upc: String
});

schema.index({ 'slug': 1 }, { unique: true });

const Movie = Mongoose.model('Movie', schema);

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
    },
    createMovie: (data, cb) => {

        data.slug = Slugify(`${data.year} ${data.title}`).toLowerCase();

        Movie.insertOne(data, (err, result) => {

            (err) ? cb(err) : cb(null, result);
        });
    },
    updateMovie: (_id, data, cb) => {

        data.slug = Slugify(`${data.year} ${data.title}`).toLowerCase();

        Movie.updateOne({
            _id
        }, {
            $set: data
        }, (err, result) => {

            err ? cb(err) : cb(null, result.modifiedCount === 1 ? { _id } : {});
        });
    },
    deleteMovie: (_id, cb) => {

        Movie.deleteOne({
            _id
        }, (err, result) => {

            err ? cb(err) : cb(null, result.deletedCount === 1 ? { _id } : {});
        });
    }
};

module.exports = movie;
