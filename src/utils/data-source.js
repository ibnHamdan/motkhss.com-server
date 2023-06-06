"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.AppDataSource = void 0;
require('dotenv').config();
require("reflect-metadata");
var typeorm_1 = require("typeorm");
var config_1 = require("config");
var postgresConfig = config_1["default"].get('postgresConfig');
exports.AppDataSource = new typeorm_1.DataSource(__assign(__assign({}, postgresConfig), { type: 'postgres', synchronize: false, logging: false, entities: ['src/entities/**/*.entity{.ts,.js}'], migrations: ['src/migrations/**/*{.ts,.js}'], subscribers: ['src/subscribers/**/*{.ts,.js}'] }));
