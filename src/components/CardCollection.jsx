import React from 'react'
import Card from './Card'

function CardCollection({ cards, selectedCardId, onCardSelect, disabled = false, isDiscardPhase = false }) {
  return (
    <div className="card-collection">
      <h2>Your Collection</h2>
      {isDiscardPhase && (
        <p className="discard-instruction">Click a card to discard it</p>
      )}
      <div className={`collection-cards ${disabled ? 'disabled' : ''} ${isDiscardPhase ? 'discard-phase' : ''}`}>
        {cards.map((card) => (
          <div 
            key={card.id} 
            className={`collection-card-wrapper ${selectedCardId === card.id ? 'selected' : ''} ${disabled ? 'disabled' : ''} ${isDiscardPhase ? 'discardable' : ''}`}
            onClick={disabled ? undefined : () => onCardSelect(card.id)}
          >
            <Card
              type={card.type}
              isFlipped={false}
              isInCollection={true}
              onClick={disabled ? undefined : () => onCardSelect(card.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default CardCollection

