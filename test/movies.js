'use strict';

const Sinon = require('sinon');
const _ = require('lodash');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.beforeEach;
const after = lab.afterEach;
const expect = Lab.expect;

// require hapi server
const Server = require('../src/server.js');
const MovieModel = require('../src/models/Movie.js');
const UserModel = require('../src/models/User.js');

describe('Movie Routes', () => {

    let token;

    before((done) => {

        Sinon.stub(MovieModel, 'getMovies');
        Sinon.stub(MovieModel, 'getMovie');
        Sinon.stub(MovieModel, 'createMovie');
        Sinon.stub(MovieModel, 'updateMovie');
        Sinon.stub(MovieModel, 'deleteMovie');

        Sinon.stub(UserModel, 'validatePassword');
        Sinon.stub(UserModel, 'getUserByEmail');

        UserModel.validatePassword.yields(null, true);

        Server.inject({
            method: 'POST',
            url: '/auth',
            payload: {
                email: 'steven@weathers.me',
                password: 'vendetta2017'
            }
        }, (response) => {

            token = JSON.parse(response.payload).token;
            done();
        });
    });

    after((done) => {

        MovieModel.getMovies.restore();
        MovieModel.getMovie.restore();
        MovieModel.createMovie.restore();
        MovieModel.updateMovie.restore();
        MovieModel.deleteMovie.restore();

        UserModel.validatePassword.restore();
        UserModel.getUserByEmail.restore();

        done();
    });

    it('should get all movies', (done) => {

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

    it('should get a movies by id', (done) => {

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

    it('should add a new movie', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const moviePayload = {
            title: 'Batman Begins',
            year: '2005',
            format: 'Bluray',
            tmdb_id: '123',
            tmdb_image_url: 'http://www.movies.com/',
            upc: '1337009'
        };

        const movieResponse = _.clone(moviePayload, true);
        movieResponse._id = '59586ecb1d814b0016ce423b';
        movieResponse.slug = 'batman-begins';

        MovieModel.createMovie.yields(null, movieResponse);

        Server.inject({
            method: 'POST',
            url: '/movies',
            payload: moviePayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'addMovie': movieResponse
                }
            });

            done();
        });
    });

    it('should update a movie', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';
        const moviePayload = {
            title: 'Batman Dark Knight',
            year: '2008',
            format: 'Bluray',
            tmdb_id: '123',
            tmdb_image_url: 'http://www.movies.com/',
            upc: '1337009'
        };

        const movieResponse = _.clone(moviePayload, true);
        movieResponse._id = _id;
        movieResponse.slug = 'batman-dark-knight';

        MovieModel.updateMovie.yields(null, { modifiedCount: 1 });

        Server.inject({
            method: 'PUT',
            url: `/movies/${_id}`,
            payload: moviePayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'updateMovie': {
                        _id
                    }
                }
            });

            done();
        });
    });

    it('should delete a movie', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';

        MovieModel.deleteMovie.yields(null, { deletedCount: 1 });

        Server.inject({
            method: 'DELETE',
            url: `/movies/${_id}`,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                data: {
                    deleteMovie: {
                        _id
                    }
                }
            });

            done();
        });
    });
});
