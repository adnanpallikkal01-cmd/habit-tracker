// Simple nanoid alternative (no dependency needed)
export const nanoid = (size = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  const array = new Uint8Array(size)
  crypto.getRandomValues(array)
  array.forEach(b => { id += chars[b % chars.length] })
  return id
}
