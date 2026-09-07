import pool from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import  transporter  from '../config/mail.js'
import dotenv from 'dotenv'
import { seedData, deleteSampleData as removeSampleData, hasSampleData } from '../config/seed.js'

dotenv.config() 


const cookieOption = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
}

const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30d'}) 
}

const generateResetCode = () => String(Math.floor(100000 + Math.random() * 900000))

const buildResetCodeEmail = (code) => `
<div style="background-color: #f4f6fa; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <div style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.03);">
    <div style="padding: 40px 32px 24px; text-align: center;">
      <h1 style="color: #0f172a; font-size: 26px; font-weight: 700; margin: 0;">FinSpirit</h1>
      <p style="color: #64748b; font-size: 14px; margin: 8px 0 0;">Réinitialisation de mot de passe</p>
    </div>
    <div style="padding: 0 32px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
      <p style="color: #0f172a; font-weight: 600;">Bonjour,</p>
      <p style="color: #475569;">Utilisez le code ci-dessous sur la page de réinitialisation. Il expire dans <strong>15 minutes</strong>.</p>
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: #eef2ff; border: 2px dashed #6366f1; border-radius: 14px; padding: 18px 36px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4f46e5;">${code}</span>
        </div>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
      <p style="font-size: 14px; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 20px; color: #64748b;">
        Bien cordialement,<br><strong style="color: #0f172a;">L'équipe FinSpirit</strong>
      </p>
    </div>
  </div>
</div>
`

export const register = async (req, res) => {
    const username = req.body.username?.trim()
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'Remplir tous les champs' })
    }

    const client = await pool.connect()

    try {
        await client.query('BEGIN')

        const userExist = await client.query( 'SELECT id FROM users WHERE LOWER(email) = $1',[email])

        if (userExist.rows.length > 0) {
            await client.query('ROLLBACK')
            return res.status(409).json({
                message: 'Cet e-mail est déjà utilisé. Connectez-vous ou choisissez un autre e-mail.',
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await client.query(
            'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING *',
            [username, email, hashedPassword]
        )

        const userId = newUser.rows[0].id
        await seedData(userId, client)

        await client.query('COMMIT')

        const token = generateToken(userId)
        res.cookie('token', token, cookieOption)

        return res.status(201).json({
            message: 'Utilisateur créé avec succès !',
            token,
            user: {
                id: userId,
                username: newUser.rows[0].username,
                email: newUser.rows[0].email
            }
        })
    } catch (error) {
        await client.query('ROLLBACK')
        console.error('Erreur inscription:', error)
        return res.status(500).json({ message: 'Une erreur est survenue lors de l\'inscription' })
    } finally {
        client.release()
    }
}

export const login = async (req, res) => {
    const email = req.body.email?.trim().toLowerCase()
    const password = req.body.password

    if(!email || !password) {
        return res.status(400).json({message: 'Veillez remplir tous les champs'})
    }

    try {
        const userExist = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [email])
    
        if(userExist.rows.length === 0) {
            return res.status(400).json({message: 'Utiisateur introuvable'})
        }

        const user = userExist.rows[0]
        
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(400).json({ message: 'Identifiants invalides' })
        }

        const token = generateToken(user.id)
        res.cookie('token', token, cookieOption)

        try {
            const sampleCheck = await pool.query(
                'SELECT id FROM transactions WHERE user_id = $1 AND is_sample = true LIMIT 1',
                [user.id]
            )
            if (sampleCheck.rows.length === 0) {
                await seedData(user.id)
            }
        } catch (seedError) {
            console.error('Seed après connexion (non bloquant):', seedError.message)
        }

        return res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({message: 'Une erreur est survenue lors de la connexion'})
    }
}

export const getMe = async (req, res) => {
        try {
        const userResult = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.user.id])

         if(userResult.rows.length === 0) {
            return res.status(404).json({message: 'Utilisateur introuvable'})
        }
            
            return res.json({
                user: userResult.rows[0]    
            })
        } catch (error) {
            console.error(error)
            return res.status(500).json({message: 'Une erreur est survenue lors de la recupération du profil'})
        }
    }

export const forgotPassword = async (req, res) => {
    const { email } = req.body

    if (!email) {
        return res.status(400).json({ message: 'Veillez saisir votre adresse mail' })
    }

    try {
        const user = await pool.query('SELECT id FROM users WHERE email = $1', [email])

        // Message générique — ne révèle pas si le compte existe
        if (user.rows.length === 0) {
            return res.status(200).json({ message: 'Si ce compte existe, un code a été envoyé par e-mail.' })
        }

        const userId = user.rows[0].id
        const code = generateResetCode()
        const codeHash = await bcrypt.hash(code, 10)
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId])
        await pool.query(
            'INSERT INTO password_reset_codes (user_id, email, code_hash, expires_at) VALUES ($1, $2, $3, $4)',
            [userId, email, codeHash, expiresAt]
        )

        await transporter.sendMail({
            from: `"FinSpirit" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Votre code de réinitialisation FinSpirit',
            html: buildResetCodeEmail(code),
        })

        return res.status(200).json({ message: 'Si ce compte existe, un code a été envoyé par e-mail.' })
    } catch (error) {
        console.error('Une erreur est survenue', error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}

export const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body

    if (!email || !code || !newPassword) {
        return res.status(400).json({ message: 'Email, code et nouveau mot de passe requis' })
    }

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Code invalide ou expiré' })
        }

        const userId = userResult.rows[0].id

        const codeResult = await pool.query(
            `SELECT * FROM password_reset_codes
             WHERE user_id = $1 AND email = $2 AND expires_at > NOW()
             ORDER BY created_at DESC LIMIT 1`,
            [userId, email]
        )

        if (codeResult.rows.length === 0) {
            return res.status(400).json({ message: 'Code expiré. Demandez un nouveau code.' })
        }

        const resetRow = codeResult.rows[0]
        const isValid = await bcrypt.compare(String(code).trim(), resetRow.code_hash)

        if (!isValid) {
            return res.status(400).json({ message: 'Code incorrect. Vérifiez et réessayez.' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId])
        await pool.query('DELETE FROM password_reset_codes WHERE user_id = $1', [userId])

        return res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}


export const logout = (req, res) => {
    res.cookie('token', '', {...cookieOption, maxAge: 1})
    return res.json({message: 'Deconnexion reussie !'})
}

export const deleteSampleData = async (req, res) => {
    try {
        await removeSampleData(req.user.id)
        return res.json({ message: 'Données d\'exemple supprimées avec succès' })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur lors de la suppression' })
    }
}

export const checkSampleData = async (req, res) => {
    try {
        const hasSample = await hasSampleData(req.user.id)
        return res.json({ hasSample })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ message: 'Erreur serveur' })
    }
}