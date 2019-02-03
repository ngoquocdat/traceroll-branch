'use strict'

var userApi = require('./models/users'),
    db = require('./database/mongo'),
    async = require('async')

module.exports = function(io, socket) {

    socket.on('join', (msg) => {
        const socketId = socket.id,
            userId = msg.userId

        userApi.addSocketConnection(userId, socketId, function(err) {
            console.log('addSocketConnection', userId, socketId)
        })
    })

    socket.on('disconnect', () => {
        const socketId = socket.id

        userApi.removeSocketConnection(socketId, function(err) {
            console.log('removeSocketConnection: ', socketId, err)
        })
    })

    socket.on('onFollow', (msg) => {
        const userId = msg.userId,
            notiId = msg.notiId

        userApi.getSocketConnections(userId, (err, connections) => {
            if (err) {

                return
            }
            db.getObjectById(notiId, (err, doc) => {
                if (err) {

                    return
                }
                let socketId = null
                connections.forEach((connection) => {
                    socketId = connection.value
                    socket.to(socketId).emit('onFollow', doc)
                })
            })
        })
    })

    socket.on('unfollow', (msg) => {
        const userId = msg.userId

        userApi.getSocketConnections(userId, (err, connections) => {
            if (err) {

                return
            }
            let socketId = null
            connections.forEach((connection) => {
                socketId = connection.value
                socket.to(socketId).emit('unfollow', {})
            })
        })
    })

    socket.on('onAllow', (msg) => {
        const userId = msg.userId,
            notiId = msg.notiId

        userApi.getSocketConnections(userId, (err, connections) => {
            if (err) {

                return
            }
            db.getObjectById(notiId, (err, doc) => {
                if (err) {

                    return
                }
                let socketId = null
                connections.forEach((connection) => {
                    socketId = connection.value
                    socket.to(socketId).emit('onAllow', doc)
                })

            })
        })
    })

    socket.on('onDisallow', (msg) => {
        const userId = msg.userId,
            notiId = msg.notiId

        userApi.getSocketConnections(userId, (err, connections) => {
            if (err) {

                return
            }
            db.getObjectById(notiId, (err, doc) => {
                if (err) {

                    return
                }
                let socketId = null
                connections.forEach((connection) => {
                    socketId = connection.value
                    socket.to(socketId).emit('onDisallow', doc)
                })

            })
        })
    })

    socket.on('sendNotification', (msg) => {
        const userId = msg.userId,
            notiId = msg.notiId,
            type = msg.type

        userApi.getSocketConnections(userId, (err, connections) => {
            if (err) {

                return
            }
            db.getObjectById(notiId, (err, doc) => {
                if (err) {

                    return
                }
                let socketId = null
                connections.forEach((connection) => {
                    socketId = connection.value
                    socket.to(socketId).emit('receiveNotification', doc)
                })

            })
        })
    })

}