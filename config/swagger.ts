import { SwaggerConfig } from '@ioc:Adonis/Addons/Swagger'

export default {
  uiEnabled: true, //disable or enable swaggerUi route
  uiUrl: 'docs', // url path to swaggerUI
  specEnabled: true, //disable or enable swagger.json route
  specUrl: '/swagger.json',

  middleware: [], // middlewares array, for protect your swagger docs and spec endpoints

  options: {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'API Main Bersama',
        version: '1.0.0',
        description: 'Documentation of My API Main Bersama for connecting other people'
      },
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer'
          }
        }
      }
    },

    apis: [
      'app/**/*.ts',
      'docs/swagger/**/*.yml',
      'start/routes.ts'
    ],
    basePath: '/'
  },
  mode: process.env.NODE_ENV === 'production' ? 'RUNTIME' : 'RUNTIME',
  specFilePath: 'docs/swagger.json'
} as SwaggerConfig
