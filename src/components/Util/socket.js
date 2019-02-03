import config from '../../config.json';
import io from "socket.io-client";

const TRSocket = {
    getInstance() {
        return io(config.socket_url, {transports: ['websocket']});
    },
    setupSocketListener(socket, NotiBox, next) {
        socket.on('onFollow', (msg) => {
            next(NotiBox, msg)
        })

        socket.on('onAllow', (msg) => {
            next(NotiBox, msg)
        })

        socket.on('onDisallow', (msg) => {
            next(NotiBox, msg)
        })

        socket.on('unfollow', (msg) => {
        })

        socket.on('receiveNotification', (msg) => {
            next(NotiBox, msg)
        })
    },
    notifyNewNotification: function(NotiBox, msg) {
        NotiBox && NotiBox.show()
    },
}

export default TRSocket;
