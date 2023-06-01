"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 8080;
const path = __dirname + '/build/';
app.use(express_1.default.static(path));
app.get('/', function (req, res) {
    res.sendFile(path + 'index.html');
});
app.get('/test', (req, res) => {
    const data = { foo: 'bar ..' };
    res.json(data);
});
app.listen(PORT, () => {
    console.log(`Server running at ${PORT}`);
});
