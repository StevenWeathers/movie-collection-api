'use strict';

const Sinon = require('sinon');
const _ = require('lodash');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const before = lab.before;
const after = lab.after;
const expect = Lab.expect;

// require hapi server
const Server = require('../src/server.js');
const UserModel = require('../src/models/User.js');

describe('User Routes', () => {

    before((done) => {

        Sinon.stub(UserModel, 'getUsers');
        Sinon.stub(UserModel, 'getUser');
        Sinon.stub(UserModel, 'createUser');
        Sinon.stub(UserModel, 'updateUser');
        Sinon.stub(UserModel, 'deleteUser');

        done();
    });

    after((done) => {

        UserModel.getUsers.restore();
        UserModel.getUser.restore();
        UserModel.createUser.restore();
        UserModel.updateUser.restore();
        UserModel.deleteUser.restore();

        done();
    });

    it('should get all users', (done) => {

        UserModel.getUsers.yields(null, [
            {
                _id: '59586ecb1d814b0016ce423b',
                email: 'steven@weathers.me'
            }
        ]);

        Server.inject({
            method: 'GET',
            url: '/users'
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'users': [
                        {
                            _id: '59586ecb1d814b0016ce423b',
                            email: 'steven@weathers.me'
                        }
                    ]
                }
            });

            done();
        });
    });

    it('should get a user by id', (done) => {

        const UserId = '59586ecb1d814b0016ce423b';

        UserModel.getUser.yields(null, {
            _id: '59586ecb1d814b0016ce423b',
            email: 'steven@weathers.me'
        });

        Server.inject({
            method: 'GET',
            url: `/users/${UserId}`
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'user': {
                        _id: '59586ecb1d814b0016ce423b',
                        email: 'steven@weathers.me'
                    }
                }
            });

            done();
        });
    });

    it('should add a new User', (done) => {

        const UserPayload = {
            email: 'steven@weathers.me',
            password: 'vendetta2017'
        };

        const UserResponse = { _id: '59586ecb1d814b0016ce423b' };
        UserModel.createUser.yields(null, UserResponse);

        Server.inject({
            method: 'POST',
            url: '/users',
            payload: UserPayload,
            headers: {}
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'addUser': UserResponse
                }
            });

            done();
        });
    });

    it('should update a User', (done) => {

        const _id = '59586ecb1d814b0016ce423b';
        const UserPayload = {
            email: 'steven@weathers.me',
            password: 'vendetta2018'
        };

        const UserResponse = _.clone(UserPayload, true);
        UserResponse._id = _id;

        UserModel.updateUser.yields(null, { modifiedCount: 1 });

        Server.inject({
            method: 'PUT',
            url: `/users/${_id}`,
            payload: UserPayload,
            headers: {}
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'updateUser': {
                        _id
                    }
                }
            });

            done();
        });
    });

    it('should delete a User', (done) => {

        const _id = '59586ecb1d814b0016ce423b';

        UserModel.deleteUser.yields(null, { deletedCount: 1 });

        Server.inject({
            method: 'DELETE',
            url: `/users/${_id}`,
            headers: {}
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                data: {
                    deleteUser: {
                        _id
                    }
                }
            });

            done();
        });
    });
});
