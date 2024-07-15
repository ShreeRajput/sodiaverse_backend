import express from "express"

const checking = (req,res,next)=> {
    const message = "can go to next page"

    if(message==="can go to next page")
        next()
    else
        return res.status(403).json({msg:"forbidden"})
}

export default checking
