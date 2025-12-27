// Bidding logic utilities

export const canCounterBid = (currentBid, newBid, totalCards) => {
  // New bid must be higher than current bid
  return newBid > currentBid && newBid <= totalCards
}

export const getBiddingPlayer = (players, bidderId) => {
  return players.find(p => p.id === bidderId)
}

export const getOtherPlayer = (players, bidderId) => {
  return players.find(p => p.id !== bidderId)
}

export const canFlipOwnCards = (player, flippedCards) => {
  // Check if player has unflipped cards in their own landing zone
  const ownFlipped = flippedCards.filter(f => f.playerId === player.id)
  return player.landingZone.length > ownFlipped.length
}

export const canFlipOtherCards = (player, flippedCards, allPlayers) => {
  // Can only flip other cards after all own cards are flipped
  const ownFlipped = flippedCards.filter(f => f.playerId === player.id)
  const allOwnFlipped = ownFlipped.length >= player.landingZone.length
  
  if (!allOwnFlipped) return false
  
  // Check if there are unflipped cards in other players' landing zones
  const totalFlipped = flippedCards.length
  const totalCards = allPlayers.reduce((sum, p) => sum + p.landingZone.length, 0)
  
  return totalFlipped < totalCards
}

export const checkBidSuccess = (bidderId, bidAmount, flippedCards, players) => {
  // Must have flipped exactly the bid amount
  if (flippedCards.length !== bidAmount) return false
  
  // Get all the actual cards that were flipped
  const flippedCardObjects = flippedCards.map(f => {
    const player = players.find(p => p.id === f.playerId)
    if (!player) return null
    return player.landingZone.find(c => c.id === f.cardId)
  }).filter(Boolean)
  
  // All flipped cards must be flowers
  return flippedCardObjects.every(card => card.type === 'flower')
}

