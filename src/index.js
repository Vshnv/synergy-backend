const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv')
dotenv.config()

const app = express();
const ads = [
    {title: 'Hello, world (again)!'}
];
app.use(helmet());
app.use(express.json());
app.use(cors());
app.use(morgan('combined'));
const auth = require("./routes/auth.route")
app.use('/auth', auth.router)
app.use('/track', auth.authMiddleware, require("./routes/track.route"))
app.use('/info', auth.authMiddleware, require("./routes/info.route"))
app.use('/sos', auth.authMiddleware, require("./routes/sos.route"))


// starting the server
app.listen(3002, () => {
    console.log('listening on port 3001');
});