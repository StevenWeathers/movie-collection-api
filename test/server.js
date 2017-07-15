'use strict';

const Sinon = require('sinon');
// const _ = require('lodash');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
const expect = Lab.expect;

// require hapi server
const Server = require('../src/server.js');
const UserModel = require('../src/models/User.js');

describe('Server', () => {

    let token;

    beforeEach((done) => {

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

    afterEach((done) => {

        UserModel.validatePassword.restore();
        UserModel.getUserByEmail.restore();

        done();
    });

    describe('when the JWT token fails', () => {

        it('should return status code of 401', (done) => {

            UserModel.getUserByEmail.yields(null, null); // to pass jwt auth

            const UserPayload = {
                email: 'steven@weathers.me',
                password: 'vendetta2017'
            };

            Server.inject({
                method: 'POST',
                url: '/users',
                payload: UserPayload,
                headers: {
                    Authorization: token
                }
            }, (response) => {

                expect(response.statusCode).to.equal(401);
                expect(JSON.parse(response.payload).error).to.exist();

                done();
            });
        });

        it('should return status code of 401', (done) => {

            UserModel.getUserByEmail.yields(new Error('Ruh Roh...')); // to pass jwt auth

            const UserPayload = {
                email: 'steven@weathers.me',
                password: 'vendetta2017'
            };

            Server.inject({
                method: 'POST',
                url: '/users',
                payload: UserPayload,
                headers: {
                    Authorization: token
                }
            }, (response) => {

                expect(response.statusCode).to.equal(401);
                expect(JSON.parse(response.payload).error).to.exist();

                done();
            });
        });
    });
});
