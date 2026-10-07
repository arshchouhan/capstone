const router=require('express').Router();const {requireAuth,requireAdmin}=require('../middleware/auth');
const plant=require('../controllers/plantController'),scan=require('../controllers/scanController'),community=require('../controllers/communityController'),experts=require('../controllers/expertController'),market=require('../controllers/marketController'),account=require('../controllers/accountController'),media=require('../controllers/mediaController');
router.use(requireAuth);
const camera=require('../controllers/cameraController');
router.post('/camera-sessions',camera.create);
router.get('/camera-sessions/:sessionId',camera.preview);
router.post('/camera-sessions/:sessionId/capture',camera.requestCapture);
router.get('/camera-sessions/:sessionId/capture/:captureId',camera.capture);
router.delete('/camera-sessions/:sessionId',camera.close);
router.get('/dashboard',require('../controllers/dashboardController').get);
router.get('/weather',require('../controllers/weatherController').get);
router.get('/me',account.me);router.post('/logout',account.logout);router.get('/preferences',account.preferences);router.put('/preferences',account.savePreferences);router.get('/notifications',account.notifications);router.put('/notifications/:notificationId/read',account.readNotification);
router.post('/media',media.upload);router.get('/media/:filename',media.get);
router.get('/plants',plant.list);router.post('/plants',plant.create);router.get('/plants/:plantId',plant.get);router.patch('/plants/:plantId',plant.update);router.delete('/plants/:plantId',plant.remove);
router.get('/scans',scan.list);router.post('/scans',scan.create);router.get('/scans/:scanId',scan.get);router.get('/plants/:plantId/scans',scan.list);router.post('/plants/:plantId/scans',scan.create);router.put('/plants/:plantId/scans/:scanId/attach',scan.attach);
for(const[route,name,fields]of [['care-tasks','CareTask',['type','frequency','due','notes']],['recovery-observations','RecoveryObservation',['scan','condition','notes']],['light-readings','LightReading',['brightness','lux','category','source','measuredAt']],['calculations','CalculatorRecord',['mode','inputs','result']],['formulations','Formulation',['name','crop','disease','mode','dose','unit','rateUnit']]]){const controller=require('../controllers/plantResourceController').resource(name,fields),root=`/plants/:plantId/${route}`;router.get(root,controller.list);router.post(root,controller.create);router.patch(`${root}/:recordId`,controller.update);router.delete(`${root}/:recordId`,controller.remove);if(name==='CareTask')router.post(`${root}/:recordId/complete`,controller.complete);}
router.get('/community/posts',community.list);router.post('/community/posts',community.create);router.delete('/community/posts/:postId',community.remove);router.put('/community/posts/:postId/like',community.like);router.get('/community/posts/:postId/comments',community.comments);router.post('/community/posts/:postId/comments',community.reply);
router.get('/experts',experts.list);router.get('/experts/:expertId',experts.get);router.post('/experts',requireAdmin,experts.create);router.get('/appointments',experts.appointments);router.post('/appointments',experts.book);router.delete('/appointments/:appointmentId',experts.cancel);
router.get('/products',market.list);router.post('/products',requireAdmin,market.create);router.get('/cart',market.cart);router.put('/cart/items/:productId',market.setItem);module.exports=router;
const treatment=require('../controllers/plantResourceController').resource('TreatmentPlan',['completed']);
router.get('/plants/:plantId/treatment-plans',treatment.list);router.post('/plants/:plantId/treatment-plans',treatment.create);router.patch('/plants/:plantId/treatment-plans/:recordId',treatment.update);

router.patch('/community/posts/:postId/comments/:commentId',community.editReply);router.delete('/community/posts/:postId/comments/:commentId',community.deleteReply);

router.patch('/experts/:expertId',requireAdmin,experts.update);
router.get('/expert/connections',experts.connections);
