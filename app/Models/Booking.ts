import { DateTime } from 'luxon'
import { BaseModel, BelongsTo, belongsTo, column, ManyToMany, manyToMany } from '@ioc:Adonis/Lucid/Orm'
import Field from 'App/Models/Field'
import User from 'App/Models/User'

export default class Booking extends BaseModel {
  public serializeExtras() {
    return {
      player_count:  this.$extras.player_count ?? 0
    }
  }

  @column({ isPrimary: true })
  public id: number

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value ? value.toUTC().toFormat('y-MM-d HH:mm:ss') : value
    },
  })
  public playDateStart: DateTime

  @column.dateTime({
    serialize: (value: DateTime | null) => {
      return value ? value.toUTC().toFormat('y-MM-d HH:mm:ss') : value
    },
  })
  public playDateEnd: DateTime

  @column()
  public userId: number

  @column()
  public fieldId: number

  @column()
  public minPlayers: number

  @column()
  public maxPlayers: number

  @column.dateTime({ autoCreate: true })
  public createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  public updatedAt: DateTime

  @belongsTo(() => Field)
  public field: BelongsTo<typeof Field>

  @belongsTo(() => User)
  public user: BelongsTo<typeof User>

  @manyToMany(() => User, {
    pivotTable: 'users_has_bookings',
  })
  public players: ManyToMany<typeof User>
}
