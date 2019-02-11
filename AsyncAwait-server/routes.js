const routes = require('next-routes')()

/*const apiRouters = {
    REGISTRY: "/registry",
    LOGIN: "/login",
    CREATEADS: "/create/ads",
    GETORDERLIST: "/get/orders",
    DELETEADS: "/ads/delete"
}*/

routes.add('/registry', '/login')
routes.add('/create/ads', '/get/orders', 'ads/delete')

module.exports = routes