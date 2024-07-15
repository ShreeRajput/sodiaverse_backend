import crypto from "crypto"
import jwt from "jsonwebtoken"

const secreatKey = crypto.randomBytes(32).toString('hex')

const generateToken = (user) => {
    const payload = {
        "user" : user
    }
    const token = jwt.sign(payload,secreatKey)
    return token
}

export {secreatKey,generateToken}