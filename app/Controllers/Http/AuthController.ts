import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import User from 'App/Models/User'
import LoginValidator from 'App/Validators/LoginValidator'
import RegisterValidator from 'App/Validators/RegisterValidator'
import Mail from '@ioc:Adonis/Addons/Mail'
import Database from '@ioc:Adonis/Lucid/Database'
import OtpConfirmationValidator from 'App/Validators/OtpConfirmationValidator'
import { schema } from '@ioc:Adonis/Core/Validator'

export default class AuthController {
  public async register({ request, response }: HttpContextContract) {
    try {
      // Validation Input
      const payload = await request.validate(RegisterValidator)

      // Create User
      const newUser = await User.create(payload)

      const sendVerification = await this.sendOtp(newUser)
      if (!sendVerification.status) {
        throw new Error(sendVerification.message);
      }

      // Return succes create user
      return response.created({
        success: true,
        message: 'register success, please check your email to verify your account, the otp code is valid for 5 minutes'
      })
    } catch (error) {
      // Return failed create user
      return response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async login({ auth, request, response }: HttpContextContract) {
    try {
      // Validation Input
      const payload = await request.validate(LoginValidator)
      const { email, password } = payload

      // Check is user verify
      const checkUser = await User.findByOrFail('email', email)

      if (checkUser.isVerified == false) {
        return response.unprocessableEntity({
          success: false,
          message: "You haven't verified"
        })
      }

      // Attempt login and return token if success and set expires token
      const token = await auth.use('api').attempt(email, password, {
        expiresIn: '12hours'
      })

      // Return message Success login and return token
      return response.ok({
        success: true,
        message: 'Login Success, the token will be expire in 12 hours',
        data: token
      })
    } catch (error) {
      // Return invalid credential
      return response.badRequest({
        success: false,
        message: "Invalid Email or Password"
      })
    }
  }

  public async otpVerification({ request, response }: HttpContextContract) {
    try {
      const payload = await request.validate(OtpConfirmationValidator)
      const { otp_code, email } = payload
      const user = await User.findByOrFail('email', email)
      const dataOtp = await Database.from('otp_codes').where('user_id', user.id).firstOrFail()

      const now: Date = new Date()

      if (dataOtp.expires_at.getTime() < now.getTime()) {
        throw new Error("OTP code is expired, please resend otp code")
      }

      if (dataOtp.otp_code === otp_code) {
        user.isVerified = true
        await user.save()

        await Database.from('otp_codes').where('user_id', user.id).delete()
      } else {
        throw new Error("OTP code is wrong")
      }

      return response.ok({
        success: true,
        message: 'Hooray, Verification Success',
      })
    } catch (error) {
      return response.badRequest({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async resend({ request, response }: HttpContextContract) {
    const resendOTP = schema.create({
      email: schema.string({
        trim: true
      })
    })
    
    try {
      const payload = await request.validate({
        schema: resendOTP
      })
      const user = await User.findByOrFail('email', payload.email)

      if (user.isVerified) {
        throw new Error("No need resend otp,You already verified");
      }

      const sendVerification = await this.sendOtp(user)
      if (!sendVerification.status) {
        throw new Error(sendVerification.message);
      }

      return response.created({
        success: true,
        message: 'resend otp success, please check your email to verify your account, the otp code is valid for 5 minutes'
      })
    } catch (error) {
      return response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async sendOtp(user: User) {
    try {
      const otp_code: number = Math.floor(100000 + Math.random() * 900000)
      const now: Date = new Date()
      const expires_at = new Date(now.getTime() + 5 * 60000);

      await Database.from('otp_codes').where('user_id', user.id).delete()

      await Database.table('otp_codes').insert({
        otp_code,
        user_id: user.id,
        expires_at
      })

      await Mail.send((message) => {
        message
          .from('admin@sanberdev.com')
          .to(user.email)
          .subject('Verify your account!')
          .htmlView('mail/otp_verification', {
            name: user.name,
            otp_code
          })
      })

      return {
        status: true
      }
    } catch (error) {
      return {
        status: false,
        message: error.messages ?? error.message
      }
    }
  }
}
