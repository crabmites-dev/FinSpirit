import jwt from 'jsonwebtoken'
import pool from '../config/db.js'

export const protect = async (req, res, next) => {
    try {
        
        let token = req.cookies.token 

        if (!token && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ')
            if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
                token = parts[1]
            }
        }
    
        if(!token) {
            return res.status(401).json({message: 'Non autorisé ! Veillez vous connecter'})
        }
    
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
    
        const user = await pool.query ('SELECT id, username, email FROM users WHERE id = $1', [decoded.id])
    
        if(user.rows.length === 0) {
            return res.status(401).json({message: 'Pas autorise'})
        }
    
        req.user = user.rows[0]
    
        next()

    } catch (error) {
        res.status(401).json({message: 'Token invalide ou expire'})
    }
}