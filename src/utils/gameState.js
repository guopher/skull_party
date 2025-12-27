const createPlayerState = (playerId, name) => ({
  id: playerId,
  name,
  collection: [
    { id: `${playerId}-1`, type: 'flower', isFlipped: false },
    { id: `${playerId}-2`, type: 'flower', isFlipped: false },
    { id: `${playerId}-3`, type: 'flower', isFlipped: false },
    { id: `${playerId}-4`, type: 'skull', isFlipped: false }
  ],
  landingZone: [],
  roundsWon: 0,
  isOut: false,
  gameWon: false
})

export const createInitialState = () => ({
  players: [
    createPlayerState('player1', 'Player 1'),
    createPlayerState('player2', 'Player 2')
  ],
  currentPlayerId: 'player1',
  biddingPhase: false, // true when someone is bidding
  biddingState: null, // 'initial', 'counter', 'flipping'
  currentBid: null,
  bidderId: null,
  flippedCards: [], // Array of {playerId, cardId} for flipped cards
  discardPhase: false, // true when a player needs to discard a card
  discardPlayerId: null // which player needs to discard
})

export const checkPlayerOut = (collection, landingZone) => {
  return (collection?.length || 0) === 0 && (landingZone?.length || 0) === 0
}

export const canStartBidding = (players) => {
  if (!players || !Array.isArray(players)) return false
  // All players must have at least one card in their landing zone
  return players.every(player => (player?.landingZone?.length || 0) > 0)
}

export const checkGameWon = (roundsWon) => {
  return roundsWon === 2
}

export const getTotalCardsInLandingZones = (players) => {
  if (!players || !Array.isArray(players)) return 0
  return players.reduce((total, player) => total + (player?.landingZone?.length || 0), 0)
}

export const getPlayer = (players, playerId) => {
  if (!players || !Array.isArray(players)) return null
  return players.find(p => p.id === playerId)
}

// Migrate old state structure to new structure
export const migrateGameState = (oldState) => {
  // If it already has the new structure, return as is
  if (oldState && oldState.players && Array.isArray(oldState.players)) {
    return oldState
  }

  // If it's the old single-player structure, migrate it
  if (oldState && (oldState.collection || oldState.landingZone)) {
    return {
      players: [
        {
          id: 'player1',
          name: 'Player 1',
          collection: oldState.collection || createPlayerState('player1', 'Player 1').collection,
          landingZone: oldState.landingZone || [],
          roundsWon: oldState.roundsWon || 0,
          isOut: checkPlayerOut(oldState.collection || [], oldState.landingZone || []),
          gameWon: checkGameWon(oldState.roundsWon || 0)
        },
        createPlayerState('player2', 'Player 2')
      ],
      currentPlayerId: 'player1',
      biddingPhase: false,
      biddingState: null,
      currentBid: null,
      bidderId: null,
      flippedCards: [],
      discardPhase: false,
      discardPlayerId: null
    }
  }

  // If it's completely invalid, return initial state
  return createInitialState()
}

