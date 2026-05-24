const PORTFOLIO_KEY = 'bekle_portfolio'
const API_KEY_KEY = 'bekle_apikey'

export function getPortfolio() {
  try {
    return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || '[]')
  } catch {
    return []
  }
}

export function savePortfolio(items) {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(items))
}

export function addToPortfolio(item) {
  const items = getPortfolio()
  items.push({ ...item, id: Date.now().toString() })
  savePortfolio(items)
  return items
}

export function removeFromPortfolio(id) {
  const items = getPortfolio().filter(i => i.id !== id)
  savePortfolio(items)
  return items
}

export function getApiKey() {
  return localStorage.getItem(API_KEY_KEY) || ''
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_KEY, key)
}
