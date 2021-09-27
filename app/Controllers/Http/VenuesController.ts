import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import VenueValidator from 'App/Validators/VenueValidator'
import Venue from 'App/Models/Venue'
import BookingValidator from 'App/Validators/BookingValidator'
import Field from 'App/Models/Field'
import { schema } from '@ioc:Adonis/Core/Validator'
import Booking from 'App/Models/Booking'

export default class VenuesController {
  public async index({ request, response }: HttpContextContract) {
    const search = schema.create({
      type: schema.enum.optional(
        ['soccer', 'minisoccer', 'futsal', 'basketball', 'volleyball'] as const
      )
    })

    try {
      const payload = await request.validate({
        schema: search
      })

      const { type } = payload

      let venues = await Venue.query().preload('fields').preload('user')

      if (type) {
        venues = await Venue
          .query()
          .whereHas('fields', (fieldQuery) => {
            fieldQuery.where('type', type)
          })
          .preload('fields')
          .preload('user')
      }

      response.ok({
        success: true,
        message: "Success get all data venues",
        data: venues
      })
    } catch (error) {
      response.badRequest({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async store({ auth, request, response }: HttpContextContract) {
    try {
      const venue = await request.validate(VenueValidator)

      const user = auth.user
      await user?.related('venues').create(venue)

      response.created({
        success: true,
        message: "Venue added successfully"
      })
    } catch (error) {
      response.badRequest({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async show({ response, params }: HttpContextContract) {
    try {
      let { id } = params

      let venue = await Venue
        .query()
        .where('id', id)
        .preload('fields', (fieldQuery) => {
          fieldQuery.preload('bookings')
        })
        .firstOrFail()

      response.ok({
        success: true,
        message: "Success get detail data venue",
        data: venue
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async update({ auth, request, response, params }: HttpContextContract) {
    try {
      const payload = await request.validate(VenueValidator)
      const { id } = params
      const user = auth.user
      const venue = await Venue.findOrFail(id)
      await venue
        .merge({
          name: payload.name,
          address: payload.address,
          phone: payload.phone,
          userId: user?.id
        })
        .save()

      response.ok({
        success: true,
        message: "Venue updated successfully"
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
      let { id } = params

      const venue = await Venue.findOrFail(id)
      await venue.delete()

      response.ok({
        success: true,
        message: "Venue deleted successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async booking({ auth, request, response, params }: HttpContextContract) {
    try {
      const venueId = params.id
      const payload = await request.validate(BookingValidator)

      const field = await Field.findOrFail(payload.field_id)
      const user = auth.user!
    
      // Throw error if venue id not equal field.venue id
      if (field.venueId != venueId) throw new Error("Field with id " + field.venueId + " in venue with id " + venueId + " Not Found");

      const check = await Booking
        .query()
        .where('field_id', payload.field_id)
        .where((query) => {
          query
            .whereBetween('play_date_start', [payload.play_date_start.toISO(), payload.play_date_end.toISO()])
            .orWhereBetween('play_date_end', [payload.play_date_start.toISO(), payload.play_date_end.toISO()])
        })

      const booking = await user?.related('bookings').create({
        playDateStart: payload.play_date_start,
        playDateEnd: payload.play_date_end,
        minPlayers: payload.min_players,
        maxPlayers: payload.max_players,
      })

      await booking?.related('field').associate(field)

      // User automate join
      await booking?.related('players').attach([user?.id])

      response.created({
        success: true,
        message: "Success create booking",
        data: booking
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }
}
