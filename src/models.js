'use strict';

const models = (mongourl) => {

    const mongoose = require('mongoose');

    const Movie = mongoose.model('Movie', {
        title: String,
        slug: String,
        year: String,
        format: String,
        tmdb_id: String,
        tmdb_image_url: String,
        upc: String
    });

    // const kitty = new Cat({ name: 'Zildjian' });

    // kitty.save((err) => {

    //     if (err) {
    //         console.log(err);
    //     }
    //     else {
    //         console.log('meow');
    //     }
    // });

    return {
        getMovies: (cb) => {

            mongoose.connect(mongourl);
            const query = Movie.find({});

            query.exec((err, movies) => {

                err ? cb(err) : cb(null, movies);
            });
        }
    };
};

module.exports = models;
