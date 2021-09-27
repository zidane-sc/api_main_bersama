import { DateTime } from 'luxon'
import Hash from '@ioc:Adonis/Core/Hash'
import {
  column,
  beforeSave,
  BaseModel,
  hasMany,
  HasMany,
  manyToMany,
  ManyToMany
} from '@ioc:Adonis/Lucid/Orm'
import Venue from 'App/Models/Venue'
import Booking from 'App/Models/Booking'

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column()
  public name: string

  @column()
  public role: string

  @column()
  public email: string

  @column({ serializeAs: null })
  public password: string

  @column()
  public isVerified: boolean

  @column()
  public rememberMeToken?: string

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @beforeSave()
  public static async hashPassword (user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password)
    }
  }

  @hasMany(() => Venue)
  public venues: HasMany<typeof Venue>

  @hasMany(() => Booking)
  public bookings: HasMany<typeof Booking>

  @manyToMany(() => Booking, {
    pivotTable: 'users_has_bookings',
  })
  public playSchedules: ManyToMany<typeof Booking>
}
