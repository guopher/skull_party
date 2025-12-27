import React from 'react'

function Card({ type, isFlipped, isInCollection, onClick }) {
  const shouldShowFace = isInCollection || isFlipped

  return (
    <div 
      className={`card ${type} ${shouldShowFace ? 'face-up' : 'face-down'}`}
      onClick={onClick}
      title={shouldShowFace ? (type === 'flower' ? 'Flower' : 'Skull') : 'Face Down'}
    >
      {shouldShowFace ? (
        <div className="card-content">
          {type === 'flower' ? '🌸' : '💀'}
        </div>
      ) : (
        <div className="card-back"></div>
      )}
    </div>
  )
}

export default Card

