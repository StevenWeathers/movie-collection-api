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
const FormatModel = require('../src/models/Format.js');

describe('Format Routes', () => {

    before((done) => {

        Sinon.stub(FormatModel, 'getFormats');
        Sinon.stub(FormatModel, 'getFormat');
        Sinon.stub(FormatModel, 'createFormat');
        Sinon.stub(FormatModel, 'updateFormat');
        Sinon.stub(FormatModel, 'deleteFormat');

        done();
    });

    after((done) => {

        FormatModel.getFormats.restore();
        FormatModel.getFormat.restore();
        FormatModel.createFormat.restore();
        FormatModel.updateFormat.restore();
        FormatModel.deleteFormat.restore();

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

    it('should get a user by id', (done) => {

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

    it('should add a new format', (done) => {

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
            headers: {}
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

    it('should update a format', (done) => {

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
            headers: {}
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

    it('should delete a format', (done) => {

        const _id = '59586ecb1d814b0016ce423b';

        FormatModel.deleteFormat.yields(null, { deletedCount: 1 });

        Server.inject({
            method: 'DELETE',
            url: `/formats/${_id}`,
            headers: {}
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
});
