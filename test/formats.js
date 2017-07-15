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
const FormatModel = require('../src/models/Format.js');
const UserModel = require('../src/models/User.js');

describe('Format Routes', () => {

    let token;

    before((done) => {

        Sinon.stub(FormatModel, 'getFormats');
        Sinon.stub(FormatModel, 'getFormat');
        Sinon.stub(FormatModel, 'createFormat');
        Sinon.stub(FormatModel, 'updateFormat');
        Sinon.stub(FormatModel, 'deleteFormat');

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

        FormatModel.getFormats.restore();
        FormatModel.getFormat.restore();
        FormatModel.createFormat.restore();
        FormatModel.updateFormat.restore();
        FormatModel.deleteFormat.restore();

        UserModel.validatePassword.restore();
        UserModel.getUserByEmail.restore();

        done();
    });

    it('should get all formats', (done) => {

        FormatModel.getFormats.yields(null, [
            {
                _id: '59586ecb1d814b0016ce423b',
                title: '4K Bluray',
                slug: '4k-bluray'
            }
        ]);

        Server.inject({
            method: 'GET',
            url: '/formats'
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'formats': [
                        {
                            _id: '59586ecb1d814b0016ce423b',
                            title: '4K Bluray',
                            slug: '4k-bluray'
                        }
                    ]
                }
            });

            done();
        });
    });

    it('should throw error when getting formats fail', (done) => {

        FormatModel.getFormats.yields(new Error('ERROR!'));

        Server.inject({
            method: 'GET',
            url: '/formats'
        }, (response) => {

            expect(response.statusCode).to.equal(500);
            expect(JSON.parse(response.payload).errors).to.not.be.undefined();

            done();
        });
    });

    it('should get a format by id', (done) => {

        const formatId = '59586ecb1d814b0016ce423b';

        FormatModel.getFormat.yields(null, {
            _id: formatId,
            title: '4K Bluray',
            slug: '4k-bluray'
        });

        Server.inject({
            method: 'GET',
            url: `/formats/${formatId}`
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'format': {
                        _id: formatId,
                        title: '4K Bluray',
                        slug: '4k-bluray'
                    }
                }
            });

            done();
        });
    });

    it('should throw error when getting format by id fails', (done) => {

        const formatId = '59586ecb1d814b0016ce423b';

        FormatModel.getFormat.yields(new Error('ERROR!'));

        Server.inject({
            method: 'GET',
            url: `/formats/${formatId}`
        }, (response) => {

            expect(response.statusCode).to.equal(500);
            expect(JSON.parse(response.payload).errors).to.not.be.undefined();

            done();
        });
    });

    it('should add a new format', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const formatPayload = {
            title: '4K Bluray'
        };

        const formatResponse = _.clone(formatPayload, true);
        formatResponse._id = '59586ecb1d814b0016ce423b';
        formatResponse.slug = '4k-bluray';

        FormatModel.createFormat.yields(null, formatResponse);

        Server.inject({
            method: 'POST',
            url: '/formats',
            payload: formatPayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'addFormat': formatResponse
                }
            });

            done();
        });
    });

    it('should throw error when adding a format fails', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const formatPayload = {
            title: '4K Bluray'
        };

        FormatModel.createFormat.yields(new Error('ERROR!'));

        Server.inject({
            method: 'POST',
            url: '/formats',
            payload: formatPayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(500);
            expect(JSON.parse(response.payload).errors).to.not.be.undefined();

            done();
        });
    });

    it('should update a format', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';
        const formatPayload = {
            title: '4K Bluray'
        };

        const formatResponse = _.clone(formatPayload, true);
        formatResponse._id = _id;
        formatResponse.slug = '4k-bluray';

        FormatModel.updateFormat.yields(null, { modifiedCount: 1 });

        Server.inject({
            method: 'PUT',
            url: `/formats/${_id}`,
            payload: formatPayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'updateFormat': {
                        _id
                    }
                }
            });

            done();
        });
    });

    it('should not a format when nothing is changed', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';
        const formatPayload = {
            title: '4K Bluray'
        };

        const formatResponse = _.clone(formatPayload, true);
        formatResponse._id = _id;
        formatResponse.slug = '4k-bluray';

        FormatModel.updateFormat.yields(null, { modifiedCount: 0 });

        Server.inject({
            method: 'PUT',
            url: `/formats/${_id}`,
            payload: formatPayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                'data': {
                    'updateFormat': {
                        _id: null
                    }
                }
            });

            done();
        });
    });

    it('should throw error when updating a format fails', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';
        const formatPayload = {
            title: '4K Bluray'
        };

        FormatModel.updateFormat.yields(new Error('ERROR!'));

        Server.inject({
            method: 'PUT',
            url: `/formats/${_id}`,
            payload: formatPayload,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(500);
            expect(JSON.parse(response.payload).errors).to.not.be.undefined();

            done();
        });
    });

    it('should delete a format', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';

        FormatModel.deleteFormat.yields(null, { deletedCount: 1 });

        Server.inject({
            method: 'DELETE',
            url: `/formats/${_id}`,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                data: {
                    deleteFormat: {
                        _id
                    }
                }
            });

            done();
        });
    });

    it('should not delete a format if it doesnt exist', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';

        FormatModel.deleteFormat.yields(null, { deletedCount: 0 });

        Server.inject({
            method: 'DELETE',
            url: `/formats/${_id}`,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(200);
            expect(JSON.parse(response.payload)).to.equal({
                data: {
                    deleteFormat: {
                        _id: null
                    }
                }
            });

            done();
        });
    });

    it('should throw error when deleting a format fails', (done) => {

        UserModel.getUserByEmail.yields(null, { email: 'steven@weathers.me' }); // to pass jwt auth

        const _id = '59586ecb1d814b0016ce423b';

        FormatModel.deleteFormat.yields(new Error('ERROR!'));

        Server.inject({
            method: 'DELETE',
            url: `/formats/${_id}`,
            headers: {
                Authorization: `${token}`
            }
        }, (response) => {

            expect(response.statusCode).to.equal(500);
            expect(JSON.parse(response.payload).errors).to.not.be.undefined();

            done();
        });
    });
});
