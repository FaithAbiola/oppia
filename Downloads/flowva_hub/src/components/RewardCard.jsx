import './RewardCard.css'

const RewardCard = ({ reward, userPoints, onClaim, isClaiming }) => {
  const canAfford = userPoints >= reward.points_required
  const isClaimed = reward.claimed || false

  const handleClaim = () => {
    if (canAfford && !isClaimed && !isClaiming) {
      onClaim(reward)
    }
  }

  return (
    <div className={`reward-card ${isClaimed ? 'claimed' : ''} ${!canAfford ? 'insufficient-points' : ''}`}>
      <div className="reward-image">
        {reward.image_url ? (
          <img src={reward.image_url} alt={reward.title} />
        ) : (
          <div className="reward-image-placeholder">
            <span>🎁</span>
          </div>
        )}
      </div>
      <div className="reward-content">
        <h3 className="reward-title">{reward.title}</h3>
        <p className="reward-description">{reward.description}</p>
        <div className="reward-footer">
          <div className="reward-points">
            <span className="points-label">Points:</span>
            <span className="points-value">{reward.points_required}</span>
          </div>
          {isClaimed ? (
            <button className="claim-button claimed-button" disabled>
              Claimed ✓
            </button>
          ) : (
            <button
              className={`claim-button ${canAfford ? 'available' : 'unavailable'}`}
              onClick={handleClaim}
              disabled={!canAfford || isClaiming}
            >
              {isClaiming ? 'Claiming...' : canAfford ? 'Claim Reward' : 'Insufficient Points'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default RewardCard








