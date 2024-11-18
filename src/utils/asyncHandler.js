// promise wala 
const asyncHandler = (requestHandler)=>{
    (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}
export default asyncHandler;


// higher order function
// const asyncHandler = ()=>{}
// const asyncHandler= (func) =>()=>{}
// const asyncHandler= (func) =>async()=>{}


//  try catch wala
// const asncHandler = (fn) => async(req,res,next)=>{
//     try {
//         await fn(req,res,next);
        
//     } catch (error) {
//         res.status(error.code|| 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// }

