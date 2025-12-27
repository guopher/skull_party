import React, { useState, useEffect } from 'react'

function BiddingPanel({ 
  currentPlayerId, 
  currentPlayerName, 
  otherPlayerName,
  totalCardsInLandingZones, 
  currentBid,
  bidderId,
  biddingState,
  onBidSubmit,
  onBidIncrease,
  onBidDecline
}) {
  const [bidAmount, setBidAmount] = useState(1)

  useEffect(() => {
    // Set minimum bid based on current bid
    if (biddingState === 'counter' && currentBid) {
      setBidAmount(currentBid + 1)
    } else {
      setBidAmount(1)
    }
  }, [biddingState, currentBid])

  const handleSubmit = () => {
    if (biddingState === 'initial') {
      // First bid
      if (bidAmount >= 1 && bidAmount <= totalCardsInLandingZones) {
        onBidSubmit(currentPlayerId, bidAmount)
      }
    } else if (biddingState === 'counter') {
      // Counter bid (must be higher)
      if (bidAmount > currentBid && bidAmount <= totalCardsInLandingZones) {
        onBidIncrease(currentPlayerId, bidAmount)
      }
    }
  }

  const minBid = biddingState === 'counter' ? (currentBid || 0) + 1 : 1
  const maxBid = totalCardsInLandingZones
  const isMaxBid = bidAmount >= maxBid

  return (
    <div className="bidding-panel">
      <div className="bidding-content">
        {biddingState === 'initial' && (
          <>
            <h3>{currentPlayerName}'s Turn to Bid</h3>
            <p>How many cards can you flip? (1 - {totalCardsInLandingZones})</p>
            {isMaxBid && (
              <p className="max-bid-warning">⚠️ Bidding {maxBid} will flip ALL cards automatically!</p>
            )}
          </>
        )}
        {biddingState === 'counter' && (
          <>
            <h3>{currentPlayerName}'s Turn to Counter-Bid</h3>
            <p>{otherPlayerName} bid {currentBid} cards. You must bid higher or decline.</p>
            <p>Minimum bid: {minBid} cards</p>
            {isMaxBid && (
              <p className="max-bid-warning">⚠️ Bidding {maxBid} will flip ALL cards automatically!</p>
            )}
          </>
        )}
        <div className="bid-input-group">
          <input
            type="number"
            min={minBid}
            max={totalCardsInLandingZones}
            value={bidAmount}
            onChange={(e) => setBidAmount(Math.max(minBid, Math.min(totalCardsInLandingZones, parseInt(e.target.value) || minBid)))}
            className="bid-input"
          />
          <div className="bid-buttons">
            {biddingState === 'initial' && (
              <button onClick={handleSubmit} className="bid-submit-btn">
                Submit Bid
              </button>
            )}
            {biddingState === 'counter' && (
              <>
                <button onClick={handleSubmit} className="bid-submit-btn">
                  Increase Bid
                </button>
                <button onClick={onBidDecline} className="bid-decline-btn">
                  Decline
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BiddingPanel

