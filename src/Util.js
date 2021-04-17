export const generateUuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

export const getIsoStringWithTimezoneOffset = dateStringOrTimestamp => {
  const date = !!dateStringOrTimestamp ? new Date(dateStringOrTimestamp) : new Date()
  const timeZoneOffset = - date.getTimezoneOffset()
  const diff = timeZoneOffset >= 0 ? '+' : '-'
  const pad = num => {
    const norm = Math.floor(Math.abs(num))
    return (norm < 10 ? '0' : '') + norm
  }
  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    diff + pad(timeZoneOffset / 60) +
    ':' + pad(timeZoneOffset % 60)
}
