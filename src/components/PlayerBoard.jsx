import React from 'react'
import CardCollection from './CardCollection'
import LandingZone from './LandingZone'

function PlayerBoard({ 
  player,
  isCurrentPlayer,
  selectedCardId,
  onCardSelect,
  onCardPlace,
  canPlaceCards,
  onStartBidding,
  canStartBidding,
  isFlippingPhase = false,
  canFlip = false,
  flippedCards = [],
  onCardFlip,
  discardPhase = false,
  discardPlayerId = null
}) {
  const isOut = (player.collection?.length || 0) === 0 && (player.landingZone?.length || 0) === 0
  const gameWon = player.roundsWon === 2
  const isDiscardPlayer = discardPhase && discardPlayerId === player.id

  return (
    <div className={`player-board ${isCurrentPlayer ? 'current-player' : ''} ${isOut ? 'player-out' : ''}`}>
      <div className="player-header">
        <h2>{player.name}</h2>
        {isOut && <span className="out-badge">Out</span>}
        {gameWon && <span className="game-won-badge">Game Won!</span>}
      </div>
      
      {!isOut && (
        <>
          <CardCollection
            cards={player.collection}
            selectedCardId={selectedCardId}
            onCardSelect={canPlaceCards || isDiscardPlayer ? onCardSelect : () => {}}
            disabled={!canPlaceCards && !isDiscardPlayer}
            isDiscardPhase={isDiscardPlayer}
          />
          <LandingZone
            cards={player.landingZone}
            roundsWon={player.roundsWon}
            onCardPlace={canPlaceCards ? onCardPlace : () => {}}
            selectedCardId={selectedCardId}
            disabled={!canPlaceCards && !isFlippingPhase}
            playerId={player.id}
            flippedCards={flippedCards}
            onCardFlip={onCardFlip}
            isFlippingPhase={isFlippingPhase}
            canFlip={canFlip}
          />
          {isCurrentPlayer && canStartBidding && !isFlippingPhase && (
            <button className="start-bidding-btn" onClick={onStartBidding}>
              Start Bidding
            </button>
          )}
        </>
      )}
      
      {isOut && (
        <div className="player-out-message">
          No cards remaining
        </div>
      )}
    </div>
  )
}

export default PlayerBoard

