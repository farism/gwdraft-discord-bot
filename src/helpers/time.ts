import { isMatch, parse } from 'date-fns'

export function parseTime(s: string) {
  if (isMatch(s, 'HH:mm')) {
    return parse(s, 'HH:mm', new Date())
  } else if (isMatch(s, 'HH:mm:ss')) {
    return parse(s, 'HH:mm:ss', new Date())
  }

  return new Date()
}
