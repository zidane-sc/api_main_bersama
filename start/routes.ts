/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'
import HealthCheck from '@ioc:Adonis/Core/HealthCheck'

Route.get('/', async ({ response }) => {
  response.redirect().toPath('/docs/index.html')
})

// Route Group With prefix /api/v1
Route.group(() => {
  // Authentication
  Route.post('/register', 'AuthController.register')
  Route.post('/login', 'AuthController.login')
  Route.post('/otp-confirmation', 'AuthController.otpVerification')
  Route.post('/resend-otp-confirmation', 'AuthController.resend')

  // Route group with middleware auth
  Route.group(() => {
    // Venue
    Route.post('/venues/:id/bookings', 'VenuesController.booking').middleware('user')
    Route.resource('/venues', 'VenuesController').apiOnly().middleware({'*': 'owner'})
    
    // Field
    Route.resource('/venues.fields', 'FieldsController').apiOnly().middleware({'*': 'owner'})

    // Booking
    Route.post('/bookings/:id/join', 'BookingsController.join').middleware('user')
    Route.post('/bookings/:id/unjoin', 'BookingsController.unjoin').middleware('user')
    Route.resource('/bookings', 'BookingsController').apiOnly().except([
      'store'
    ]).middleware({'*': 'user'})
    Route.get('/schedules', 'BookingsController.schedules').middleware('user')
  }).middleware(['auth', 'verify'])

  // Health Check
  Route.get('/health', async ({ response }) => {
    const report = await HealthCheck.getReport()
  
    return report.healthy
      ? response.ok(report)
      : response.badRequest(report)
  })
}).prefix('/api/v1')