const express = require('express')
const cors = require('cors');
const helmet = require("helmet");
require('dotenv').config();

const authMiddleware = require("./src/middlewares/authMiddleware");

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
app.use(helmet());
app.disable('x-powered-by');


app.get('/health', (req, res) => res.status(200).send('server OK'));
app.use('/auth', authRoute);


app.get('/validate', authMiddleware, (req, res) => {
    return res.status(200).json({
        success: true
    })
})


app.use('/conn', authMiddleware, conn);
app.use('/db',   authMiddleware, db  );

app.listen(port, () => console.log(`Server http://localhost:${port}`));