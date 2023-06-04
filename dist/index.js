"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const corsOptions = {
    origin: 'http://localhost:8080',
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
const path = __dirname + '/build/';
app.use(express_1.default.static(path));
app.get('/', function (req, res) {
    res.sendFile(path + 'index.html');
});
app.get('/test', (req, res) => {
    const data = { foo: '=bar ...' };
    res.json(data);
});
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
