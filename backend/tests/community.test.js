const {test}=require('node:test'),assert=require('node:assert/strict');
const Comment=require('../models/Comment'),Post=require('../models/CommunityPost'),controller=require('../controllers/communityController');
test('reply edits and deletions require the author and preserve counts on repeat deletion',async()=>{
 const originalFind=Comment.findOne,originalDelete=Comment.deleteOne,originalUpdate=Post.updateOne;
 const req={params:{postId:'111111111111111111111111',commentId:'222222222222222222222222'},user:{_id:'owner'},body:{body:'Updated tip'}};
 let saved=false,countUpdates=0,removed=true;
 const comment={_id:req.params.commentId,post:req.params.postId,owner:'owner',async save(){saved=true},async populate(){}};
 const res={status(){return this},json(){return this}};
 try{
  Comment.findOne=async()=>comment;Comment.deleteOne=async()=>({deletedCount:removed?1:0});Post.updateOne=async()=>{countUpdates++};
  await assert.rejects(controller.editReply({...req,user:{_id:'other'}},res),{status:403});
  await assert.rejects(controller.deleteReply({...req,user:{_id:'other'}},res),{status:403});assert.equal(countUpdates,0);
  await controller.editReply(req,res);assert.ok(saved);assert.equal(comment.body,'Updated tip');
  await controller.deleteReply(req,res);assert.equal(countUpdates,1);removed=false;await controller.deleteReply(req,res);assert.equal(countUpdates,1);
  Comment.findOne=async()=>null;await assert.rejects(controller.editReply(req,res),{status:404});
 }finally{Comment.findOne=originalFind;Comment.deleteOne=originalDelete;Post.updateOne=originalUpdate}
});
