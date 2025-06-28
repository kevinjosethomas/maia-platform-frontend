import { buildUrl } from 'src/api'

const parseAccountInfo = (data: { [x: string]: string }) => {
  const clientId = data['client_id']
  const displayName = data['display_name']
  const lichessId = data['lichess_id']

  return {
    clientId: clientId,
    displayName: displayName,
    lichessId: lichessId,
  }
}

export const getAccount = async () => {
  const res = await fetch(buildUrl('auth/account'))
  const data = await res.json()

  return parseAccountInfo(data)
}

export const logoutAndGetAccount = async () => {
  await fetch(buildUrl('auth/logout'))

  return getAccount()
}

export const getLeaderboard = async () => {
  const res = await fetch(buildUrl('auth/leaderboard'))
  const data = await res.json()

  return data
}

export const getGlobalStats = async () => {
  const res = await fetch(buildUrl('auth/global_stats'))
  const data = await res.json()

  return data
}
