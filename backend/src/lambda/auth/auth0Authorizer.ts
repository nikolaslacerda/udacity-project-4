import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const jwksUrl = 'https://dev-afzmdt0v2nx2tx1q.us.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  logger.info('Verify Token: ', token)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  const response = await Axios.get(jwksUrl)
  const keys = response.data.keys
  const signingKeys = keys.find(key => key.kid === jwt.header.kid)
  logger.info('Signing keys: ', signingKeys)
  if (!signingKeys) throw new Error('The JWKS endpoint did not contain any keys')
  const pemData = signingKeys.x5c[0]
  const cert: string = `-----BEGIN CERTIFICATE-----\n${pemData}\n-----END CERTIFICATE-----`
  const verifiedToken: JwtPayload = verify(token, cert, { algorithms: ['RS256'] }) as JwtPayload
  logger.info('Token verified successfully: ', verifiedToken)
  return verifiedToken
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')
  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')
  const split = authHeader.split(' ')
  const token = split[1]
  return token
}
