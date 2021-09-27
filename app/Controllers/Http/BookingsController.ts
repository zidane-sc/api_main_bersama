import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import Database from '@ioc:Adonis/Lucid/Database'
import User from 'App/Models/User'
import Booking from 'App/Models/Booking'
import Field from 'App/Models/Field'
import BookingValidator from 'App/Validators/BookingValidator'

export default class BookingsController {
  public async index({ request, response }: HttpContextContract) {
    try {
      const { venue_id, start_date, end_date } = request.qs()

      let bookings = await Booking
        .query()
        .preload('field')
        .preload('players')
        .withCount('players', (query) => {
          query.as('player_count')
        })

        if (venue_id && start_date && end_date) {
        bookings = await Booking
          .query()
          .whereHas('field', (fieldQuery) => {
            fieldQuery.where('venue_id', venue_id)
          })
          .whereBetween('play_date_start', [start_date, end_date])
          .whereBetween('play_date_end', [start_date, end_date])
          .preload('field')
          .preload('players')
          .withCount('players', (query) => {
            query.as('player_count')
          })
      } else if (venue_id) {
        bookings = await Booking
        .query()
        .whereHas('field', (fieldQuery) => {
          fieldQuery.where('venue_id', venue_id)
        })
        .preload('field')
        .preload('players')
        .withCount('players', (query) => {
          query.as('player_count')
        })
      } else if (start_date && end_date) {
        bookings = await Booking
          .query()
          .whereBetween('play_date_start', [start_date, end_date])
          .whereBetween('play_date_end', [start_date, end_date])
          .preload('field')
          .preload('players')
          .withCount('players', (query) => {
            query.as('player_count')
          })
      }

      const bookingSerialize = bookings.map((booking) => booking.serialize())

      response.ok({
        success: true,
        message: "Success get all data bookings",
        data: bookingSerialize
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

      let booking = await Booking
          .query()
          .where('id', id)
          .preload('field')
          .preload('players')
          .withCount('players', (query) => {
            query.as('player_count')
          })
          .firstOrFail()

      response.ok({
        success: true,
        message: "Success get detail data booking",
        data: booking
      })
    } catch (error) {
      response.badRequest({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async update({ auth, request, response, params }: HttpContextContract) {
    try {
      let { id } = params
      const payload = await request.validate(BookingValidator)
      
      const field = await Field.findOrFail(payload.field_id)
      const user = auth.user!

      const booking = await Booking.findOrFail(id)

      // check only user who create can update this booking
      if (user.id != booking.userId) {
        throw new Error("Only creator who can update the booking");
      }

      // Check if field busy
      const check = await Booking
        .query()
        .where('field_id', payload.field_id)
        .whereNot('id', booking.id)
        .where((query) => {
          query
            .whereBetween('play_date_start', [payload.play_date_start.toISO(), payload.play_date_end.toISO()])
            .orWhereBetween('play_date_end', [payload.play_date_start.toISO(), payload.play_date_end.toISO()])
        })

      if (check.length > 0) throw new Error("Sorry, the field you requested is not available, try in different hours");
    

      booking.playDateStart = payload.play_date_start
      booking.playDateEnd = payload.play_date_end

      await booking.related('field').associate(field)
      await booking.related('user').associate(user)

      response.ok({
        success: true,
        message: "Booking updated successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async destroy({ auth, response, params }: HttpContextContract) {
    try {
      let { id } = params
      const user = auth.user
      const booking = await Booking.findOrFail(id)

      // check only user who create can update the data
      if (user?.id != booking.userId) {
        throw new Error("Only creator who can delete this booking");
      }

      await booking.related('field').dissociate()
      await booking.related('user').dissociate()
      await booking.delete()

      response.ok({
        success: true,
        message: "Booking deleted successfully"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async join({ auth, response, params }: HttpContextContract) {
    try {
      const { id } = params
      const booking = await Booking.query().withCount('players', (query) => {
        query.as('player_count')
      })
      .where('id', id)
      .firstOrFail()

      const user = auth.user!

      const checkBooking = await Database
        .from('users_has_bookings')
        .where('user_id', user.id)
        .where('booking_id', booking.id)

      if (checkBooking.length > 0) {
        throw new Error("Failed, you have joined");
      }

      // Check if players in booking is full
      if (booking.maxPlayers != null && booking.$extras.player_count >= booking.maxPlayers) {
        throw new Error("Failed, players are full");
      }

      await booking.related('players').attach([user.id])

      response.ok({
        success: true,
        message: "Success join booking"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.messages ?? error.message
      })
    }
  }

  public async unjoin({ auth, response, params }: HttpContextContract) {
    try {
      const { id } = params
      const booking = await Booking.findOrFail(id)
      const user = auth.user!

      const checkBooking = await Database
        .from('users_has_bookings')
        .where('user_id', user.id)
        .where('booking_id', booking.id)

      if (checkBooking.length == 0) {
        throw new Error("Failed, you haven't joined yet");
      }

      await booking.related('players').detach([user.id])

      response.ok({
        success: true,
        message: "Success unjoin booking"
      })
    } catch (error) {
      response.unprocessableEntity({
        success: false,
        message: error.message ?? error.messages
      })
    }
  }

  public async schedules({ auth, response }: HttpContextContract) {
    try {
      const user = auth.user!
      let schedule = await User
        .query()
        .where('id', user.id)
        .preload('playSchedules', (scheduleQuery) => {
          scheduleQuery.withCount('players', (query) => {
            query.as('player_count')
          })
        })

      response.ok({
        success: true,
        message: "Get schedules from " + user.name,
        data: schedule
      })
    } catch (error) {
      response.badRequest({
        success: false,
        message: error.message ?? error.messages
      })
    }
  }
}
