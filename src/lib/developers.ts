// Nyx usernames that see developer-only parts of the app.
// Match is case-insensitive. The list of what those gates hide is kept outside the repo.
export const APP_DEVELOPERS = ['B3DA']

export const isAppDeveloper = (username?: string | null) => {
  const name = `${username || ''}`.trim().toLowerCase()
  if (!name) {
    return false
  }
  return APP_DEVELOPERS.some(id => id.toLowerCase() === name)
}
