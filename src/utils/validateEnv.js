"use strict";
exports.__esModule = true;
var envalid_1 = require("envalid");
var validateEnv = function () {
    (0, envalid_1.cleanEnv)(process.env, {
        NODE_ENV: (0, envalid_1.str)(),
        PORT: (0, envalid_1.port)(),
        POSTGRES_HOST: (0, envalid_1.str)(),
        POSTGRES_PORT: (0, envalid_1.port)(),
        POSTGRES_USER: (0, envalid_1.str)(),
        POSTGRES_PASSWORD: (0, envalid_1.str)(),
        POSTGRES_DB: (0, envalid_1.str)(),
        JWT_ACCESS_TOKEN_PRIVATE_KEY: (0, envalid_1.str)(),
        JWT_ACCESS_TOKEN_PUBLIC_KEY: (0, envalid_1.str)(),
        JWT_REFRESH_TOKEN_PRIVATE_KEY: (0, envalid_1.str)(),
        JWT_REFRESH_TOKEN_PUBLIC_KEY: (0, envalid_1.str)()
    });
};
exports["default"] = validateEnv;
