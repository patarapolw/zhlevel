import jwt from "express-jwt";
import jwks from "jwks-rsa";

const jwtCheck = jwt({
    secret: jwks.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://patarapolw.auth0.com/.well-known/jwks.json"
    }),
    audience: "https://zhlevel.herokuapp.com/api",
    issuer: "https://patarapolw.auth0.com/",
    algorithms: ["RS256"]
});

export default jwtCheck;
