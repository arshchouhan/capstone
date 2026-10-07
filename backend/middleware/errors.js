exports.notFound = (_req,res) => res.status(404).json({success:false,message:'Endpoint not found.'});
exports.errorHandler = (error,_req,res,_next) => {
  const status = error.status || (error.name === 'ValidationError' || error.name === 'CastError' ? 400 : error.code === 11000 ? 409 : error.type === 'entity.too.large' ? 413 : 500);
  res.status(status).json({success:false,message:status === 500 ? 'Something went wrong. Please retry.' : error.code === 11000 ? 'This record or appointment already exists.' : error.message});
};
