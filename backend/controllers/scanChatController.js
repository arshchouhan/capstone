const Scan = require('../models/Scan');
const Message = require('../models/ChatMessage');
const chat = require('../services/scanChatService');
const {fail,id,ok} = require('./helpers');

async function ownedScan(req) {
  const scan = await Scan.findOne({_id:id(req.params.scanId), owner:req.user._id, state:'complete'});
  if (!scan) throw fail(404,'Completed scan not found.');
  return scan;
}

exports.list = async (req,res) => {
  await ownedScan(req);
  ok(res,await Message.find({owner:req.user._id,scan:req.params.scanId}).sort({createdAt:1}).limit(100));
};

exports.send = async (req,res) => {
  const scan = await ownedScan(req);
  const question = typeof req.body.message === 'string' ? req.body.message.trim() : '';
  if (!question || question.length > 2000) throw fail(400,'Enter a question up to 2,000 characters.');
  const attachment = typeof req.body.attachment === 'string' ? req.body.attachment : '';
  if (attachment && !attachment.startsWith(`/api/media/${req.user._id}-`)) throw fail(400,'This attachment is not a private uploaded image.');
  const history = await Message.find({owner:req.user._id,scan:scan._id}).sort({createdAt:1}).limit(100);
  const answer = await chat.answer(scan,history,question);
  const messages = await Message.create([
    {owner:req.user._id,scan:scan._id,role:'user',body:question,attachment:attachment || undefined},
    {owner:req.user._id,scan:scan._id,role:'assistant',body:answer},
  ]);
  ok(res,messages,201);
};
