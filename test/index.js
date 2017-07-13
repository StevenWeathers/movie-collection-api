'use strict';

const Sinon = require('sinon');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Lab.expect;

// require hapi server
const Server = require('../src/server.js');
const MovieModel = require('../src/models/Movie.js');

describe('Movie Collection API Server', () => {

    before((done) => {

        Sinon.stub(MovieModel, 'getMovies');
        Sinon.stub(MovieModel, 'getMovie');

        done();
    });

    after((done) => {

        MovieModel.getMovies.restore();
        MovieModel.getMovie.restore();

        done();
    });

    it('should get all products', (done) => {

        MovieModel.getMovies.yields(null, [
            {
                _id: '59586ecb1d814b0016ce423b',
                title: 'Batman Begins',
                slug: 'batman-begins',
                year: '2005',
                format: 'Bluray',
                tmdb_id: '123',
                tmdb_image_url: 'http://www.movies.com/',
                upc: '1337009'
            }
        ]);

        // make API call to self to test functionality end-to-end
        Server.inject({
            method: 'GET',
            url: '/movies'
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'movies': [
                        {
                            _id: '59586ecb1d814b0016ce423b',
                            title: 'Batman Begins',
                            slug: 'batman-begins',
                            year: '2005',
                            format: 'Bluray',
                            tmdb_id: '123',
                            tmdb_image_url: 'http://www.movies.com/',
                            upc: '1337009'
                        }
                    ]
                }
            });

            done();
        });
    });

    it('should get a product by id', (done) => {

        const movieId = '59586ecb1d814b0016ce423b';

        MovieModel.getMovie.yields(null, {
            _id: movieId,
            title: 'Batman Begins',
            slug: 'batman-begins',
            year: '2005',
            format: 'Bluray',
            tmdb_id: '123',
            tmdb_image_url: 'http://www.movies.com/',
            upc: '1337009'
        });

        // make API call to self to test functionality end-to-end
        Server.inject({
            method: 'GET',
            url: `/movies/${movieId}`
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'movie': {
                        _id: movieId,
                        title: 'Batman Begins',
                        slug: 'batman-begins',
                        year: '2005',
                        format: 'Bluray',
                        tmdb_id: '123',
                        tmdb_image_url: 'http://www.movies.com/',
                        upc: '1337009'
                    }
                }
            });

            done();
        });
    });
});
