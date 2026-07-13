const express = require('express')
const cors = require('cors');
require('dotenv').config();

const authRoute = require('./src/routes/auth');
const conn = require('./src/routes/conn');
const db = require('./src/routes/db');

const app = express();
const port = process.env.PORT || 3000;
const allowedOrigins = [process.env.FRONT_URL];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'A política de CORS para este site não permite acesso da origem especificada.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization', 'App-Token'],
    credentials: true
}));
app.use(express.json());


app.get('/health', (req, res) => res.status(200).send('server OK'));
app.use('/auth', authRoute);
app.use('/conn', conn);
app.use('/db', db);

app.listen(port, () => console.log(`Server http://localhost:${port}`));