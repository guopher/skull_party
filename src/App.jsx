import React, { useState, useEffect, useMemo } from 'react'
import GameBoard from './components/GameBoard'
import { useLocalStorage } from './hooks/useLocalStorage'
import { 
  createInitialState, 
  checkPlayerOut, 
  checkGameWon, 
  getTotalCardsInLandingZones,
  getPlayer,
  migrateGameState,
  canStartBidding
} from './utils/gameState'
import {
  canCounterBid,
  canFlipOwnCards,
  canFlipOtherCards,
  checkBidSuccess
} from './utils/biddingLogic'

function App() {
  const [rawGameState, setRawGameState] = useLocalStorage('skullGameState', createInitialState())
  
  // Migrate old state structure if needed
  const gameState = useMemo(() => migrateGameState(rawGameState), [rawGameState])
  
  // Update localStorage if migration happened (only once on mount)
  useEffect(() => {
    if (!rawGameState?.players || !Array.isArray(rawGameState.players)) {
      setRawGameState(gameState)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  
  const setGameState = setRawGameState
  const [selectedCardId, setSelectedCardId] = useState(null)

  // Safety check for players array
  const players = gameState?.players || []
  const totalCardsInLandingZones = getTotalCardsInLandingZones(players)

  // Update derived state for all players when collection, landing zone, or roundsWon changes
  useEffect(() => {
    if (!players || players.length === 0) return
    
    setGameState(prev => {
      if (!prev.players || !Array.isArray(prev.players)) {
        return migrateGameState(prev)
      }
      
      const newPlayers = prev.players.map(player => ({
        ...player,
        isOut: checkPlayerOut(player.collection || [], player.landingZone || []),
        gameWon: checkGameWon(player.roundsWon || 0)
      }))
      
      // Only update if something changed
      const hasChanges = newPlayers.some((p, i) => 
        p.isOut !== prev.players[i]?.isOut || p.gameWon !== prev.players[i]?.gameWon
      )
      
      return hasChanges ? { ...prev, players: newPlayers } : prev
    })
  }, [players.map(p => `${p?.collection?.length || 0}-${p?.landingZone?.length || 0}-${p?.roundsWon || 0}`).join('|'), setGameState])

  // User can control both players - auto-place card when clicked
  const handleCardSelect = (cardId, playerId) => {
    // If in discard phase, handle discard instead
    if (gameState?.discardPhase && gameState?.discardPlayerId === playerId) {
      handleDiscardCard(cardId, playerId)
      return
    }
    
    if (gameState?.biddingPhase || !players) return
    
    const player = players.find(p => p.id === playerId && p?.collection?.some(c => c.id === cardId))
    if (!player) return
    
    if (player.isOut || player.gameWon) return
    
    // Automatically place the card in landing zone
    handleCardPlace(cardId, playerId)
  }

  const handleDiscardCard = (cardId, playerId) => {
    if (!gameState?.discardPhase || gameState?.discardPlayerId !== playerId) return
    
    const player = players.find(p => p.id === playerId)
    if (!player) return
    
    // Remove the card from collection and return all cards from landing zones to collections
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => {
        // Return all landing zone cards to collection (reset isFlipped)
        const returnedCards = p.landingZone.map(c => ({ ...c, isFlipped: false }))
        
        if (p.id === playerId) {
          // For the discarding player: remove discarded card, then add returned cards
          return {
            ...p,
            collection: [...p.collection.filter(card => card.id !== cardId), ...returnedCards],
            landingZone: []
          }
        } else {
          // For other players: just add returned cards
          return {
            ...p,
            collection: [...p.collection, ...returnedCards],
            landingZone: []
          }
        }
      }),
      discardPhase: false,
      discardPlayerId: null
    }))
    setSelectedCardId(null)
  }

  const handleCardPlace = (cardId, playerId) => {
    if (gameState?.biddingPhase || gameState?.discardPhase || !players) return
    
    const player = players.find(p => p.id === playerId && p?.collection?.some(c => c.id === cardId))
    if (!player) return
    
    if (player.isOut || player.gameWon) return
    
    // Find the card in collection
    const cardIndex = player.collection.findIndex(card => card.id === cardId)
    if (cardIndex === -1) return

    // Move card from collection to landing zone
    const cardToMove = player.collection[cardIndex]
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(p => 
        p.id === player.id
          ? {
              ...p,
              collection: p.collection.filter(card => card.id !== cardId),
              landingZone: [...p.landingZone, { ...cardToMove, isFlipped: false }]
            }
          : p
      )
    }))

    // Clear selection
    setSelectedCardId(null)
  }

  const handleBidSubmit = (playerId, bidAmount) => {
    // Check if bid equals total cards - if so, auto-flip all cards
    if (bidAmount >= totalCardsInLandingZones) {
      // Auto-flip all cards
      const allFlippedCards = players.flatMap(player => 
        player.landingZone.map(card => ({ playerId: player.id, cardId: card.id }))
      )
      
      // Check if all are flowers
      const allFlowers = allFlippedCards.every(f => {
        const player = players.find(p => p.id === f.playerId)
        const card = player?.landingZone.find(c => c.id === f.cardId)
        return card?.type === 'flower'
      })
      
      if (allFlowers) {
        // Award round win
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === playerId
              ? { ...p, roundsWon: (p.roundsWon || 0) + 1 }
              : p
          ),
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: []
        }))
      } else {
        // Failed - skull was flipped, enter discard phase
        setGameState(prev => ({
          ...prev,
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: [],
          discardPhase: true,
          discardPlayerId: playerId
        }))
      }
      setSelectedCardId(null)
      return
    }
    
    // First bid - now other player can counter
    const otherPlayer = players.find(p => p.id !== playerId)
    setGameState(prev => ({
      ...prev,
      biddingPhase: true,
      biddingState: 'counter',
      currentBid: bidAmount,
      bidderId: playerId,
      currentPlayerId: otherPlayer?.id || prev.currentPlayerId
    }))
    setSelectedCardId(null)
  }

  const handleBidIncrease = (playerId, bidAmount) => {
    // Check if bid equals total cards - if so, auto-flip all cards
    if (bidAmount >= totalCardsInLandingZones) {
      // Auto-flip all cards
      const allFlippedCards = players.flatMap(player => 
        player.landingZone.map(card => ({ playerId: player.id, cardId: card.id }))
      )
      
      // Check if all are flowers
      const allFlowers = allFlippedCards.every(f => {
        const player = players.find(p => p.id === f.playerId)
        const card = player?.landingZone.find(c => c.id === f.cardId)
        return card?.type === 'flower'
      })
      
      if (allFlowers) {
        // Award round win
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === playerId
              ? { ...p, roundsWon: (p.roundsWon || 0) + 1 }
              : p
          ),
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: []
        }))
      } else {
        // Failed - skull was flipped, enter discard phase
        setGameState(prev => ({
          ...prev,
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: [],
          discardPhase: true,
          discardPlayerId: playerId
        }))
      }
      setSelectedCardId(null)
      return
    }
    
    // Counter bid - switch back to original bidder
    const originalBidder = gameState.bidderId
    const otherPlayer = players.find(p => p.id !== playerId)
    setGameState(prev => ({
      ...prev,
      currentBid: bidAmount,
      bidderId: playerId,
      currentPlayerId: otherPlayer?.id || prev.currentPlayerId
    }))
    setSelectedCardId(null)
  }

  const handleBidDecline = () => {
    // Other player declined - winner can now flip cards
    setGameState(prev => ({
      ...prev,
      biddingPhase: true,
      biddingState: 'flipping',
      flippedCards: [],
      currentPlayerId: prev.bidderId // Set to bidder so they can flip
    }))
    setSelectedCardId(null)
  }

  const handleStartBidding = () => {
    // Can only bid if all players have at least one card in landing zone
    if (canStartBidding(players)) {
      setGameState(prev => ({
        ...prev,
        biddingPhase: true,
        biddingState: 'initial',
        currentBid: null,
        bidderId: null,
        flippedCards: []
      }))
    }
  }

  const handleCardFlip = (playerId, cardId) => {
    const bidder = getPlayer(players, gameState.bidderId)
    if (!bidder || gameState.biddingState !== 'flipping') return

    // Check if card is already flipped
    const flippedCards = gameState.flippedCards || []
    const alreadyFlipped = flippedCards.some(f => f.playerId === playerId && f.cardId === cardId)
    if (alreadyFlipped) return

    const isOwnCard = playerId === gameState.bidderId
    
    if (isOwnCard) {
      // Must flip own cards first - check if we still have unflipped own cards
      const ownFlipped = flippedCards.filter(f => f.playerId === gameState.bidderId)
      if (ownFlipped.length >= bidder.landingZone.length) {
        // All own cards already flipped, can't flip more own cards
        return
      }
    } else {
      // Can only flip other cards after all own cards are flipped
      const ownFlipped = flippedCards.filter(f => f.playerId === gameState.bidderId)
      if (ownFlipped.length < bidder.landingZone.length) {
        // Haven't flipped all own cards yet
        return
      }
    }

    // Flip the card
    const newFlippedCards = [...flippedCards, { playerId, cardId }]
    
    setGameState(prev => ({
      ...prev,
      flippedCards: newFlippedCards
    }))

    // Check if bid is complete
    const bidAmount = gameState.currentBid
    if (newFlippedCards.length === bidAmount) {
      // Check if successful
      const success = checkBidSuccess(gameState.bidderId, bidAmount, newFlippedCards, players)
      
      if (success) {
        // Award round win
        setGameState(prev => ({
          ...prev,
          players: prev.players.map(p => 
            p.id === gameState.bidderId
              ? { ...p, roundsWon: (p.roundsWon || 0) + 1 }
              : p
          ),
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: []
        }))
      } else {
        // Failed - skull was flipped, enter discard phase
        setGameState(prev => ({
          ...prev,
          biddingPhase: false,
          biddingState: null,
          currentBid: null,
          bidderId: null,
          flippedCards: [],
          discardPhase: true,
          discardPlayerId: prev.bidderId
        }))
      }
    }
  }

  const handleRestart = () => {
    // Move all cards from landing zones back to collections
    setGameState(prev => ({
      ...prev,
      players: prev.players.map(player => ({
        ...player,
        collection: [...player.collection, ...player.landingZone.map(c => ({ ...c, isFlipped: false }))],
        landingZone: []
      })),
      biddingPhase: false,
      biddingState: null,
      currentBid: null,
      bidderId: null,
      flippedCards: [],
      discardPhase: false,
      discardPlayerId: null
    }))
    setSelectedCardId(null)
  }

  const handleRestartGame = () => {
    // Completely reset the game to initial state
    const initialState = createInitialState()
    setRawGameState(initialState)
    setSelectedCardId(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Skull Party</h1>
        <div className="header-controls">
          {gameState?.currentBid && (
            <div className="current-bid-display">
              Current Bid: {getPlayer(players, gameState.bidderId)?.name} bid {gameState.currentBid} cards
            </div>
          )}
          <div className="restart-buttons">
            <button className="restart-btn" onClick={handleRestart}>
              Restart (Return All Cards)
            </button>
            <button className="restart-game-btn" onClick={handleRestartGame}>
              Restart Game
            </button>
          </div>
        </div>
      </header>
      <GameBoard
        players={players}
        currentPlayerId={gameState?.currentPlayerId || 'player1'}
        biddingPhase={gameState?.biddingPhase || false}
        biddingState={gameState?.biddingState}
        currentBid={gameState?.currentBid}
        bidderId={gameState?.bidderId}
        flippedCards={gameState?.flippedCards || []}
        totalCardsInLandingZones={totalCardsInLandingZones}
        selectedCardId={selectedCardId}
        onCardSelect={handleCardSelect}
        onCardPlace={handleCardPlace}
        onBidSubmit={handleBidSubmit}
        onBidIncrease={handleBidIncrease}
        onBidDecline={handleBidDecline}
        onStartBidding={handleStartBidding}
        onCardFlip={handleCardFlip}
        canStartBidding={canStartBidding(players)}
        discardPhase={gameState?.discardPhase || false}
        discardPlayerId={gameState?.discardPlayerId}
      />
    </div>
  )
}

export default App

