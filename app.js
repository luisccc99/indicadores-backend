const express = require('express');
const path = require('path')
const helmet = require('helmet')
const cors = require('cors')
require('dotenv').config()
const port = process.env.APP_PORT || 8081;

//Sequilize configuration 
const db = require('../indicadores-backend/src/config/db');
const exphbs = require('express-handlebars');

const app = express();

//Server configuration
app.listen(port, () => {
  console.log(`app starting on port ${port}`);
});

//Verify the conection to the database
db.sequelize.authenticate()
  .then(() => console.log('Database connected...'))
  .catch(err => console.log('Error: ' + err))



//handlebars
app.engine('handlebars', exphbs({ defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

//set static folder 
app.use(express.static(path.join(__dirname, 'public')))

//seguiridad basica 
app.use(cors())
app.use(helmet())

//middlewares
app.use(express.json());
app.use(express.urlencoded({extended: false}));




// routes
app.use(require('./src/routes/gig'))





