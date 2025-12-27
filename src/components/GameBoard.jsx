import React from 'react'
import PlayerBoard from './PlayerBoard'
import BiddingPanel from './BiddingPanel'

function GameBoard({ 
  players,
  currentPlayerId,
  biddingPhase,
  biddingState,
  currentBid,
  bidderId,
  flippedCards,
  totalCardsInLandingZones,
  selectedCardId,
  onCardSelect,
  onCardPlace,
  onBidSubmit,
  onBidIncrease,
  onBidDecline,
  onStartBidding,
  onCardFlip,
  canStartBidding,
  discardPhase,
  discardPlayerId
}) {
  const currentPlayer = players.find(p => p.id === currentPlayerId)
  const otherPlayer = players.find(p => p.id !== currentPlayerId)
  const bidder = players.find(p => p.id === bidderId)
  const discardPlayer = players.find(p => p.id === discardPlayerId)
  
  // User can control both players - no turn restrictions (except during bidding or discard)
  const canPlaceCards = (!biddingPhase || biddingState === null) && !discardPhase

  return (
    <div className="game-board">
      {biddingPhase && biddingState !== 'flipping' && currentPlayer && (
        <BiddingPanel
          currentPlayerId={currentPlayerId}
          currentPlayerName={currentPlayer.name}
          otherPlayerName={bidder?.name || ''}
          totalCardsInLandingZones={totalCardsInLandingZones}
          currentBid={currentBid}
          bidderId={bidderId}
          biddingState={biddingState}
          onBidSubmit={onBidSubmit}
          onBidIncrease={onBidIncrease}
          onBidDecline={onBidDecline}
        />
      )}
      
      {biddingPhase && biddingState === 'flipping' && bidder && (
        <div className="flipping-phase-panel">
          <h3>{bidder.name} can now flip {currentBid} cards</h3>
          <p>Flip your own cards first, then other players' cards</p>
          <p>Flipped: {flippedCards.length} / {currentBid}</p>
        </div>
      )}
      
      {discardPhase && discardPlayer && (
        <div className="discard-phase-panel">
          <h3>💀 Skull Flipped!</h3>
          <p>{discardPlayer.name} must discard one card from their collection</p>
          <p>Click on a card in {discardPlayer.name}'s collection to discard it</p>
        </div>
      )}
      
      <div className="players-container">
        {players.map((player) => {
          const isBidder = player.id === bidderId
          const isFlippingPhase = biddingState === 'flipping'
          
          // Bidder can flip their own cards if they haven't flipped all yet
          const ownFlippedCount = flippedCards.filter(f => f.playerId === bidderId).length
          const allOwnFlipped = bidder ? ownFlippedCount >= bidder.landingZone.length : false
          
          // For bidder: can flip own cards if not all flipped yet
          const canFlipOwn = isFlippingPhase && isBidder && !allOwnFlipped
          
          // For others: can flip after bidder has flipped all own cards
          const canFlipOthers = isFlippingPhase && !isBidder && allOwnFlipped
          
          // For bidder: can also flip others' cards after flipping all own
          const canFlipOthersAsBidder = isFlippingPhase && isBidder && allOwnFlipped
          
          const canFlip = canFlipOwn || canFlipOthers || canFlipOthersAsBidder
          
          return (
            <PlayerBoard
              key={player.id}
              player={player}
              isCurrentPlayer={player.id === currentPlayerId}
              selectedCardId={selectedCardId}
              onCardSelect={(cardId) => onCardSelect(cardId, player.id)}
              onCardPlace={(cardId) => onCardPlace(cardId, player.id)}
              canPlaceCards={canPlaceCards && !player.isOut && !player.gameWon}
              onStartBidding={onStartBidding}
              canStartBidding={canStartBidding}
              isFlippingPhase={isFlippingPhase}
              canFlip={canFlip}
              flippedCards={flippedCards}
              onCardFlip={onCardFlip}
              discardPhase={discardPhase}
              discardPlayerId={discardPlayerId}
            />
          )
        })}
      </div>
    </div>
  )
}

export default GameBoard

