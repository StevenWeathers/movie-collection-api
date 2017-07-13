'use strict';

const FormatModel = require('../models/Format');

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const Format = new GraphQLObjectType({
    name: 'MovieFormat',
    fields: {
        _id: {
            type: GraphQLString
        },
        title: {
            type: GraphQLString
        },
        slug: {
            type: GraphQLString
        }
    }
});

const FormatInputType = new GraphQLInputObjectType({
    name: 'FormatInput',
    fields: () => ({

        title: {
            type: new GraphQLNonNull(GraphQLString)
        }
    })
});

const FormatsSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'FormatQuery',
        fields: { // fields define the root of our query
            format: {
                type: Format,
                args: { // arguments we accept from the query
                    _id: {
                        type: GraphQLString
                    }
                },
                resolve: (_, args) => {

                    const foundFormat = new Promise((resolve, reject) => {


                        return MongoClient.connect(mongoDbUrl, (err, db) => {

                            if (!err) {
                                const collection = db.collection('formats');

                                collection.findOne({
                                    _id: ObjectId(args._id)
                                }, (err, format) => {

                                    db.close();

                                    err ? reject(err) : resolve(format);
                                });
                            }
                            else {
                                reject(err);
                            }
                        });
                    });

                    return foundFormat;
                }
            },
            formats: {
                type: new GraphQLList(Format),
                resolve: (_, args) => {

                    const foundFormats = new Promise((resolve, reject) => {

                        return MongoClient.connect(mongoDbUrl, (err, db) => {

                            if (!err) {
                                const collection = db.collection('formats');

                                collection.find({}).toArray((err, formats) => {

                                    db.close();

                                    err ? reject(err) : resolve(formats);
                                });
                            }
                            else {
                                reject(err);
                            }
                        });
                    });

                    return foundFormats;
                }
            }
        }
    }),
    mutation: new GraphQLObjectType({
        name: 'FormatsMutation',
        description: 'Manage the movie formats of the collection',
        fields: () => ({
            addFormat: {
                type: Format,
                description: 'Add a movie format to the collection.',
                args: {
                    format: {
                        type: FormatInputType
                    }
                },
                resolve: (value, { format }) => {

                    const createdFormat = new Promise((resolve, reject) => {

                        format.slug = Slugify(format.title).toLowerCase();

                        return MongoClient.connect(mongoDbUrl, (err, db) => {

                            if (!err) {
                                const collection = db.collection('formats');

                                collection.insertOne(format, (err, result) => {

                                    collection.createIndex({ 'slug': 1 }, { unique: true });
                                    db.close();

                                    err ? reject(err) : resolve(result.ops[0]);
                                });
                            }
                            else {
                                reject(err);
                            }
                        });
                    });

                    return createdFormat;
                }
            },
            updateFormat: {
                type: Format,
                description: 'Update a movie format in the collection.',
                args: {
                    _id: {
                        type: new GraphQLNonNull(GraphQLString)
                    },
                    format: {
                        type: FormatInputType
                    }
                },
                resolve: (value, { _id, format }) => {

                    const updatedFormat = new Promise((resolve, reject) => {

                        format.slug = Slugify(format.title).toLowerCase();

                        return MongoClient.connect(mongoDbUrl, (err, db) => {

                            if (!err) {
                                const collection = db.collection('formats');

                                collection.updateOne({
                                    _id: ObjectId(_id)
                                }, {
                                    $set: format
                                }, (err, result) => {

                                    db.close();

                                    err ? reject(err) : resolve(result.modifiedCount === 1 ? { _id } : {});
                                });
                            }
                            else {
                                reject(err);
                            }
                        });
                    });

                    return updatedFormat;
                }
            },
            deleteFormat: {
                type: Format,
                description: 'Delete a movie format with _id from the collection.',
                args: {
                    _id: {
                        type: new GraphQLNonNull(GraphQLString)
                    }
                },
                resolve: (value, { _id }) => {

                    const deletedFormat = new Promise((resolve, reject) => {

                        return MongoClient.connect(mongoDbUrl, (err, db) => {

                            if (!err) {
                                const collection = db.collection('formats');

                                collection.deleteOne({
                                    _id: ObjectId(_id)
                                }, (err, result) => {

                                    db.close();

                                    err ? reject(err) : resolve(result.deletedCount === 1 ? { _id } : {});
                                });
                            }
                            else {
                                reject(err);
                            }
                        });
                    });

                    return deletedFormat;
                }
            }
        })
    })
});

module.exports = FormatsSchema;
