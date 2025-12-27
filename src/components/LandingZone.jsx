import React from 'react'
import Card from './Card'

function LandingZone({ 
  cards, 
  roundsWon, 
  onCardPlace, 
  selectedCardId, 
  disabled = false,
  playerId,
  flippedCards = [],
  onCardFlip,
  isFlippingPhase = false,
  canFlip = false
}) {
  const handleZoneClick = () => {
    if (!disabled && selectedCardId && !isFlippingPhase) {
      onCardPlace(selectedCardId)
    }
  }

  const handleCardClick = (cardId) => {
    if (isFlippingPhase && canFlip) {
      const isFlipped = flippedCards.some(f => f.playerId === playerId && f.cardId === cardId)
      if (!isFlipped) {
        onCardFlip(playerId, cardId)
      }
    }
  }

  const isCardFlipped = (cardId) => {
    return flippedCards.some(f => f.playerId === playerId && f.cardId === cardId)
  }

  return (
    <div className={`landing-zone ${disabled ? 'disabled' : ''} ${isFlippingPhase ? 'flipping-phase' : ''}`} onClick={handleZoneClick}>
      <div className="landing-zone-header">
        <h2>Landing Zone</h2>
        {roundsWon > 0 && (
          <div className="round-indicator">
            {roundsWon === 1 && <span className="round-badge">Round 1 Won ⭐</span>}
            {roundsWon === 2 && <span className="round-badge game-won">Game Won! 🏆</span>}
          </div>
        )}
        {isFlippingPhase && canFlip && (
          <div className="flipping-indicator">
            Click cards to flip them
          </div>
        )}
      </div>
      <div className="landing-zone-cards">
        {cards.length === 0 ? (
          <div className="empty-zone">
            {disabled ? 'Waiting...' : selectedCardId ? 'Click to place selected card' : 'Select a card from your collection'}
          </div>
        ) : (
          cards.map((card, index) => {
            const flipped = isCardFlipped(card.id)
            return (
              <div 
                key={card.id} 
                className={`landing-card-wrapper ${flipped ? 'flipped' : ''} ${isFlippingPhase && canFlip && !flipped ? 'flippable' : ''}`}
                onClick={() => handleCardClick(card.id)}
              >
                <Card
                  type={card.type}
                  isFlipped={flipped}
                  isInCollection={false}
                  onClick={() => handleCardClick(card.id)}
                />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default LandingZone

