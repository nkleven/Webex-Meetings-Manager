const bodyParser = require('body-parser');
const express = require('express');
const chalk = require('chalk');
const debug = require('debug')('app');
const morgan = require('morgan');
const path = require('path');
const qs = require('qs');
const session = require('express-session');
const functions = require ('./src/utils/functions');
const loginRoutes = require ('./src/routes/loginRoutes')();
const meetingsRoutes = require ('./src/routes/meetingsRoutes')();
const params = require('./src/utils/params');

const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(morgan('tiny'));

app.use(express.static(path.join(__dirname, '/public/')));
app.use(
    '/js',
    express.static(path.join(__dirname, '/node_modules/jquery/dist')),
);
app.use(
    '/css',
    express.static(path.join(__dirname, '/node_modules/font-awesome/css')),
);
app.use(
    '/js',
    express.static(path.join(__dirname, '/node_modules/jquery-ui-dist')),
);
app.use(
    '/css',
    express.static(path.join(__dirname, '/node_modules/jquery-ui-dist')),
);
app.use(
    '/css',
    express.static(path.join(__dirname, '/node_modules/@momentum-ui/icons/css')),
);
app.use(
    '/fonts',
    express.static(path.join(__dirname, '/node_modules/@momentum-ui/icons/fonts')),
);
app.use(
    '/css',
    express.static(path.join(__dirname, '/node_modules/@mdi/font/css')),
);



// Configure Session Middleware
const sess = {
    name: params.appName,
    secret: params.sessionSecret,
    resave: true,
    saveUninitialized: false,
    cookie : {
        secure: false,
        httpOnly: false,
        maxAge: params.sessionTimeout,
    },
    rolling: true,
};
app.use(session(sess));

//Define Rendering Engine
app.set('views', './src/views');
app.set('view engine', 'pug');

app.use('/login', loginRoutes);
app.use('/meetings', meetingsRoutes);

//Routes
app.get('/', (req, res)=>{
  // Support base redirection uri
  if (req.query.code && req.query.state) {
    const data = qs.stringify(req.query);
    res.redirect(`/login/callback?${data}`);
    return;
  }
  if (!req.session.isAuthenticated){
    res.render('index', {
      title: params.appName,
      authUri: params.initialURL,
      authenticated: false
    });
  }
  if(req.session.isAuthenticated){

  }
});



//START Web Server
app.listen(params.port, ()=>{
    debug(`listening on port ${chalk.green(params.port)}`);
});