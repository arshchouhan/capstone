// Only this restricted app is exposed by the development camera tunnel.
const express=require('express');
const app=express();app.use(express.json({limit:'12mb'}));
app.use(require('./routes/cameraPublicRoutes'));
app.use(require('./middleware/errors').notFound);app.use(require('./middleware/errors').errorHandler);
module.exports=app;
