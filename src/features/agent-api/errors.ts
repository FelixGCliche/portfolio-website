export type ErrorCode =
  | 'payload_too_large'
  | 'invalid_json'
  | 'invalid_request'
  | 'forbidden_origin'
  | 'rate_limited'
  | 'missing_api_key'
  | 'upstream_error'

/** A rejected request, ready to become an error response. */
export type RequestError = { status: number; code: ErrorCode; message: string }

export const INVALID_REQUEST_MESSAGE = 'The request is not a valid chat message.'

export const errorResponse = (status: number, code: ErrorCode, message: string) =>
  Response.json({ error: { code, message } }, { status })
