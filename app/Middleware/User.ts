import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class User {
  public async handle ({ auth, response }: HttpContextContract, next: () => Promise<void>) {
    // code for middleware goes here. ABOVE THE NEXT CALL
    const role = auth.user?.role
    if (role?.toLowerCase() == 'user') {
      await next()
    } else {
      return response.unauthorized({
        message: "Only user can access this route"
      })
    }
  }
}
