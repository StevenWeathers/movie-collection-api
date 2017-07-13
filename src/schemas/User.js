'use strict';

const UserModel = require('../models/User');

const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLNonNull
} = require('graphql');

const User = new GraphQLObjectType({
    name: 'User',
    fields: {
        email: {
            type: GraphQLString
        },
        _id: {
            type: GraphQLString
        }
    }
});

const UserInputType = new GraphQLInputObjectType({
    name: 'UserInput',
    fields: () => ({

        email: {
            type: new GraphQLNonNull(GraphQLString)
        },
        password: {
            type: new GraphQLNonNull(GraphQLString)
        }
    })
});

const UsersSchema = new GraphQLSchema({
    query: new GraphQLObjectType({
        name: 'UserQuery',
        fields: { // fields define the root of our query
            user: {
                type: User,
                args: { // arguments we accept from the query
                    _id: {
                        type: GraphQLString
                    }
                },
                resolve: (_, args) => {

                    const foundUser = new Promise((resolve, reject) => {

                        UserModel.getUser(args._id, (err, user) => {

                            err ? reject(err) : resolve(user);
                        });
                    });

                    return foundUser;
                }
            },
            users: {
                type: new GraphQLList(User),
                resolve: (_, args) => {

                    const foundUsers = new Promise((resolve, reject) => {

                        UserModel.getUsers((err, users) => {

                            err ? reject(err) : resolve(users);
                        });
                    });

                    return foundUsers;
                }
            }
        }
    }),
    mutation: new GraphQLObjectType({
        name: 'UserMutation',
        description: 'Manage the users that manage the collection',
        fields: () => ({
            addUser: {
                type: User,
                description: 'Add a user.',
                args: {
                    user: {
                        type: UserInputType
                    }
                },
                resolve: (value, { user }) => {

                    const createdUser = new Promise((resolve, reject) => {

                        UserModel.createUser(user, (err, newUser) => {

                            err ? reject(err) : resolve(newUser);
                        });
                    });

                    return createdUser;
                }
            },
            updateUser: {
                type: User,
                description: 'Update a user.',
                args: {
                    _id: {
                        type: new GraphQLNonNull(GraphQLString)
                    },
                    user: {
                        type: UserInputType
                    }
                },
                resolve: (value, { _id, user }) => {

                    const updatedUser = new Promise((resolve, reject) => {

                        UserModel.updateUser(_id, user, (err, result) => {

                            err ? reject(err) : resolve(result.modifiedCount === 1 ? { _id } : {});
                        });
                    });

                    return updatedUser;
                }
            },
            deleteUser: {
                type: User,
                description: 'Delete a user.',
                args: {
                    _id: {
                        type: new GraphQLNonNull(GraphQLString)
                    }
                },
                resolve: (value, { _id }) => {

                    const deletedUser = new Promise((resolve, reject) => {

                        UserModel.deleteUser({
                            _id
                        }, (err, result) => {

                            err ? reject(err) : resolve(result.deletedCount === 1 ? { _id } : {});
                        });
                    });

                    return deletedUser;
                }
            }
        })
    })
});

module.exports = UsersSchema;
