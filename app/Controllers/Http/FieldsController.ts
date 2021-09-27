import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Field from 'App/Models/Field'
import Venue from 'App/Models/Venue'
import FieldValidator from 'App/Validators/FieldValidator'

export default class FieldsController {
  public async index({ response, params }: HttpContextContract) {
    try {
      let { venue_id } = params

      let fields = await Field
      .query()
      .where('venue_id', venue_id)

      response.ok({
        success: true,
        message: "Success get all data fields with venue_id = " + venue_id,
        data: fields
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async store({ request, response, params }: HttpContextContract) {
    try {
      let { venue_id } = params
      const field = await request.validate(FieldValidator)

      const venue = await Venue.findOrFail(venue_id)

      await venue?.related('fields').create(field)

      response.created({
        success: true,
        message: "Field added successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async show({ response, params }: HttpContextContract) {
    try {
      let { venue_id, id } = params

      let field = await Field
        .query()
        .andWhere('id', id)
        .where('venue_id', venue_id)
        .preload('venue')
        .preload('bookings', (bookingQuery) => {
          bookingQuery.withCount('players', (query) => {
            query.as('player_count')
          })
        })
        .firstOrFail()

      response.ok({
        success: true,
        message: "Success get detail data field",
        data: field
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async update({ request, response, params }: HttpContextContract) {
    try {
      let { venue_id, id } = params
      const payload = await request.validate(FieldValidator)

      const field = await Field
      .query()
      .where('id', id)
      .andWhere('venue_id', venue_id)
      .firstOrFail()

      await field
        .merge({
          name: payload.name,
          type: payload.type,
          venueId: venue_id
        })
        .save()

      response.ok({
        success: true,
        message: "Field updated successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async destroy({ response, params }: HttpContextContract) {
    try {
      let { venue_id, id } = params
      
      await Field
        .query()
        .where('id', id)
        .andWhere('venue_id', venue_id)
        .delete()

      response.ok({
        success: true,
        message: "Field deleted successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }
}
